const express = require('express');
const crypto = require('crypto');
const router = express.Router();

const ESEWA_MERCHANT_ID = process.env.ESEWA_MERCHANT_ID || 'EPAYTEST';
const ESEWA_SECRET_KEY = process.env.ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q';
const SUCCESS_URL = process.env.ESEWA_SUCCESS_URL || 'http://localhost:3002/api/auctions/payment/esewa/success';
const FAILURE_URL = process.env.ESEWA_FAILURE_URL || 'http://localhost:3002/api/auctions/payment/esewa/failure';

function generateSignature(message, secret) {
  return crypto.createHmac('sha256', secret).update(message).digest('base64');
}

// CORS middleware
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Simple test payment endpoint
router.get('/test-payment', async (req, res) => {
  const { amount = '100' } = req.query;
  const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const totalAmount = parseFloat(amount);
  const taxAmount = 0;
  const finalAmount = totalAmount + taxAmount;

  // Generate signature
  const signedFieldNames = 'total_amount,transaction_uuid,product_code';
  const message = `total_amount=${finalAmount},transaction_uuid=${transactionId},product_code=${ESEWA_MERCHANT_ID}`;
  const signature = generateSignature(message, ESEWA_SECRET_KEY);

  const formHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>eSewa Test Payment</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          text-align: center; 
          margin: 0; 
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .container { 
          max-width: 500px; 
          margin: 0 auto; 
          background: white; 
          padding: 40px; 
          border-radius: 20px; 
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          backdrop-filter: blur(10px);
        }
        .header {
          margin-bottom: 30px;
        }
        .header h1 {
          color: #333;
          margin-bottom: 10px;
          font-size: 28px;
        }
        .header p {
          color: #666;
          font-size: 16px;
        }
        .payment-details {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 15px;
          margin: 20px 0;
          text-align: left;
        }
        .payment-details h3 {
          margin: 0 0 15px 0;
          color: #333;
          font-size: 18px;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          margin: 10px 0;
          padding: 8px 0;
          border-bottom: 1px solid #e9ecef;
        }
        .detail-row:last-child {
          border-bottom: none;
          font-weight: bold;
          font-size: 18px;
          color: #28a745;
        }
        .esewa-logo {
          width: 80px;
          height: 80px;
          margin: 20px auto;
          background: #60bb46;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 24px;
          font-weight: bold;
        }
        .btn { 
          padding: 15px 30px; 
          background: #60bb46; 
          color: white; 
          border: none; 
          border-radius: 10px; 
          cursor: pointer; 
          font-size: 16px; 
          margin: 20px 0;
          transition: all 0.3s ease;
          width: 100%;
        }
        .btn:hover {
          background: #4a9c3a;
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(96, 187, 70, 0.3);
        }
        .test-notice {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          color: #856404;
          padding: 15px;
          border-radius: 10px;
          margin: 20px 0;
          font-size: 14px;
        }
        .test-credentials {
          background: #e3f2fd;
          border: 1px solid #bbdefb;
          color: #1565c0;
          padding: 15px;
          border-radius: 10px;
          margin: 20px 0;
          font-size: 12px;
          font-family: monospace;
        }
        .debug-info {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 10px;
          margin: 20px 0;
          font-family: monospace;
          font-size: 12px;
          text-align: left;
          border: 1px solid #dee2e6;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="esewa-logo">e</div>
          <h1>eSewa Test Payment</h1>
          <p>Complete your test payment securely with eSewa</p>
        </div>
        
        <div class="payment-details">
          <h3>Payment Summary</h3>
          <div class="detail-row">
            <span>Amount:</span>
            <span>NPR ${totalAmount.toFixed(2)}</span>
          </div>
          <div class="detail-row">
            <span>Tax:</span>
            <span>NPR ${taxAmount.toFixed(2)}</span>
          </div>
          <div class="detail-row">
            <span>Total:</span>
            <span>NPR ${finalAmount.toFixed(2)}</span>
          </div>
        </div>

        <div class="test-notice">
          <strong>🧪 Test Environment:</strong> This is using eSewa's test environment. 
          Use test credentials for payment.
        </div>

        <div class="test-credentials">
          <strong>Test Credentials:</strong><br>
          Username: test@esewa.com.np<br>
          Password: test123<br>
          OTP: 123456
        </div>

        <form id="esewaForm" method="POST" action="https://rc-epay.esewa.com.np/api/epay/main/v2/form">
          <input type="hidden" name="amount" value="${totalAmount}">
          <input type="hidden" name="tax_amount" value="${taxAmount}">
          <input type="hidden" name="total_amount" value="${finalAmount}">
          <input type="hidden" name="transaction_uuid" value="${transactionId}">
          <input type="hidden" name="product_code" value="${ESEWA_MERCHANT_ID}">
          <input type="hidden" name="product_service_charge" value="0">
          <input type="hidden" name="product_delivery_charge" value="0">
          <input type="hidden" name="success_url" value="${SUCCESS_URL}?orderId=test-${Date.now()}">
          <input type="hidden" name="failure_url" value="${FAILURE_URL}?orderId=test-${Date.now()}">
          <input type="hidden" name="signed_field_names" value="${signedFieldNames}">
          <input type="hidden" name="signature" value="${signature}">
          <button type="submit" class="btn">🚀 Proceed to eSewa Payment</button>
        </form>

        <div class="debug-info">
          <strong>Debug Info:</strong><br>
          Transaction ID: ${transactionId}<br>
          Amount: NPR ${totalAmount}<br>
          Total: NPR ${finalAmount}<br>
          Merchant: ${ESEWA_MERCHANT_ID}<br>
          Success URL: ${SUCCESS_URL}<br>
          Failure URL: ${FAILURE_URL}
        </div>

        <p style="margin-top: 20px; color: #666; font-size: 14px;">
          Click the button above to proceed to eSewa payment gateway.
        </p>
      </div>
      
      <script>
        // Auto-submit after 3 seconds for convenience
        setTimeout(() => {
          console.log('Auto-submitting to eSewa...');
          document.getElementById('esewaForm').submit();
        }, 3000);
      </script>
    </body>
    </html>
  `;

  res.send(formHTML);
});

// Custom payment form (existing)
router.get('/custom-pay', async (req, res) => {
  const { amount = '100' } = req.query;
  const transactionId = Date.now().toString();
  const totalAmount = parseFloat(amount);
  const taxAmount = 0;
  const finalAmount = totalAmount + taxAmount;

  // Generate signature
  const signedFieldNames = 'total_amount,transaction_uuid,product_code';
  const message = `total_amount=${finalAmount},transaction_uuid=${transactionId},product_code=${ESEWA_MERCHANT_ID}`;
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
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Redirecting to eSewa...</h2>
        <p>Please wait while we redirect you to eSewa payment gateway.</p>
        <div class="debug-info">
          <strong>Debug Info:</strong> Amount: ${totalAmount}, Transaction: ${transactionId}
        </div>
        <form id="esewaForm" method="POST" action="https://rc-epay.esewa.com.np/api/epay/main/v2/form">
          <input type="hidden" name="amount" value="${totalAmount}">
          <input type="hidden" name="tax_amount" value="${taxAmount}">
          <input type="hidden" name="total_amount" value="${finalAmount}">
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

router.post('/custom-pay', async (req, res) => {
  const { amount = '100' } = req.body;
  const transactionId = Date.now().toString();
  const totalAmount = parseFloat(amount);
  const taxAmount = 0;
  const finalAmount = totalAmount + taxAmount;

  // Generate signature
  const signedFieldNames = 'total_amount,transaction_uuid,product_code';
  const message = `total_amount=${finalAmount},transaction_uuid=${transactionId},product_code=${ESEWA_MERCHANT_ID}`;
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
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Redirecting to eSewa...</h2>
        <p>Please wait while we redirect you to eSewa payment gateway.</p>
        <div class="debug-info">
          <strong>Debug Info:</strong> Amount: ${totalAmount}, Transaction: ${transactionId}
        </div>
        <form id="esewaForm" method="POST" action="https://rc-epay.esewa.com.np/api/epay/main/v2/form">
          <input type="hidden" name="amount" value="${totalAmount}">
          <input type="hidden" name="tax_amount" value="${taxAmount}">
          <input type="hidden" name="total_amount" value="${finalAmount}">
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

module.exports = router;