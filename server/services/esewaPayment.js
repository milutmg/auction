const crypto = require('crypto');
const fetch = require('node-fetch');
const { ESEWA_CONFIG, generateEsewaPaymentData, generateProductCode, validateEsewaResponse } = require('../config/esewa');

/**
 * eSewa Payment Service
 * Handles eSewa payment integration for auction payments
 */
class EsewaPaymentService {
  
  /**
   * Initiate eSewa payment for an auction order
   * @param {Object} orderData - Order information
   * @returns {Object} Payment initialization data
   */
  static async initiatePayment(orderData) {
    try {
      const {
        orderId,
        auctionId,
        amount,
        auctionTitle,
        winnerEmail
      } = orderData;

      // Generate unique product code
      const productCode = generateProductCode(auctionId, orderId);

      // Prepare payment data
      const paymentData = {
        amount: parseFloat(amount),
        taxAmount: 0, // No tax for auctions in test environment
        serviceCharge: 0, // No service charge for test
        deliveryCharge: 0, // No delivery charge for test
        productCode: productCode,
        successUrl: `${ESEWA_CONFIG.SUCCESS_URL}?orderId=${orderId}`,
        failureUrl: `${ESEWA_CONFIG.FAILURE_URL}?orderId=${orderId}`
      };

      // Generate form data for eSewa
      const formData = this.generatePaymentFormData(paymentData);
      
      // Store payment session (you might want to store this in Redis or database)
      const paymentSession = {
        orderId,
        auctionId,
        productCode,
        amount: paymentData.amount,
        createdAt: new Date().toISOString(),
        status: 'initiated'
      };

      return {
        success: true,
        paymentUrl: ESEWA_CONFIG.PAYMENT_URL,
        formData,
        paymentSession,
        message: 'Payment initiated successfully'
      };

    } catch (error) {
      console.error('eSewa payment initiation error:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to initiate payment'
      };
    }
  }

  /**
   * Generate form data for eSewa payment
   * @param {Object} paymentData - Payment parameters
   * @returns {Object} Form data object
   */
  static generatePaymentFormData(paymentData) {
    const {
      amount,
      taxAmount,
      serviceCharge,
      deliveryCharge,
      productCode,
      successUrl,
      failureUrl
    } = paymentData;

    const totalAmount = amount + taxAmount + serviceCharge + deliveryCharge;

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
   * Verify eSewa payment with their verification API
   * @param {Object} callbackData - Data received from eSewa callback
   * @returns {Object} Verification result
   */
  static async verifyPayment(callbackData) {
    try {
      const { oid: productCode, amt: amount, refId } = callbackData;

      if (!validateEsewaResponse(callbackData)) {
        return {
          success: false,
          message: 'Invalid callback response from eSewa'
        };
      }

      // Prepare verification request
      const verificationData = {
        amt: amount,
        scd: ESEWA_CONFIG.MERCHANT_CODE,
        rid: refId,
        pid: productCode
      };

      // Make verification request to eSewa
      const verificationResponse = await this.makeVerificationRequest(verificationData);
      
      if (verificationResponse.success) {
        return {
          success: true,
          transactionId: refId,
          amount: parseFloat(amount),
          productCode,
          verificationResponse: verificationResponse.data,
          message: 'Payment verified successfully'
        };
      } else {
        return {
          success: false,
          message: 'Payment verification failed',
          error: verificationResponse.error
        };
      }

    } catch (error) {
      console.error('eSewa payment verification error:', error);
      return {
        success: false,
        error: error.message,
        message: 'Payment verification failed'
      };
    }
  }

  /**
   * Make verification request to eSewa API
   * @param {Object} verificationData - Data for verification
   * @returns {Object} API response
   */
  static async makeVerificationRequest(verificationData) {
    try {
      const formBody = Object.keys(verificationData)
        .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(verificationData[key]))
        .join('&');

      const response = await fetch(ESEWA_CONFIG.VERIFICATION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formBody
      });

      const responseText = await response.text();
      
      // eSewa returns simple text response
      // Success response contains "Success" string
      if (responseText.includes('Success')) {
        return {
          success: true,
          data: {
            status: 'verified',
            response: responseText,
            verifiedAt: new Date().toISOString()
          }
        };
      } else {
        return {
          success: false,
          error: responseText || 'Verification failed'
        };
      }

    } catch (error) {
      console.error('eSewa verification API error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Handle payment success callback
   * @param {Object} callbackData - eSewa success callback data
   * @param {string} orderId - Order ID from URL parameter
   * @returns {Object} Processing result
   */
  static async handlePaymentSuccess(callbackData, orderId) {
    try {
      // Verify the payment first
      const verificationResult = await this.verifyPayment(callbackData);
      
      if (!verificationResult.success) {
        return {
          success: false,
          message: 'Payment verification failed',
          error: verificationResult.error
        };
      }

      // Return success result with verification data
      return {
        success: true,
        orderId,
        transactionId: verificationResult.transactionId,
        amount: verificationResult.amount,
        verifiedAt: new Date().toISOString(),
        message: 'Payment completed and verified successfully'
      };

    } catch (error) {
      console.error('Payment success handling error:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to process payment success'
      };
    }
  }

  /**
   * Handle payment failure callback
   * @param {string} orderId - Order ID from URL parameter
   * @returns {Object} Failure result
   */
  static async handlePaymentFailure(orderId) {
    return {
      success: false,
      orderId,
      failedAt: new Date().toISOString(),
      message: 'Payment was cancelled or failed'
    };
  }

  /**
   * Generate payment summary for frontend
   * @param {Object} orderData - Order data
   * @returns {Object} Payment summary
   */
  static generatePaymentSummary(orderData) {
    const { amount, auctionTitle, orderId } = orderData;
    
    return {
      orderId,
      auctionTitle,
      amount: parseFloat(amount),
      currency: 'NPR',
      paymentMethod: 'eSewa',
      fees: {
        serviceFee: 0,
        tax: 0,
        total: parseFloat(amount)
      },
      paymentGateway: {
        name: 'eSewa',
        logo: 'https://esewa.com.np/common/images/esewa_og.png'
      }
    };
  }
}

module.exports = EsewaPaymentService;
