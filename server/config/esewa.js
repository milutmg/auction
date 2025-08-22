/**
 * eSewa Payment Gateway Configuration
 * Test credentials for development environment
 */

// eSewa Test Configuration
const ESEWA_CONFIG = {
  // Test Merchant Code provided by eSewa
  MERCHANT_CODE: 'EPAYTEST',
  
  // Test Success/Failure URLs (update these to match your frontend URLs)
  SUCCESS_URL: 'http://localhost:3002/api/auctions/payment/esewa/success',
  FAILURE_URL: 'http://localhost:3002/api/auctions/payment/esewa/failure',
  
  // eSewa Gateway URLs - Updated to use the correct test endpoints
  PAYMENT_URL: 'https://rc-epay.esewa.com.np/api/epay/main/v2/form', // Test environment v2
  VERIFICATION_URL: 'https://rc-epay.esewa.com.np/api/epay/transrec', // Test verification
  
  // Test credentials - do not use in production
  TEST_CREDENTIALS: {
    merchantCode: 'EPAYTEST',
    secretKey: '8gBm/:&EnhH.1/q', // Test secret key
  }
};

// Production URLs (commented out for safety)
// const PRODUCTION_CONFIG = {
//   PAYMENT_URL: 'https://esewa.com.np/epay/main',
//   VERIFICATION_URL: 'https://esewa.com.np/epay/transrec',
// };

/**
 * Generate eSewa payment form data
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
 * Generate eSewa v2 payment form data (new format)
 * @param {Object} params - Payment parameters
 * @returns {Object} Form data for eSewa v2 payment
 */
function generateEsewaV2PaymentData(params) {
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

  // Generate transaction UUID
  const transactionUuid = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  return {
    amount: amount.toFixed(2),
    tax_amount: taxAmount.toFixed(2),
    total_amount: totalAmount.toFixed(2),
    transaction_uuid: transactionUuid,
    product_code: ESEWA_CONFIG.MERCHANT_CODE,
    product_service_charge: serviceCharge.toFixed(2),
    product_delivery_charge: deliveryCharge.toFixed(2),
    success_url: successUrl,
    failure_url: failureUrl,
    signed_field_names: 'total_amount,transaction_uuid,product_code'
  };
}

/**
 * Validate eSewa callback response
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
  return `AUC_${auctionId.slice(-6)}_${orderId.slice(-6)}_${timestamp}`;
}

module.exports = {
  ESEWA_CONFIG,
  generateEsewaPaymentData,
  generateEsewaV2PaymentData,
  validateEsewaResponse,
  generateProductCode
};
