const express = require('express');
const router = express.Router();

// eSewa success callback
router.get('/success', async (req, res) => {
  const { oid, amt, refId } = req.query;
  console.log('eSewa Success:', req.query);
  
  try {
    // Create success notification
    const io = req.app.get('io');
    if (io) {
      io.emit('payment-notification', {
        type: 'success',
        title: 'Payment Successful!',
        message: `Payment of Rs. ${amt || 'N/A'} completed successfully`,
        transactionId: oid || refId || 'N/A'
      });
    }
    
    res.redirect(`http://localhost:8080/payment-success?ref=${oid || refId || 'success'}&amount=${amt || ''}`);
  } catch (error) {
    console.error('Payment success processing error:', error);
    res.redirect(`http://localhost:8080/payment-success?ref=${oid || 'success'}`);
  }
});

// eSewa failure callback
router.get('/failure', async (req, res) => {
  const { oid, amt } = req.query;
  console.log('eSewa Failure:', req.query);
  
  try {
    // Create failure notification
    const io = req.app.get('io');
    if (io) {
      io.emit('payment-notification', {
        type: 'error',
        title: 'Payment Failed!',
        message: `Payment of Rs. ${amt || 'N/A'} was unsuccessful`,
        transactionId: oid || 'N/A'
      });
    }
    
    res.redirect(`http://localhost:8080/payment-failed?error=payment_failed&ref=${oid || ''}&amount=${amt || ''}`);
  } catch (error) {
    console.error('Payment failure processing error:', error);
    res.redirect(`http://localhost:8080/payment-failed?error=payment_failed`);
  }
});

module.exports = router;