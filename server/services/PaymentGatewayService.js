const crypto = require('crypto');
const fetch = require('node-fetch');
const db = require('../config/database');
const { ESEWA_CONFIG, generateEsewaV2FormFields, MERCHANT_ID } = require('../config/esewa');

/**
 * Unified Payment Gateway Service
 * Handles multiple payment providers (eSewa, Stripe, PayPal, Bank Transfer, Khalti)
 */
class PaymentGatewayService {
  
  /**
   * Get available payment providers for a user/amount
   */
  static async getAvailableProviders(amount = 0, currency = 'USD', userCountry = null) {
    try {
      const result = await db.query(`
        SELECT * FROM payment_providers 
        WHERE is_active = true 
          AND min_amount <= $1 
          AND max_amount >= $1
          AND (countries_supported = '[]' OR $2 = ANY(SELECT jsonb_array_elements_text(countries_supported)))
        ORDER BY name
      `, [amount, userCountry]);

      return result.rows.map(provider => ({
        id: provider.id,
        name: provider.name,
        display_name: provider.display_name,
        provider_type: provider.provider_type,
        payment_methods: provider.payment_methods,
        fee_structure: provider.fee_structure,
        processing_time: provider.processing_time
      }));
    } catch (error) {
      console.error('Error getting payment providers:', error);
      return [];
    }
  }

  /**
   * Calculate fees for a transaction
   */
  static calculateFees(amount, feeStructure) {
    const { percentage = 0, fixed = 0, max_fee = null } = feeStructure;
    
    let fee = (amount * percentage / 100) + fixed;
    
    if (max_fee && fee > max_fee) {
      fee = max_fee;
    }
    
    return {
      gross_amount: amount,
      net_amount: amount - fee,
      gateway_fee: fee,
      platform_fee: fee * 0.2 // 20% of gateway fee as platform commission
    };
  }

