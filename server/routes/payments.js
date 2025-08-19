const express = require('express');
const crypto = require('crypto');
const db = require('../config/database');
const router = express.Router();

const ESEWA_MERCHANT_ID = process.env.ESEWA_MERCHANT_ID || 'EPAYTEST';
const ESEWA_SECRET_KEY = process.env.ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q';
const ESEWA_URL = process.env.ESEWA_BASE_URL || 'https://rc-epay.esewa.com.np/api/epay/main/v2/form';
const SUCCESS_URL = process.env.ESEWA_SUCCESS_URL || 'http://localhost:3001/api/payments/success';
const FAILURE_URL = process.env.ESEWA_FAILURE_URL || 'http://localhost:3001/api/payments/failure';

function generateSignature(message, secret) {
  return crypto.createHmac('sha256', secret).update(message).digest('base64');
}

// Initiate payment for auction winner
router.get('/pay', async (req, res) => {
  const { auction_id } = req.query;
  const transactionId = Date.now().toString();

  if (!auction_id) {
    return res.redirect(`${process.env.FRONTEND_URL}/payment-failed?error=missing_auction_id`);
  }

  try {
    // Get auction and winner details
    const auctionResult = await db.query(`
      SELECT a.id, a.title, a.current_bid, a.status, 
             b.bidder_id as winner_id, u.full_name as winner_name
      FROM auctions a
      LEFT JOIN bids b ON a.id = b.auction_id AND b.amount = a.current_bid
      LEFT JOIN users u ON b.bidder_id = u.id
      WHERE a.id = $1 AND a.status = 'ended'
      ORDER BY b.created_at DESC
      LIMIT 1
    `, [auction_id]);

    if (auctionResult.rows.length === 0) {
      return res.redirect(`${process.env.FRONTEND_URL}/payment-failed?error=auction_not_found`);
    }

    const auction = auctionResult.rows[0];
    const amount = parseFloat(auction.current_bid);
    const totalAmount = amount;

    // Create payment transaction record
    await db.query(`
      INSERT INTO payment_transactions (auction_id, winner_id, transaction_id, amount, status)
      VALUES ($1, $2, $3, $4, 'pending')
    `, [auction_id, auction.winner_id, transactionId, totalAmount]);

    // Create or update order
    await db.query(`
      INSERT INTO orders (auction_id, winner_id, final_amount, status, payment_status, transaction_id)
      VALUES ($1, $2, $3, 'pending', 'pending', $4)
      ON CONFLICT (auction_id) DO UPDATE SET
        transaction_id = $4,
        payment_status = 'pending',
        updated_at = CURRENT_TIMESTAMP
    `, [auction_id, auction.winner_id, totalAmount, transactionId]);

    // Generate eSewa signature
    const signedFieldNames = 'total_amount,transaction_uuid,product_code';
    const message = `total_amount=${totalAmount},transaction_uuid=${transactionId},product_code=${ESEWA_MERCHANT_ID}`;
    const signature = generateSignature(message, ESEWA_SECRET_KEY);

    const formHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Redirecting to eSewa...</title>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; background: #f5f5f5; }
          .container { max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .debug-info { background: #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0; font-family: monospace; }
          .btn { padding: 15px 30px; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; margin-top: 20px; }
          .btn:hover { background: #218838; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Redirecting to eSewa...</h2>
          <p>Please wait while we redirect you to eSewa payment gateway.</p>
          <div class="debug-info">
            <strong>Debug Info:</strong> Amount: ${totalAmount}, Transaction: ${transactionId}
          </div>
          <form id="esewaForm" method="POST" action="https://uat.esewa.com.np/epay/main">
            <input type="hidden" name="amount" value="${amount}">
            <input type="hidden" name="tax_amount" value="0">
            <input type="hidden" name="total_amount" value="${totalAmount}">
            <input type="hidden" name="transaction_uuid" value="${transactionId}">
            <input type="hidden" name="product_code" value="${ESEWA_MERCHANT_ID}">
            <input type="hidden" name="product_service_charge" value="0">
            <input type="hidden" name="product_delivery_charge" value="0">
            <input type="hidden" name="success_url" value="${SUCCESS_URL}?auction_id=${auction_id}">
            <input type="hidden" name="failure_url" value="${FAILURE_URL}?auction_id=${auction_id}">
            <input type="hidden" name="signed_field_names" value="${signedFieldNames}">
            <input type="hidden" name="signature" value="${signature}">
            <button type="submit" class="btn">Continue to eSewa Payment</button>
          </form>
          <p style="margin-top: 20px; color: #666;">Click the button above to proceed to eSewa payment gateway.</p>
        </div>
        <script>
          setTimeout(() => document.getElementById('esewaForm').submit(), 2000);
        </script>
      </body>
      </html>
    `;

    res.send(formHTML);
  } catch (err) {
    console.error('Payment initiation error:', err);
    res.redirect(`${process.env.FRONTEND_URL}/payment-failed?auction_id=${auction_id}&error=payment_init_failed`);
  }
});

// Payment success callback
router.get('/success', async (req, res) => {
  let { auction_id, total_amount, transaction_uuid, data } = req.query;
  
  // Handle malformed URL
  if (!data && auction_id && auction_id.includes('?data=')) {
    const parts = auction_id.split('?data=');
    auction_id = parts[0];
    data = parts[1];
  }
  
  // Handle base64 encoded response
  if (data && !transaction_uuid) {
    try {
      const decodedData = JSON.parse(Buffer.from(data, 'base64').toString());
      transaction_uuid = decodedData.transaction_uuid;
      total_amount = decodedData.total_amount;
    } catch (err) {
      console.error('Error decoding eSewa response:', err);
      return res.redirect(`${process.env.FRONTEND_URL}/payment-failed?auction_id=${auction_id}&error=decode_failed`);
    }
  }

  if (!transaction_uuid || !auction_id) {
    return res.redirect(`${process.env.FRONTEND_URL}/payment-failed?auction_id=${auction_id}&error=missing_data`);
  }

  try {
    // Update payment transaction
    await db.query(`
      UPDATE payment_transactions 
      SET status = 'complete', raw_response = $1, updated_at = CURRENT_TIMESTAMP
      WHERE transaction_id = $2
    `, [JSON.stringify({ auction_id, transaction_uuid, total_amount }), transaction_uuid]);

    // Update order status
    await db.query(`
      UPDATE orders 
      SET status = 'paid', payment_status = 'paid', updated_at = CURRENT_TIMESTAMP
      WHERE transaction_id = $1
    `, [transaction_uuid]);

    // Create notification for successful payment
    await db.query(`
      INSERT INTO notifications (user_id, title, message, type, related_auction_id)
      SELECT winner_id, 'Payment Successful', 
             'Your payment has been processed successfully for auction: ' || (SELECT title FROM auctions WHERE id = $1),
             'payment_success', $1
      FROM orders WHERE transaction_id = $2
    `, [auction_id, transaction_uuid]);

    res.redirect(`${process.env.FRONTEND_URL}/payment-success?ref=${transaction_uuid}&auction_id=${auction_id}`);
  } catch (err) {
    console.error('Payment success processing error:', err);
    res.redirect(`${process.env.FRONTEND_URL}/payment-failed?auction_id=${auction_id}&error=processing_failed`);
  }
});

// Payment failure callback
router.get('/failure', async (req, res) => {
  const { auction_id, transaction_uuid } = req.query;

  try {
    if (transaction_uuid) {
      await db.query(`
        UPDATE payment_transactions 
        SET status = 'failed', raw_response = $1, updated_at = CURRENT_TIMESTAMP
        WHERE transaction_id = $2
      `, [JSON.stringify(req.query), transaction_uuid]);

      await db.query(`
        UPDATE orders 
        SET payment_status = 'failed', updated_at = CURRENT_TIMESTAMP
        WHERE transaction_id = $1
      `, [transaction_uuid]);
    }

    res.redirect(`${process.env.FRONTEND_URL}/payment-failed?auction_id=${auction_id}&error=payment_cancelled`);
  } catch (err) {
    console.error('Payment failure processing error:', err);
    res.redirect(`${process.env.FRONTEND_URL}/payment-failed?auction_id=${auction_id}&error=processing_failed`);
  }
});

// Get user's payment dashboard data
router.get('/dashboard/:userId', async (req, res) => {
  const { userId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        pt.id, pt.transaction_id, pt.amount, pt.status, pt.created_at,
        a.id as auction_id, a.title as auction_title, a.image_url,
        o.status as order_status, o.payment_status
      FROM payment_transactions pt
      JOIN auctions a ON pt.auction_id = a.id
      LEFT JOIN orders o ON pt.auction_id = o.auction_id
      WHERE pt.winner_id = $1
      ORDER BY pt.created_at DESC
    `, [userId]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Payment dashboard error:', err);
    res.status(500).json({ error: 'Failed to fetch payment data' });
  }
});

// Get pending payments for user (auctions won but not paid)
router.get('/pending/:userId', async (req, res) => {
  const { userId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        a.id as auction_id, a.title, a.current_bid, a.image_url,
        'pending' as status, a.updated_at as created_at
      FROM auctions a
      JOIN bids b ON a.id = b.auction_id AND b.amount = a.current_bid
      WHERE a.status = 'ended' 
        AND b.bidder_id = $1
        AND NOT EXISTS (
          SELECT 1 FROM payment_transactions pt 
          WHERE pt.auction_id = a.id AND pt.winner_id = $1
        )
      ORDER BY a.updated_at DESC
    `, [userId]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Pending payments error:', err);
    res.status(500).json({ error: 'Failed to fetch pending payments' });
  }
});

// Get payment status
router.get('/status/:transactionId', async (req, res) => {
  const { transactionId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT pt.*, a.title as auction_title, u.full_name as winner_name
      FROM payment_transactions pt
      JOIN auctions a ON pt.auction_id = a.id
      JOIN users u ON pt.winner_id = u.id
      WHERE pt.transaction_id = $1
    `, [transactionId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Status check error:', err);
    res.status(500).json({ error: 'Status check failed' });
  }
});

// Custom payment form (GET for testing)
router.get('/custom-pay', async (req, res) => {
  const { amount = '100', customerName = 'Test User', customerEmail = 'test@example.com', description = 'Test Payment' } = req.query;
  const transactionId = Date.now().toString();
  const totalAmount = parseFloat(amount);

  // Generate eSewa signature
  const signedFieldNames = 'total_amount,transaction_uuid,product_code';
  const message = `total_amount=${totalAmount},transaction_uuid=${transactionId},product_code=${ESEWA_MERCHANT_ID}`;
  const signature = generateSignature(message, ESEWA_SECRET_KEY);

  const formHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Redirecting to eSewa...</title>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; background: #f5f5f5; }
        .container { max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .debug-info { background: #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0; font-family: monospace; }
        .btn { padding: 15px 30px; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; margin-top: 20px; }
        .btn:hover { background: #218838; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Redirecting to eSewa...</h2>
        <p>Please wait while we redirect you to eSewa payment gateway.</p>
        <div class="debug-info">
          <strong>Debug Info:</strong> Amount: ${totalAmount}, Transaction: ${transactionId}
        </div>
        <form id="esewaForm" method="POST" action="https://rc-epay.esewa.com.np/auth">
          <input type="hidden" name="amount" value="${totalAmount}">
          <input type="hidden" name="tax_amount" value="0">
          <input type="hidden" name="total_amount" value="${totalAmount}">
          <input type="hidden" name="transaction_uuid" value="${transactionId}">
          <input type="hidden" name="product_code" value="${ESEWA_MERCHANT_ID}">
          <input type="hidden" name="product_service_charge" value="0">
          <input type="hidden" name="product_delivery_charge" value="0">
          <input type="hidden" name="success_url" value="${SUCCESS_URL}">
          <input type="hidden" name="failure_url" value="${FAILURE_URL}">
          <input type="hidden" name="signed_field_names" value="${signedFieldNames}">
          <input type="hidden" name="signature" value="${signature}">
          <button type="submit" class="btn">Continue to eSewa Payment</button>
        </form>
        <p style="margin-top: 20px; color: #666;">Click the button above to proceed to eSewa payment gateway.</p>
      </div>
      <script>
        setTimeout(() => document.getElementById('esewaForm').submit(), 2000);
      </script>
    </body>
    </html>
  `;

  res.send(formHTML);
});

// Custom payment form (POST)
router.post('/custom-pay', async (req, res) => {
  const { amount, customerName, customerEmail, description } = req.body;
  const transactionId = Date.now().toString();
  const totalAmount = parseFloat(amount);

  // Generate eSewa signature
  const signedFieldNames = 'total_amount,transaction_uuid,product_code';
  const message = `total_amount=${totalAmount},transaction_uuid=${transactionId},product_code=${ESEWA_MERCHANT_ID}`;
  const signature = generateSignature(message, ESEWA_SECRET_KEY);

  const formHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Redirecting to eSewa...</title>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; background: #f5f5f5; }
        .container { max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .debug-info { background: #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0; font-family: monospace; }
        .btn { padding: 15px 30px; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; margin-top: 20px; }
        .btn:hover { background: #218838; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Redirecting to eSewa...</h2>
        <p>Please wait while we redirect you to eSewa payment gateway.</p>
        <div class="debug-info">
          <strong>Debug Info:</strong> Amount: ${totalAmount}, Transaction: ${transactionId}
        </div>
        <form id="esewaForm" method="POST" action="https://rc-epay.esewa.com.np/auth">
          <input type="hidden" name="amount" value="${totalAmount}">
          <input type="hidden" name="tax_amount" value="0">
          <input type="hidden" name="total_amount" value="${totalAmount}">
          <input type="hidden" name="transaction_uuid" value="${transactionId}">
          <input type="hidden" name="product_code" value="${ESEWA_MERCHANT_ID}">
          <input type="hidden" name="product_service_charge" value="0">
          <input type="hidden" name="product_delivery_charge" value="0">
          <input type="hidden" name="success_url" value="${SUCCESS_URL}">
          <input type="hidden" name="failure_url" value="${FAILURE_URL}">
          <input type="hidden" name="signed_field_names" value="${signedFieldNames}">
          <input type="hidden" name="signature" value="${signature}">
          <button type="submit" class="btn">Continue to eSewa Payment</button>
        </form>
        <p style="margin-top: 20px; color: #666;">Click the button above to proceed to eSewa payment gateway.</p>
      </div>
      <script>
        setTimeout(() => document.getElementById('esewaForm').submit(), 2000);
      </script>
    </body>
    </html>
  `;

  res.send(formHTML);
});

// Test signature generation (for development)
router.get('/test-signature', (req, res) => {
  const { message = 'total_amount=100,transaction_uuid=11-201-13,product_code=EPAYTEST' } = req.query;
  const signature = generateSignature(message, ESEWA_SECRET_KEY);
  
  res.json({
    message,
    merchant_id: ESEWA_MERCHANT_ID,
    signature,
    algorithm: 'HMAC-SHA256',
    output_format: 'Base64',
    status: 'Payment integration ready'
  });
});

module.exports = router;