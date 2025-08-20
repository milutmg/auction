const express = require('express');
const crypto = require('crypto');
const db = require('../config/database');
const router = express.Router();

// Legacy (simplified) payment integration values
const ESEWA_MERCHANT_ID = process.env.ESEWA_MERCHANT_ID || 'EPAYTEST';
const ESEWA_SECRET_KEY = process.env.ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q';
const SUCCESS_URL = process.env.ESEWA_SUCCESS_URL || 'http://localhost:3001/api/payments/success';
const FAILURE_URL = process.env.ESEWA_FAILURE_URL || 'http://localhost:3001/api/payments/failure';

function generateSignature(message, secret) {
  return crypto.createHmac('sha256', secret).update(message).digest('base64');
}

// Initiate payment (no winner-only enforcement, legacy behavior)
router.get('/pay', async (req, res) => {
  const { auction_id, amount } = req.query;
  const transactionId = Date.now().toString();
  if (!auction_id || !amount) {
    return res.redirect(`${process.env.FRONTEND_URL || ''}/payment-failed?error=missing_params`);
  }

  try {
    // Create simple payment record
    await db.query(`INSERT INTO payment_transactions (auction_id, winner_id, transaction_id, amount, status) VALUES ($1, NULL, $2, $3, 'pending')`, [auction_id, transactionId, amount]);

    const signedFieldNames = 'total_amount,transaction_uuid,product_code';
    const message = `total_amount=${amount},transaction_uuid=${transactionId},product_code=${ESEWA_MERCHANT_ID}`;
    const signature = generateSignature(message, ESEWA_SECRET_KEY);

    const formHTML = `<!DOCTYPE html><html><head><meta charset=\"UTF-8\" /><title>Redirecting...</title></head><body><form id=\"f\" method=\"POST\" action=\"https://uat.esewa.com.np/epay/main\">\n<input type=hidden name=\"amount\" value=\"${amount}\" />\n<input type=hidden name=\"tax_amount\" value=\"0\" />\n<input type=hidden name=\"total_amount\" value=\"${amount}\" />\n<input type=hidden name=\"transaction_uuid\" value=\"${transactionId}\" />\n<input type=hidden name=\"product_code\" value=\"${ESEWA_MERCHANT_ID}\" />\n<input type=hidden name=\"product_service_charge\" value=\"0\" />\n<input type=hidden name=\"product_delivery_charge\" value=\"0\" />\n<input type=hidden name=\"success_url\" value=\"${SUCCESS_URL}?auction_id=${auction_id}\" />\n<input type=hidden name=\"failure_url\" value=\"${FAILURE_URL}?auction_id=${auction_id}\" />\n<input type=hidden name=\"signed_field_names\" value=\"${signedFieldNames}\" />\n<input type=hidden name=\"signature\" value=\"${signature}\" />\n</form><script>document.getElementById('f').submit();</script></body></html>`;
    res.send(formHTML);
  } catch (e) {
    console.error('legacy pay init error', e);
    res.redirect(`${process.env.FRONTEND_URL || ''}/payment-failed?auction_id=${auction_id}&error=init_failed`);
  }
});

// Success callback (simplified; no strict winning bid verification)
router.get('/success', async (req, res) => {
  const { auction_id, total_amount, transaction_uuid } = req.query;
  if (!auction_id || !transaction_uuid) {
    return res.redirect(`${process.env.FRONTEND_URL || ''}/payment-failed?error=missing_data`);
  }
  try {
    await db.query(`UPDATE payment_transactions SET status='complete', raw_response=$1, updated_at=NOW() WHERE transaction_id=$2`, [JSON.stringify(req.query), transaction_uuid]);
    // Basic notification (optional)
    try { await db.query(`INSERT INTO notifications (user_id,title,message,type,related_auction_id) VALUES (NULL,'Payment Successful','Payment completed for auction','payment_success',$1)`, [auction_id]); } catch {}
  } catch (e) {
    console.error('legacy success error', e);
  }
  // Legacy behavior: redirect to dedicated success page
  return res.redirect(`${process.env.FRONTEND_URL || ''}/payment-success?ref=${transaction_uuid}&auction_id=${auction_id}`);
});

router.get('/failure', async (req, res) => {
  const { auction_id, transaction_uuid } = req.query;
  try {
    if (transaction_uuid) {
      await db.query(`UPDATE payment_transactions SET status='failed', raw_response=$1, updated_at=NOW() WHERE transaction_id=$2`, [JSON.stringify(req.query), transaction_uuid]);
    }
  } catch (e) { console.error('legacy failure error', e); }
  return res.redirect(`${process.env.FRONTEND_URL || ''}/payment-failed?auction_id=${auction_id || ''}&error=failed`);
});

// Minimal dashboard (no pending event synthesis)
router.get('/dashboard/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await db.query(`SELECT pt.id, pt.transaction_id, pt.amount, pt.status, pt.created_at, a.id as auction_id, a.title as auction_title, a.image_url FROM payment_transactions pt JOIN auctions a ON pt.auction_id=a.id WHERE pt.winner_id = $1 OR pt.winner_id IS NULL ORDER BY pt.created_at DESC`, [userId]);
    res.json(result.rows);
  } catch (e) { console.error('legacy dashboard error', e); res.status(500).json({ error: 'failed' }); }
});

// Status endpoint
router.get('/status/:transactionId', async (req, res) => {
  const { transactionId } = req.params;
  try {
    const result = await db.query(`SELECT pt.*, a.title as auction_title FROM payment_transactions pt JOIN auctions a ON pt.auction_id=a.id WHERE pt.transaction_id=$1`, [transactionId]);
    if (!result.rows.length) return res.status(404).json({ error: 'not_found' });
    res.json(result.rows[0]);
  } catch (e) { console.error('legacy status error', e); res.status(500).json({ error: 'failed' }); }
});

module.exports = router;