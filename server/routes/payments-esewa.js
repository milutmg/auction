const express = require('express');
const crypto = require('crypto');
const router = express.Router();

const ESEWA_MERCHANT_ID = process.env.ESEWA_MERCHANT_ID || 'EPAYTEST';
const ESEWA_SECRET_KEY = process.env.ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q';
const SUCCESS_URL = process.env.ESEWA_SUCCESS_URL || 'http://localhost:3001/api/esewa/success';
const FAILURE_URL = process.env.ESEWA_FAILURE_URL || 'http://localhost:3001/api/esewa/failure';

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

// Custom payment form
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