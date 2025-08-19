const express = require('express');
const crypto = require('crypto');
const db = require('../config/database');
const router = express.Router();

const ESEWA_MERCHANT_ID = process.env.ESEWA_MERCHANT_ID || 'EPAYTEST';
const ESEWA_SECRET_KEY = process.env.ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q';
const SUCCESS_URL = process.env.ESEWA_SUCCESS_URL || 'http://localhost:3001/api/payments/success';
const FAILURE_URL = process.env.ESEWA_FAILURE_URL || 'http://localhost:3001/api/payments/failure';

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
        <form id="esewaForm" method="POST" action="https://uat.esewa.com.np/epay/main">
          <input type="hidden" name="tAmt" value="${totalAmount}">
          <input type="hidden" name="amt" value="${totalAmount}">
          <input type="hidden" name="txAmt" value="0">
          <input type="hidden" name="psc" value="0">
          <input type="hidden" name="pdc" value="0">
          <input type="hidden" name="scd" value="${ESEWA_MERCHANT_ID}">
          <input type="hidden" name="pid" value="${transactionId}">
          <input type="hidden" name="su" value="${SUCCESS_URL}">
          <input type="hidden" name="fu" value="${FAILURE_URL}">
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
        <form id="esewaForm" method="POST" action="https://uat.esewa.com.np/epay/main">
          <input type="hidden" name="tAmt" value="${totalAmount}">
          <input type="hidden" name="amt" value="${totalAmount}">
          <input type="hidden" name="txAmt" value="0">
          <input type="hidden" name="psc" value="0">
          <input type="hidden" name="pdc" value="0">
          <input type="hidden" name="scd" value="${ESEWA_MERCHANT_ID}">
          <input type="hidden" name="pid" value="${transactionId}">
          <input type="hidden" name="su" value="${SUCCESS_URL}">
          <input type="hidden" name="fu" value="${FAILURE_URL}">
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