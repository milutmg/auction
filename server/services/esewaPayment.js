const crypto = require('crypto');
const fetch = require('node-fetch');
const {
  ESEWA_CONFIG,
  generateEsewaPaymentData, // v1 legacy
  generateProductCode,
  validateEsewaResponse, // v1 legacy
  generateEsewaV2FormFields, // v2
} = require('../config/esewa');

/**
 * eSewa Payment Service
 * Handles eSewa payment integration for auction payments
 */
class EsewaPaymentService {
  
  /**
   * Initiate eSewa payment for an auction order (v2 preferred)
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

      // Use payment transaction UUID as unique id when available; fallback to generated code
      const transaction_uuid = `ORD_${orderId}_${Date.now()}`;

      // Prepare v2 form fields
      const fields = generateEsewaV2FormFields({
        amount: parseFloat(amount),
        tax_amount: 0,
        transaction_uuid,
        success_url: `${ESEWA_CONFIG.V2_SUCCESS_API}?order_id=${orderId}`,
        failure_url: `${ESEWA_CONFIG.V2_FAILURE_API}?order_id=${orderId}`,
      });

      // Keep a simple session object for debug/audit (optional)
      const paymentSession = {
        orderId,
        auctionId,
        transaction_uuid,
        amount: fields.total_amount,
        createdAt: new Date().toISOString(),
        status: 'initiated',
        via: 'esewa_v2'
      };

      return {
        success: true,
        paymentUrl: ESEWA_CONFIG.V2_FORM_URL,
        formData: fields,
        paymentSession,
        message: 'Payment initiated successfully (eSewa v2)'
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
   * Generate form data for eSewa payment (v1 legacy)
   * @param {Object} paymentData - Payment parameters
   * @returns {Object} Form data object
   */
  static generatePaymentFormData(paymentData) {
    // Delegate to legacy helper for backward compatibility
    return generateEsewaPaymentData(paymentData);
  }

  /**
   * Verify eSewa payment with their verification API (v1 legacy)
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

      // Make verification request to eSewa (v1 transrec)
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
   * Make verification request to eSewa API (v1 legacy)
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
   * Handle payment success callback (v1 legacy utility)
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
