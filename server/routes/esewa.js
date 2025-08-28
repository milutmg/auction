const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const fetch = require('node-fetch');
const EsewaPaymentService = require('../services/esewaPayment');

// Env/config
const ESEWA_MERCHANT_ID = process.env.ESEWA_MERCHANT_ID || 'EPAYTEST';
const ESEWA_SECRET_KEY = process.env.ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8080';
const VERIFY_BYPASS = (process.env.ESEWA_VERIFY_BYPASS || '').toLowerCase() === 'true';

function generateSignature(message, secret) {
  return crypto.createHmac('sha256', secret).update(message).digest('base64');
}

async function verifyEsewaV2({ transaction_uuid, total_amount }) {
  try {
    if (VERIFY_BYPASS) {
      console.warn('[ESEWA][VERIFY] BYPASS enabled');
      return { ok: true, raw: { bypass: true } };
    }
    const msg = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${ESEWA_MERCHANT_ID}`;
    const signature = generateSignature(msg, ESEWA_SECRET_KEY);
    const payload = {
      amount: total_amount,
      tax_amount: 0,
      total_amount,
      transaction_uuid,
      product_code: ESEWA_MERCHANT_ID,
      signature
    };

    const resp = await fetch('https://rc-epay.esewa.com.np/api/epay/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    });
    const text = await resp.text();
    let data; try { data = JSON.parse(text); } catch { data = { raw: text }; }
    console.log('[ESEWA][VERIFY v2] status:', resp.status, 'resp:', data);
    if (!resp.ok) return { ok: false, reason: `HTTP ${resp.status}`, raw: data };
    const status = (data.status || data.state || data.message || '').toString().toUpperCase();
    const success = status.includes('SUCCESS') || status.includes('COMPLETE') || data.code === 'SUCCESS';
    return { ok: !!success, raw: data };
  } catch (e) {
    console.error('[ESEWA][VERIFY v2] error:', e.message);
    return { ok: false, reason: e.message };
  }
}

// eSewa success callback (supports GET/POST)
router.all('/success', async (req, res) => {
  // v2 sends either GET or POST; collect from both
  const data = Object.keys(req.body || {}).length ? req.body : req.query;
  const { oid, amt, refId, orderId } = data; // v1 fields
  const { transaction_uuid } = data; // v2 field
  const total_amount = parseFloat(data.total_amount || data.amount || data.amt || 0);

  console.log('[ESEWA][SUCCESS] Incoming:', data);

  try {
    let verificationResult = { success: true };

    if (transaction_uuid) {
      // v2 flow
      const verified = await verifyEsewaV2({ transaction_uuid, total_amount: Number.isFinite(total_amount) ? total_amount : 0 });
      verificationResult = { success: !!verified.ok, raw: verified.raw };
    } else if (refId || oid) {
      // v1 flow
      if (VERIFY_BYPASS) {
        console.warn('[ESEWA][VERIFY v1] BYPASS enabled');
        verificationResult = { success: true };
      } else {
        console.log('[ESEWA][VERIFY v1] Starting transrec verification...');
        verificationResult = await EsewaPaymentService.verifyPayment(data);
        verificationResult.success = !!verificationResult.success;
      }
    }

    // Notify clients
    const io = req.app.get('io');
    if (io) {
      io.emit('payment-notification', {
        type: verificationResult.success ? 'success' : 'error',
        title: verificationResult.success ? 'Payment Verified!' : 'Payment Verification Failed',
        message: verificationResult.success
          ? `Payment of Rs. ${data.amount || amt || total_amount || 'N/A'} verified successfully`
          : `Payment of Rs. ${data.amount || amt || total_amount || 'N/A'} could not be verified`,
        transactionId: transaction_uuid || oid || refId || 'N/A',
        orderId: orderId || data.order_id || 'N/A'
      });
    }

    if (verificationResult.success) {
      return res.redirect(`${FRONTEND_URL}/payment-success?ref=${encodeURIComponent(transaction_uuid || oid || refId || 'success')}${(Number.isFinite(total_amount) && total_amount > 0) ? `&amount=${encodeURIComponent(total_amount)}` : (amt ? `&amount=${encodeURIComponent(amt)}` : '')}${(orderId || data.order_id) ? `&orderId=${encodeURIComponent(orderId || data.order_id)}` : ''}`);
    }

    return res.redirect(`${FRONTEND_URL}/payment-failed?error=verify_failed&ref=${encodeURIComponent(transaction_uuid || oid || refId || '')}${(Number.isFinite(total_amount) && total_amount > 0) ? `&amount=${encodeURIComponent(total_amount)}` : (amt ? `&amount=${encodeURIComponent(amt)}` : '')}${(orderId || data.order_id) ? `&orderId=${encodeURIComponent(orderId || data.order_id)}` : ''}`);
  } catch (error) {
    console.error('[ESEWA][SUCCESS] Processing error:', error);
    return res.redirect(`${FRONTEND_URL}/payment-failed?error=processing_error&ref=${encodeURIComponent(transaction_uuid || oid || refId || '')}`);
  }
});

// eSewa failure callback (supports GET/POST)
router.all('/failure', async (req, res) => {
  const data = Object.keys(req.body || {}).length ? req.body : req.query;
  const { oid, amt, orderId } = data;
  const { transaction_uuid } = data;
  const total_amount = parseFloat(data.total_amount || data.amount || data.amt || 0);
  console.warn('[ESEWA][FAILURE] Incoming:', data);

  try {
    const io = req.app.get('io');
    if (io) {
      io.emit('payment-notification', {
        type: 'error',
        title: 'Payment Failed!',
        message: `Payment of Rs. ${data.amount || amt || total_amount || 'N/A'} was unsuccessful`,
        transactionId: transaction_uuid || oid || 'N/A',
        orderId: orderId || data.order_id || 'N/A'
      });
    }

    res.redirect(`${FRONTEND_URL}/payment-failed?error=payment_failed&ref=${encodeURIComponent(transaction_uuid || oid || '')}${(Number.isFinite(total_amount) && total_amount > 0) ? `&amount=${encodeURIComponent(total_amount)}` : (amt ? `&amount=${encodeURIComponent(amt)}` : '')}${(orderId || data.order_id) ? `&orderId=${encodeURIComponent(orderId || data.order_id)}` : ''}`);
  } catch (error) {
    console.error('[ESEWA][FAILURE] Processing error:', error);
    res.redirect(`${FRONTEND_URL}/payment-failed?error=processing_error`);
  }
});

module.exports = router;