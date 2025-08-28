/**
 * eSewa Payment Gateway Configuration
 * Test credentials for development environment
 */

// Prefer env where available
const MERCHANT_ID = process.env.ESEWA_MERCHANT_ID || 'EPAYTEST';
const SECRET_KEY = process.env.ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8080';
const API_BASE = process.env.ESEWA_CALLBACK_BASE || process.env.API_BASE_URL || 'http://localhost:3001';

// eSewa Test Configuration (v1 legacy + v2 current)
const ESEWA_CONFIG = {
  // v1 (legacy) - kept for backward compatibility
  MERCHANT_CODE: MERCHANT_ID,
  SUCCESS_URL: `${FRONTEND_URL}/payment/success`,
  FAILURE_URL: `${FRONTEND_URL}/payment/failure`,
  PAYMENT_URL: 'https://uat.esewa.com.np/epay/main', // v1 test form
  VERIFICATION_URL: 'https://uat.esewa.com.np/epay/transrec', // v1 test verify

  // v2 (current) - preferred
  V2_FORM_URL: 'https://rc-epay.esewa.com.np/api/epay/main/v2/form',
  V2_VERIFY_URL: 'https://rc-epay.esewa.com.np/api/epay/verify',
  V2_SUCCESS_API: `${API_BASE}/api/payments/success-v2`,
  V2_FAILURE_API: `${API_BASE}/api/payments/failure-v2`,

  // Test credentials - do not use in production
  TEST_CREDENTIALS: {
    merchantCode: MERCHANT_ID,
    secretKey: SECRET_KEY,
  }
};

/**
 * Generate eSewa payment form data (v1)
 * @param {Object} params - Payment parameters
 * @returns {Object} Form data for eSewa payment
 */
function generateEsewaPaymentData(params) {
  const {
    amount,
    taxAmount = 0,
    serviceCharge = 0,
    deliveryCharge = 0,
    productCode,
    successUrl = ESEWA_CONFIG.SUCCESS_URL,
    failureUrl = ESEWA_CONFIG.FAILURE_URL
  } = params;

  // Calculate total amount
  const totalAmount = parseFloat(amount) + parseFloat(taxAmount) + 
                     parseFloat(serviceCharge) + parseFloat(deliveryCharge);

  return {
    amt: amount.toFixed(2),
    txAmt: taxAmount.toFixed(2),
    psc: serviceCharge.toFixed(2),
    pdc: deliveryCharge.toFixed(2),
    tAmt: totalAmount.toFixed(2),
    pid: productCode,
    scd: ESEWA_CONFIG.MERCHANT_CODE,
    su: successUrl,
    fu: failureUrl
  };
}

/**
 * Validate eSewa callback response (v1)
 * @param {Object} response - eSewa callback response
 * @returns {boolean} True if response is valid
 */
function validateEsewaResponse(response) {
  const requiredFields = ['oid', 'amt', 'refId'];
  return requiredFields.every(field => response[field]);
}

/**
 * Generate product code for auction payment
 * @param {string} auctionId - Auction ID
 * @param {string} orderId - Order ID
 * @returns {string} Product code
 */
function generateProductCode(auctionId, orderId) {
  // Format: AUCTION_ORDER_TIMESTAMP
  const timestamp = Date.now().toString().slice(-6);
  return `AUC_${String(auctionId).slice(-6)}_${String(orderId).slice(-6)}_${timestamp}`;
}

// v2 helpers
function generateV2Signature(message, secret = SECRET_KEY) {
  const crypto = require('crypto');
  return crypto.createHmac('sha256', secret).update(message).digest('base64');
}

/**
 * Build eSewa v2 form fields
 */
function generateEsewaV2FormFields({
  amount,
  tax_amount = 0,
  transaction_uuid,
  success_url = ESEWA_CONFIG.V2_SUCCESS_API,
  failure_url = ESEWA_CONFIG.V2_FAILURE_API,
  product_code = MERCHANT_ID,
}) {
  const total_amount = parseFloat(amount) + parseFloat(tax_amount);
  const signed_field_names = 'total_amount,transaction_uuid,product_code';
  const message = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`;
  const signature = generateV2Signature(message);
  return {
    amount: parseFloat(amount),
    tax_amount: parseFloat(tax_amount),
    total_amount,
    transaction_uuid,
    product_code,
    product_service_charge: 0,
    product_delivery_charge: 0,
    success_url,
    failure_url,
    signed_field_names,
    signature,
  };
}

module.exports = {
  ESEWA_CONFIG,
  generateEsewaPaymentData,
  validateEsewaResponse,
  generateProductCode,
  // v2
  generateV2Signature,
  generateEsewaV2FormFields,
  MERCHANT_ID,
  SECRET_KEY,
  FRONTEND_URL,
  API_BASE,
};