  /**
   * Create a payment transaction record
   */
  static async createTransaction(transactionData) {
    try {
      const {
        order_id,
        auction_id,
        payer_id,
        recipient_id,
        payment_provider,
        payment_method,
        gross_amount,
        currency = 'USD',
        success_url,
        failure_url,
        metadata = {}
      } = transactionData;

      // Get provider configuration
      const providerResult = await db.query(
        'SELECT * FROM payment_providers WHERE name = $1 AND is_active = true',
        [payment_provider]
      );

      if (providerResult.rows.length === 0) {
        throw new Error('Payment provider not found or inactive');
      }

      const provider = providerResult.rows[0];
      const fees = this.calculateFees(gross_amount, provider.fee_structure);
      const transaction_id = this.generateTransactionId();

      const result = await db.query(`
        INSERT INTO payment_transactions (
          transaction_id, order_id, auction_id, payer_id, recipient_id,
          payment_provider_id, payment_method, gross_amount, net_amount,
          platform_fee, payment_gateway_fee, currency, success_url, failure_url,
          metadata, expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING *
      `, [
        transaction_id, order_id, auction_id, payer_id, recipient_id,
        provider.id, payment_method, fees.gross_amount, fees.net_amount,
        fees.platform_fee, fees.gateway_fee, currency, success_url, failure_url,
        JSON.stringify(metadata), new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours expiry
      ]);

      return result.rows[0];
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }

  /**
   * Initiate payment with specific provider
   */
  static async initiatePayment(transactionId, paymentData = {}) {
    try {
      // Get transaction details
      const transactionResult = await db.query(`
        SELECT pt.*, pp.name as provider_name, pp.configuration, pp.display_name
        FROM payment_transactions pt
        JOIN payment_providers pp ON pt.payment_provider_id = pp.id
        WHERE pt.transaction_id = $1
      `, [transactionId]);

      if (transactionResult.rows.length === 0) {
        throw new Error('Transaction not found');
      }

      const transaction = transactionResult.rows[0];
      const providerName = transaction.provider_name;

      // Route to appropriate payment provider
      let result;
      switch (providerName) {
        case 'esewa':
          result = await this.initiateEsewaPayment(transaction, paymentData);
          break;
        case 'stripe':
          result = await this.initiateStripePayment(transaction, paymentData);
          break;
        case 'paypal':
          result = await this.initiatePayPalPayment(transaction, paymentData);
          break;
        case 'khalti':
          result = await this.initiateKhaltiPayment(transaction, paymentData);
          break;
        case 'bank_transfer':
          result = await this.initiateBankTransfer(transaction, paymentData);
          break;
        default:
          throw new Error(`Unsupported payment provider: ${providerName}`);
      }

      // Update transaction with provider response
      await db.query(`
        UPDATE payment_transactions 
        SET provider_response = $1, status = $2, updated_at = NOW()
        WHERE transaction_id = $3
      `, [JSON.stringify(result), result.success ? 'processing' : 'failed', transactionId]);

      return result;
    } catch (error) {
      console.error('Error initiating payment:', error);
      
      // Update transaction status
      await db.query(`
        UPDATE payment_transactions 
        SET status = 'failed', error_details = $1, updated_at = NOW()
        WHERE transaction_id = $2
      `, [JSON.stringify({ error: error.message }), transactionId]);
      
      throw error;
    }
  }

  /**
   * eSewa Payment Integration
   */
  static async initiateEsewaPayment(transaction, paymentData) {
    try {
      // Prefer eSewa v2 (rc-epay) form
      const transaction_uuid = transaction.transaction_id;
      const amount = parseFloat(transaction.gross_amount);
      const tax_amount = 0;

      const fields = generateEsewaV2FormFields({
        amount,
        tax_amount,
        transaction_uuid,
        success_url: transaction.success_url || ESEWA_CONFIG.V2_SUCCESS_API,
        failure_url: transaction.failure_url || ESEWA_CONFIG.V2_FAILURE_API,
        product_code: MERCHANT_ID,
      });

      return {
        success: true,
        payment_type: 'redirect_form',
        payment_url: ESEWA_CONFIG.V2_FORM_URL,
        form_data: fields,
        method: 'POST',
        message: 'Redirect to eSewa v2 payment gateway'
      };
    } catch (error) {
      // Fallback to legacy v1 shape if helpers are unavailable
      try {
        const config = transaction.configuration || {};
        const productCode = `AUCTION_${transaction.auction_id || 'GEN'}_${Date.now()}`;
        const formData = {
          tAmt: transaction.gross_amount,
          amt: transaction.gross_amount,
          txAmt: 0,
          psc: 0,
          pdc: 0,
          scd: config.merchant_id || MERCHANT_ID,
          pid: productCode,
          su: transaction.success_url || `${process.env.FRONTEND_URL}/payment/success`,
          fu: transaction.failure_url || `${process.env.FRONTEND_URL}/payment/failure`
        };
        return {
          success: true,
          payment_type: 'redirect',
          payment_url: ESEWA_CONFIG.PAYMENT_URL,
          form_data: formData,
          method: 'POST',
          message: 'Redirect to eSewa payment gateway (legacy)'
        };
      } catch (inner) {
        return { success: false, error: inner.message || error.message };
      }
    }
  }

  /**
   * Stripe Payment Integration
   */
  static async initiateStripePayment(transaction, paymentData) {
    try {
      // This would integrate with Stripe API
      // For now, return a mock response
      const stripe = require('stripe')(transaction.configuration.secret_key);
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(transaction.gross_amount * 100), // Stripe uses cents
        currency: transaction.currency.toLowerCase(),
        metadata: {
          transaction_id: transaction.transaction_id,
          auction_id: transaction.auction_id,
          order_id: transaction.order_id
        }
      });

      return {
        success: true,
        payment_type: 'client_secret',
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
        message: 'Payment intent created successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * PayPal Payment Integration
   */
  static async initiatePayPalPayment(transaction, paymentData) {
    try {
      // PayPal SDK integration would go here
      return {
        success: true,
        payment_type: 'redirect',
        payment_url: 'https://www.sandbox.paypal.com/checkoutnow',
        order_id: `PP_${transaction.transaction_id}`,
        message: 'PayPal payment created successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Khalti Payment Integration
   */
  static async initiateKhaltiPayment(transaction, paymentData) {
    try {
      const config = transaction.configuration;
      
      const khaltiData = {
        return_url: transaction.success_url,
        website_url: process.env.FRONTEND_URL,
        amount: transaction.gross_amount * 100, // Khalti uses paisa
        purchase_order_id: transaction.transaction_id,
        purchase_order_name: `Auction Payment - ${transaction.auction_id}`,
        customer_info: {
          name: paymentData.customer_name || 'Auction Winner',
          email: paymentData.customer_email || 'user@example.com',
          phone: paymentData.customer_phone || '9800000000'
        }
      };

      return {
        success: true,
        payment_type: 'widget',
        widget_data: khaltiData,
        public_key: config.public_key,
        message: 'Khalti payment initialized'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Bank Transfer Instructions
   */
  static async initiateBankTransfer(transaction, paymentData) {
    try {
      const config = transaction.configuration;
      
      return {
        success: true,
        payment_type: 'bank_transfer',
        bank_details: {
          account_name: config.account_name,
          account_number: config.account_number,
          bank_name: config.bank_name,
          swift_code: config.swift_code,
          reference: transaction.transaction_id
        },
        instructions: [
          'Transfer the exact amount to the bank account provided',
          'Use the reference number in your transfer description',
          'Upload the transfer receipt after completing the payment',
          'Payment will be verified within 1-2 business days'
        ],
        message: 'Bank transfer details provided'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Verify payment from webhook/callback
   */
  static async verifyPayment(transactionId, providerData, providerName) {
    try {
      const transaction = await this.getTransaction(transactionId);
      
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      let verificationResult;
      
      switch (providerName) {
        case 'esewa':
          verificationResult = await this.verifyEsewaPayment(transaction, providerData);
          break;
        case 'stripe':
          verificationResult = await this.verifyStripePayment(transaction, providerData);
          break;
        case 'khalti':
          verificationResult = await this.verifyKhaltiPayment(transaction, providerData);
          break;
        default:
          verificationResult = { success: false, error: 'Unsupported provider' };
      }

      // Update transaction status
      const newStatus = verificationResult.success ? 'completed' : 'failed';
      
      await db.query(`
        UPDATE payment_transactions 
        SET status = $1, 
            external_transaction_id = $2,
            processed_at = NOW(),
            completed_at = CASE WHEN $1 = 'completed' THEN NOW() ELSE NULL END,
            provider_response = $3,
            updated_at = NOW()
        WHERE transaction_id = $4
      `, [
        newStatus,
        verificationResult.external_transaction_id,
        JSON.stringify(verificationResult),
        transactionId
      ]);

      return verificationResult;
    } catch (error) {
      console.error('Error verifying payment:', error);
      throw error;
    }
  }

  /**
   * Verify eSewa payment (legacy v1 placeholder; v2 verification is handled in routes)
   */
  static async verifyEsewaPayment(transaction, esewaData) {
    try {
      const { oid, amt, refId } = esewaData;
      if (parseFloat(amt) !== transaction.gross_amount) {
        return { success: false, error: 'Amount mismatch' };
      }
      return {
        success: true,
        external_transaction_id: refId,
        verified_amount: parseFloat(amt),
        provider_reference: oid
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get transaction by ID
   */
  static async getTransaction(transactionId) {
    try {
      const result = await db.query(`
        SELECT pt.*, pp.name as provider_name, pp.configuration
        FROM payment_transactions pt
        JOIN payment_providers pp ON pt.payment_provider_id = pp.id
        WHERE pt.transaction_id = $1
      `, [transactionId]);

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting transaction:', error);
      return null;
    }
  }

  /**
   * Generate unique transaction ID
   */
  static generateTransactionId() {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TXN_${timestamp}_${random}`;
  }

  /**
   * Process webhook from payment provider
   */
  static async processWebhook(providerName, webhookData, signature = null) {
    try {
      // Store webhook for audit
      const webhookRecord = await db.query(`
        INSERT INTO payment_webhooks (provider_name, webhook_type, payload, signature)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `, [providerName, webhookData.type || 'unknown', JSON.stringify(webhookData), signature]);

      // Process based on provider
      let result;
      switch (providerName) {
        case 'stripe':
          result = await this.processStripeWebhook(webhookData);
          break;
        case 'paypal':
          result = await this.processPayPalWebhook(webhookData);
          break;
        default:
          result = { processed: false, error: 'Unsupported provider' };
      }

      // Update webhook record
      await db.query(`
        UPDATE payment_webhooks 
        SET processed = $1, processing_result = $2, processed_at = NOW()
        WHERE id = $3
      `, [result.processed, JSON.stringify(result), webhookRecord.rows[0].id]);

      return result;
    } catch (error) {
      console.error('Error processing webhook:', error);
      throw error;
    }
  }

  /**
   * Get transaction history for user
   */
  static async getTransactionHistory(userId, options = {}) {
    try {
      const { page = 1, limit = 20, status = null, type = null } = options;
      const offset = (page - 1) * limit;

      let query = `
        SELECT 
          pt.*,
          pp.display_name as provider_display_name,
          a.title as auction_title,
          o.id as order_id
        FROM payment_transactions pt
        JOIN payment_providers pp ON pt.payment_provider_id = pp.id
        LEFT JOIN auctions a ON pt.auction_id = a.id
        LEFT JOIN orders o ON pt.order_id = o.id
        WHERE (pt.payer_id = $1 OR pt.recipient_id = $1)
      `;

      const params = [userId];
      let paramIndex = 1;

      if (status) {
        params.push(status);
        query += ` AND pt.status = $${++paramIndex}`;
      }

      if (type) {
        params.push(type);
        query += ` AND pt.payment_type = $${++paramIndex}`;
      }

      query += ` ORDER BY pt.created_at DESC LIMIT $${++paramIndex} OFFSET $${++paramIndex}`;
      params.push(limit, offset);

      const result = await db.query(query, params);
      
      // Get total count
      let countQuery = `
        SELECT COUNT(*)
        FROM payment_transactions pt
        WHERE (pt.payer_id = $1 OR pt.recipient_id = $1)
      `;
      const countParams = [userId];
      let countParamIndex = 1;

      if (status) {
        countParams.push(status);
        countQuery += ` AND pt.status = $${++countParamIndex}`;
      }

      if (type) {
        countParams.push(type);
        countQuery += ` AND pt.payment_type = $${++countParamIndex}`;
      }

      const countResult = await db.query(countQuery, countParams);
      const totalCount = parseInt(countResult.rows[0].count);

      return {
        transactions: result.rows,
        pagination: {
          current_page: page,
          total_pages: Math.ceil(totalCount / limit),
          total_items: totalCount,
          items_per_page: limit
        }
      };
    } catch (error) {
      console.error('Error getting transaction history:', error);
      throw error;
    }
  }
}

module.exports = PaymentGatewayService;
