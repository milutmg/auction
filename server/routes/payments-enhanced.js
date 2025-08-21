const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const PaymentGatewayService = require('../services/PaymentGatewayService');

const router = express.Router();

// Get available payment providers
router.get('/providers', async (req, res) => {
  try {
    const { amount = 0, currency = 'USD' } = req.query;
    const providers = await PaymentGatewayService.getAvailableProviders(
      parseFloat(amount), 
      currency
    );
    
    res.json({ providers });
  } catch (error) {
    console.error('Get providers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Calculate payment fees
router.post('/calculate-fees', async (req, res) => {
  try {
    const { amount, provider_name } = req.body;
    
    if (!amount || !provider_name) {
      return res.status(400).json({ error: 'Amount and provider name are required' });
    }

    // Get provider fee structure
    const providerResult = await db.query(
      'SELECT fee_structure FROM payment_providers WHERE name = $1 AND is_active = true',
      [provider_name]
    );

    if (providerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Payment provider not found' });
    }

    const feeStructure = providerResult.rows[0].fee_structure;
    const fees = PaymentGatewayService.calculateFees(parseFloat(amount), feeStructure);

    res.json({ fees });
  } catch (error) {
    console.error('Calculate fees error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create payment for order
router.post('/orders/:orderId/pay', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { payment_provider, payment_method, customer_info = {} } = req.body;
    const userId = req.user.id;

    // Get order details
    const orderResult = await db.query(`
      SELECT o.*, a.title as auction_title, a.seller_id,
             winner.email as winner_email, winner.full_name as winner_name
      FROM orders o
      JOIN auctions a ON o.auction_id = a.id
      JOIN users winner ON o.buyer_id = winner.id
      WHERE o.id = $1 AND o.buyer_id = $2
    `, [orderId, userId]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found or not accessible' });
    }

    const order = orderResult.rows[0];

    if (order.payment_status === 'paid') {
      return res.status(400).json({ error: 'Order is already paid' });
    }

    // Create payment transaction
    const transactionData = {
      order_id: orderId,
      auction_id: order.auction_id,
      payer_id: userId,
      recipient_id: order.seller_id,
      payment_provider,
      payment_method,
      gross_amount: parseFloat(order.winning_bid_amount),
      success_url: `${process.env.FRONTEND_URL}/payment/success?order=${orderId}`,
      failure_url: `${process.env.FRONTEND_URL}/payment/failed?order=${orderId}`,
      metadata: {
        auction_title: order.auction_title,
        customer_info
      }
    };

    const transaction = await PaymentGatewayService.createTransaction(transactionData);
    
    // Initiate payment
    const paymentResult = await PaymentGatewayService.initiatePayment(
      transaction.transaction_id,
      {
        customer_name: customer_info.name || order.winner_name,
        customer_email: customer_info.email || order.winner_email,
        customer_phone: customer_info.phone
      }
    );

    // Update order with transaction ID
    await db.query(`
      UPDATE orders 
      SET payment_transaction_id = $1, payment_provider = $2, updated_at = NOW()
      WHERE id = $3
    `, [transaction.id, payment_provider, orderId]);

    res.json({
      success: true,
      transaction_id: transaction.transaction_id,
      payment_result: paymentResult
    });

  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get payment status
router.get('/transactions/:transactionId/status', authenticateToken, async (req, res) => {
  try {
    const { transactionId } = req.params;
    const userId = req.user.id;

    const transaction = await db.query(`
      SELECT pt.*, pp.display_name as provider_name,
             a.title as auction_title, o.id as order_id
      FROM payment_transactions pt
      JOIN payment_providers pp ON pt.payment_provider_id = pp.id
      LEFT JOIN auctions a ON pt.auction_id = a.id
      LEFT JOIN orders o ON pt.order_id = o.id
      WHERE pt.transaction_id = $1 AND (pt.payer_id = $2 OR pt.recipient_id = $2)
    `, [transactionId, userId]);

    if (transaction.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ transaction: transaction.rows[0] });
  } catch (error) {
    console.error('Get transaction status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Handle payment success callback (eSewa, Khalti)
router.post('/callback/success', async (req, res) => {
  try {
    const { provider } = req.query;
    const callbackData = req.body;

    console.log(`Payment success callback from ${provider}:`, callbackData);

    let transactionId;
    
    // Extract transaction ID based on provider
    switch (provider) {
      case 'esewa':
        transactionId = callbackData.oid || callbackData.pid;
        break;
      case 'khalti':
        transactionId = callbackData.purchase_order_id;
        break;
      default:
        transactionId = callbackData.transaction_id;
    }

    if (!transactionId) {
      return res.status(400).json({ error: 'Transaction ID not found in callback' });
    }

    // Verify payment
    const verificationResult = await PaymentGatewayService.verifyPayment(
      transactionId,
      callbackData,
      provider
    );

    if (verificationResult.success) {
      // Update order status
      await db.query(`
        UPDATE orders 
        SET payment_status = 'paid', 
            payment_transaction_id = (SELECT id FROM payment_transactions WHERE transaction_id = $1),
            updated_at = NOW()
        WHERE id = (SELECT order_id FROM payment_transactions WHERE transaction_id = $1)
      `, [transactionId]);

      // Send success response or redirect
      if (provider === 'esewa') {
        res.redirect(`${process.env.FRONTEND_URL}/payment/success?transaction=${transactionId}`);
      } else {
        res.json({
          success: true,
          message: 'Payment verified successfully',
          transaction_id: transactionId
        });
      }
    } else {
      if (provider === 'esewa') {
        res.redirect(`${process.env.FRONTEND_URL}/payment/failed?transaction=${transactionId}&error=verification_failed`);
      } else {
        res.status(400).json({
          success: false,
          error: 'Payment verification failed',
          details: verificationResult.error
        });
      }
    }

  } catch (error) {
    console.error('Payment callback error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Handle payment failure callback
router.post('/callback/failure', async (req, res) => {
  try {
    const { provider } = req.query;
    const callbackData = req.body;

    console.log(`Payment failure callback from ${provider}:`, callbackData);

    // Extract transaction ID and update status
    let transactionId;
    switch (provider) {
      case 'esewa':
        transactionId = callbackData.pid;
        break;
      case 'khalti':
        transactionId = callbackData.purchase_order_id;
        break;
      default:
        transactionId = callbackData.transaction_id;
    }

    if (transactionId) {
      await db.query(`
        UPDATE payment_transactions 
        SET status = 'failed', 
            error_details = $1, 
            updated_at = NOW()
        WHERE transaction_id = $2
      `, [JSON.stringify(callbackData), transactionId]);
    }

    if (provider === 'esewa') {
      res.redirect(`${process.env.FRONTEND_URL}/payment/failed?transaction=${transactionId}`);
    } else {
      res.json({
        success: false,
        message: 'Payment failed',
        transaction_id: transactionId
      });
    }

  } catch (error) {
    console.error('Payment failure callback error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Webhook handler for Stripe, PayPal, etc.
router.post('/webhooks/:provider', async (req, res) => {
  try {
    const { provider } = req.params;
    const signature = req.headers['stripe-signature'] || req.headers['paypal-transmission-sig'];
    const webhookData = req.body;

    const result = await PaymentGatewayService.processWebhook(provider, webhookData, signature);

    if (result.processed) {
      res.status(200).json({ received: true });
    } else {
      res.status(400).json({ error: 'Webhook processing failed' });
    }

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing error' });
  }
});

// Get user's payment history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, status, type } = req.query;

    const history = await PaymentGatewayService.getTransactionHistory(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      type
    });

    res.json(history);
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's saved payment methods
router.get('/methods', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(`
      SELECT upm.*, pp.display_name as provider_name, pp.name as provider_code
      FROM user_payment_methods upm
      JOIN payment_providers pp ON upm.provider_id = pp.id
      WHERE upm.user_id = $1 AND upm.is_active = true
      ORDER BY upm.is_default DESC, upm.created_at DESC
    `, [userId]);

    res.json({ payment_methods: result.rows });
  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Save a payment method
router.post('/methods', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      provider_name,
      method_type,
      display_name,
      provider_method_id,
      last_four,
      brand,
      expires_at,
      is_default = false
    } = req.body;

    // Get provider ID
    const providerResult = await db.query(
      'SELECT id FROM payment_providers WHERE name = $1',
      [provider_name]
    );

    if (providerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Payment provider not found' });
    }

    const providerId = providerResult.rows[0].id;

    // If setting as default, unset other defaults
    if (is_default) {
      await db.query(
        'UPDATE user_payment_methods SET is_default = false WHERE user_id = $1',
        [userId]
      );
    }

    const result = await db.query(`
      INSERT INTO user_payment_methods (
        user_id, provider_id, method_type, display_name,
        provider_method_id, last_four, brand, expires_at, is_default
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      userId, providerId, method_type, display_name,
      provider_method_id, last_four, brand, expires_at, is_default
    ]);

    res.status(201).json({
      message: 'Payment method saved successfully',
      payment_method: result.rows[0]
    });

  } catch (error) {
    console.error('Save payment method error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a payment method
router.delete('/methods/:methodId', authenticateToken, async (req, res) => {
  try {
    const { methodId } = req.params;
    const userId = req.user.id;

    await db.query(`
      UPDATE user_payment_methods 
      SET is_active = false, updated_at = NOW()
      WHERE id = $1 AND user_id = $2
    `, [methodId, userId]);

    res.json({ message: 'Payment method deleted successfully' });
  } catch (error) {
    console.error('Delete payment method error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Refund a payment (admin only)
router.post('/transactions/:transactionId/refund', authenticateToken, async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { refund_amount, refund_reason } = req.body;

    // Check admin permission
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Get original transaction
    const transactionResult = await db.query(`
      SELECT * FROM payment_transactions WHERE transaction_id = $1
    `, [transactionId]);

    if (transactionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const originalTransaction = transactionResult.rows[0];

    if (originalTransaction.status !== 'completed') {
      return res.status(400).json({ error: 'Can only refund completed transactions' });
    }

    // Create refund transaction
    const refundTransactionData = {
      order_id: originalTransaction.order_id,
      auction_id: originalTransaction.auction_id,
      payer_id: originalTransaction.recipient_id, // Platform pays back
      recipient_id: originalTransaction.payer_id, // Original payer receives
      payment_provider: originalTransaction.payment_method,
      payment_method: 'refund',
      gross_amount: parseFloat(refund_amount),
      metadata: {
        original_transaction_id: transactionId,
        refund_reason
      }
    };

    const refundTransaction = await PaymentGatewayService.createTransaction(refundTransactionData);

    // Create refund record
    await db.query(`
      INSERT INTO payment_refunds (
        original_transaction_id, refund_transaction_id, refund_amount,
        refund_reason, processed_by
      ) VALUES ($1, $2, $3, $4, $5)
    `, [
      originalTransaction.id,
      refundTransaction.id,
      refund_amount,
      refund_reason,
      req.user.id
    ]);

    res.json({
      message: 'Refund initiated successfully',
      refund_transaction_id: refundTransaction.transaction_id
    });

  } catch (error) {
    console.error('Refund error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
