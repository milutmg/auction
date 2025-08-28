const express = require('express');
const crypto = require('crypto');
const db = require('../config/database');
const fetch = require('node-fetch');
const router = express.Router();

const ESEWA_MERCHANT_ID = process.env.ESEWA_MERCHANT_ID || 'EPAYTEST';
const ESEWA_SECRET_KEY = process.env.ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q';
// Use local callback endpoints that we control; they will redirect to frontend
// Update defaults to 3001 (current dev port). Prefer dynamic base computed per request below.
const SUCCESS_URL = process.env.ESEWA_SUCCESS_URL || 'http://localhost:3001/api/payments/success-v2';
const FAILURE_URL = process.env.ESEWA_FAILURE_URL || 'http://localhost:3001/api/payments/failure-v2';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8080';
const VERIFY_BYPASS = (process.env.ESEWA_VERIFY_BYPASS || '').toLowerCase() === 'true';

// Helper: compute callback base from request (respects proxies and custom ports)
function getCallbackBase(req) {
  const proto = (req.headers['x-forwarded-proto'] || req.protocol || 'http');
  const host = req.get('host');
  const envBase = process.env.ESEWA_CALLBACK_BASE; // e.g., https://yourdomain.com
  return envBase || `${proto}://${host}`;
}

// eSewa v2 signature helper
function generateSignature(message, secret) {
  return crypto.createHmac('sha256', secret).update(message).digest('base64');
}

// Verify payment with eSewa v2 verify endpoint
async function verifyEsewaPayment({ transaction_uuid, total_amount }) {
  try {
    if (VERIFY_BYPASS) {
      console.warn('[ESEWA][VERIFY] BYPASS enabled, treating as success for tx:', transaction_uuid);
      return { ok: true, raw: { bypass: true } };
    }
    // Prepare signature message per v2 docs
    const message = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${ESEWA_MERCHANT_ID}`;
    const signature = generateSignature(message, ESEWA_SECRET_KEY);

    const payload = {
      amount: total_amount, // retained for compatibility
      tax_amount: 0,
      total_amount,
      transaction_uuid,
      product_code: ESEWA_MERCHANT_ID,
      signature
    };

    console.log('[ESEWA][VERIFY] Payload:', payload);

    const resp = await fetch('https://rc-epay.esewa.com.np/api/epay/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    });

    const text = await resp.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    console.log('[ESEWA][VERIFY] Status:', resp.status, 'Response:', data);

    if (!resp.ok) {
      return { ok: false, reason: `HTTP ${resp.status}`, raw: data };
    }
    const status = (data.status || data.state || data.message || '').toString().toUpperCase();
    const success = status.includes('SUCCESS') || status.includes('COMPLETE') || data.code === 'SUCCESS';
    return { ok: !!success, raw: data };
  } catch (e) {
    console.error('[ESEWA][VERIFY] Error:', e.message);
    return { ok: false, reason: e.message };
  }
}

// CORS middleware
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Helper to resolve amount and contextual data from an order if provided
async function resolvePaymentContext({ orderId, explicitAmount }) {
  // Default values
  let amount = explicitAmount ? parseFloat(explicitAmount) : NaN;
  let auctionId = null;
  let winnerId = null;

  let orderAmount = NaN;

  if (!Number.isFinite(amount) && orderId) {
    // Try advanced schema first
    try {
      const adv = await db.query(
        `SELECT o.id, o.auction_id, o.buyer_id as winner_id, o.winning_bid_amount as amount
         FROM orders o WHERE o.id = $1`,
        [orderId]
      );
      if (adv.rows.length) {
        orderAmount = parseFloat(adv.rows[0].amount);
        auctionId = adv.rows[0].auction_id;
        winnerId = adv.rows[0].winner_id;
      }
    } catch (e) {
      // Fall back to basic schema (winner_id, final_amount)
      const basic = await db.query(
        `SELECT o.id, o.auction_id, o.winner_id, o.final_amount as amount
         FROM orders o WHERE o.id = $1`,
        [orderId]
      );
      if (basic.rows.length) {
        orderAmount = parseFloat(basic.rows[0].amount);
        auctionId = basic.rows[0].auction_id;
        winnerId = basic.rows[0].winner_id;
      }
    }

    // Subtract any already completed payments to get outstanding balance
    if (Number.isFinite(orderAmount)) {
      let alreadyPaid = 0;
      try {
        const paidRes = await db.query(
          `SELECT COALESCE(SUM(pt.gross_amount), 0) AS paid
           FROM payment_transactions pt
           WHERE pt.order_id = $1 AND pt.status IN ('complete','completed')`,
          [orderId]
        );
        alreadyPaid = parseFloat(paidRes.rows[0]?.paid || 0);
      } catch (e2) {
        // Try legacy column name 'amount'
        try {
          const paidRes2 = await db.query(
            `SELECT COALESCE(SUM(pt.amount), 0) AS paid
             FROM payment_transactions pt
             WHERE pt.order_id = $1 AND pt.status IN ('complete','completed')`,
            [orderId]
          );
          alreadyPaid = parseFloat(paidRes2.rows[0]?.paid || 0);
        } catch (e3) {
          alreadyPaid = 0;
        }
      }
      const outstanding = parseFloat((orderAmount - alreadyPaid).toFixed(2));
      if (outstanding > 0) {
        amount = outstanding;
      } else {
        // If non-positive, default to full order amount to avoid zero payments
        amount = orderAmount;
      }
    }
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    amount = 100; // sensible default for testing
  }

  return { amount, auctionId, winnerId };
}

// Create or upsert a minimal payment transaction record for tracking
async function ensurePendingTransaction({ transactionId, auctionId, winnerId, amount, orderId }) {
  try {
    // Try to insert into legacy/simple table layout
    await db.query(
      `INSERT INTO payment_transactions (auction_id, winner_id, transaction_id, amount, status, order_id)
       VALUES ($1, $2, $3, $4, 'pending', $5)`,
      [auctionId || null, winnerId || null, transactionId, amount, orderId || null]
    );
  } catch (e) {
    // If schema differs, try a more generic insert compatible with enhanced schema
    try {
      await db.query(
        `INSERT INTO payment_transactions (
           transaction_id, auction_id, payer_id, recipient_id,
           payment_method, payment_type,
           gross_amount, net_amount, platform_fee, payment_gateway_fee, currency,
           status, metadata, order_id, success_url, failure_url
         )
         VALUES ($1, $2, $3, $4,
                 $5, $6,
                 $7, $8, $9, $10, $11,
                 'pending', $12, $13, $14, $15)`,
        [
          transactionId, auctionId || null, winnerId || null, null,
          'esewa', 'auction_payment',
          amount, amount, 0, 0, 'NPR',
          JSON.stringify({ via: 'esewa_v2_helper' }), orderId || null,
          SUCCESS_URL, FAILURE_URL
        ]
      );
    } catch (e2) {
      // As a last resort, skip DB creation silently to not block payment init
      console.warn('Skipping payment_transactions insert (schema mismatch):', e2.message);
    }
  }
}

// Build auto-submitting HTML form targeting eSewa v2 endpoint
function buildEsewaV2Form({ amount, taxAmount, totalAmount, transactionId, successUrl, failureUrl }) {
  const signedFieldNames = 'total_amount,transaction_uuid,product_code';
  const message = `total_amount=${totalAmount},transaction_uuid=${transactionId},product_code=${ESEWA_MERCHANT_ID}`;
  const signature = generateSignature(message, ESEWA_SECRET_KEY);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Redirecting to eSewa...</title>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; background: #f5f5f5; }
        .container { max-width: 520px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .debug-info { background: #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0; font-family: monospace; }
        .btn { padding: 12px 22px; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Redirecting to eSewa...</h2>
        <p>Please wait while we redirect you to eSewa payment gateway.</p>
        <div class="debug-info">
          <strong>Debug Info:</strong> Amount: ${amount}, Transaction: ${transactionId}
        </div>
        <form id="esewaForm" method="POST" action="https://rc-epay.esewa.com.np/api/epay/main/v2/form">
          <input type="hidden" name="amount" value="${amount}">
          <input type="hidden" name="tax_amount" value="${taxAmount}">
          <input type="hidden" name="total_amount" value="${totalAmount}">
          <input type="hidden" name="transaction_uuid" value="${transactionId}">
          <input type="hidden" name="product_code" value="${ESEWA_MERCHANT_ID}">
          <input type="hidden" name="product_service_charge" value="0">
          <input type="hidden" name="product_delivery_charge" value="0">
          <input type="hidden" name="success_url" value="${successUrl}">
          <input type="hidden" name="failure_url" value="${failureUrl}">
          <input type="hidden" name="signed_field_names" value="${signedFieldNames}">
          <input type="hidden" name="signature" value="${signature}">
          <button type="submit" class="btn">Continue to eSewa Payment</button>
        </form>
        <p style="margin-top: 20px; color: #666;">If you are not redirected automatically, click the button above.</p>
      </div>
      <script>setTimeout(() => document.getElementById('esewaForm').submit(), 1200);</script>
    </body>
    </html>
  `;
}

// Initiate payment (GET) - supports amount or order_id
router.get('/custom-pay', async (req, res) => {
  try {
    const { amount: amountParam, order_id: orderId } = req.query;

    const { amount, auctionId, winnerId } = await resolvePaymentContext({
      orderId,
      explicitAmount: amountParam
    });

    const transactionId = Date.now().toString();
    const taxAmount = 0;
    const totalAmount = parseFloat((amount + taxAmount).toFixed(2));

    // Create pending transaction record (best-effort)
    await ensurePendingTransaction({ transactionId, auctionId, winnerId, amount: totalAmount, orderId });

    // Success/failure URLs should carry the transaction and order context
    const callbackBase = getCallbackBase(req);
    const successUrl = `${callbackBase}/api/payments/success-v2?transaction_uuid=${encodeURIComponent(transactionId)}${orderId ? `&order_id=${encodeURIComponent(orderId)}` : ''}`;
    const failureUrl = `${callbackBase}/api/payments/failure-v2?transaction_uuid=${encodeURIComponent(transactionId)}${orderId ? `&order_id=${encodeURIComponent(orderId)}` : ''}`;

    const formHTML = buildEsewaV2Form({ amount, taxAmount, totalAmount, transactionId, successUrl, failureUrl });
    res.send(formHTML);
  } catch (err) {
    console.error('eSewa v2 init (GET) error:', err);
    res.status(500).send('Failed to initiate payment');
  }
});

// Initiate payment (POST) - supports JSON body amount or order_id
router.post('/custom-pay', async (req, res) => {
  try {
    const { amount: amountParam, order_id: orderId } = req.body || {};

    const { amount, auctionId, winnerId } = await resolvePaymentContext({
      orderId,
      explicitAmount: amountParam
    });

    const transactionId = Date.now().toString();
    const taxAmount = 0;
    const totalAmount = parseFloat((amount + taxAmount).toFixed(2));

    await ensurePendingTransaction({ transactionId, auctionId, winnerId, amount: totalAmount, orderId });

    const callbackBase = getCallbackBase(req);
    const successUrl = `${callbackBase}/api/payments/success-v2?transaction_uuid=${encodeURIComponent(transactionId)}${orderId ? `&order_id=${encodeURIComponent(orderId)}` : ''}`;
    const failureUrl = `${callbackBase}/api/payments/failure-v2?transaction_uuid=${encodeURIComponent(transactionId)}${orderId ? `&order_id=${encodeURIComponent(orderId)}` : ''}`;

    const formHTML = buildEsewaV2Form({ amount, taxAmount, totalAmount, transactionId, successUrl, failureUrl });
    res.send(formHTML);
  } catch (err) {
    console.error('eSewa v2 init (POST) error:', err);
    res.status(500).send('Failed to initiate payment');
  }
});

// Success callback (supports GET/POST) - minimal verification and DB update
router.all('/success-v2', async (req, res) => {
  try {
    const data = Object.keys(req.body || {}).length ? req.body : req.query;
    const { transaction_uuid, refId, order_id } = data;
    const total_amount = parseFloat(data.total_amount || data.amt || data.amount || 0);

    console.log('[ESEWA][SUCCESS] Incoming:', data);

    // Verify with eSewa before marking complete
    let verified = { ok: false };
    if (transaction_uuid && Number.isFinite(total_amount) && total_amount > 0) {
      verified = await verifyEsewaPayment({ transaction_uuid, total_amount });
    } else if (VERIFY_BYPASS && transaction_uuid) {
      verified = { ok: true, raw: { bypass: true, note: 'no amount provided' } };
    }

    console.log('[ESEWA][SUCCESS] Verified:', verified);

    if (!verified.ok) {
      // Mark verification failed and redirect to failure page
      try {
        await db.query(
          `UPDATE payment_transactions 
           SET status='verification_failed', raw_response=$1, updated_at=NOW()
           WHERE transaction_id=$2`,
          [JSON.stringify({ ...data, verify: verified }), transaction_uuid]
        );
      } catch (e) {
        try {
          await db.query(
            `UPDATE payment_transactions 
             SET status='verification_failed', error_details=$1, updated_at=NOW()
             WHERE transaction_id=$2`,
            [JSON.stringify({ ...data, verify: verified }), transaction_uuid]
          );
        } catch (e2) {}
      }
      return res.redirect(`${FRONTEND_URL}/payment-failed?ref=${encodeURIComponent(transaction_uuid || '')}`);
    }

    // Update transaction as complete
    try {
      await db.query(
        `UPDATE payment_transactions 
         SET status='complete', raw_response=$1, updated_at=NOW()
         WHERE transaction_id=$2`,
        [JSON.stringify({ ...data, verify: verified.raw || null }), transaction_uuid]
      );
    } catch (e) {
      // If table shape differs, try enhanced schema field names
      try {
        await db.query(
          `UPDATE payment_transactions 
           SET status='completed', provider_response=$1, external_transaction_id=$2, processed_at=NOW(), updated_at=NOW()
           WHERE transaction_id=$3`,
          [JSON.stringify({ ...data, verify: verified.raw || null }), refId || null, transaction_uuid]
        );
      } catch (e2) {
        console.warn('Skipping payment_transactions update (schema mismatch):', e2.message);
      }
    }

    // Optionally, mark order as paid if provided and schema allows
    if (order_id) {
      // Decide whether order is fully paid based on sum of completed payments
      let finalAmount = null;
      try {
        const adv = await db.query(
          `SELECT o.winning_bid_amount AS amount FROM orders o WHERE o.id=$1`,
          [order_id]
        );
        if (adv.rows.length) finalAmount = parseFloat(adv.rows[0].amount);
      } catch (e) {}
      if (finalAmount === null) {
        try {
          const basic = await db.query(
            `SELECT o.final_amount AS amount FROM orders o WHERE o.id=$1`,
            [order_id]
          );
          if (basic.rows.length) finalAmount = parseFloat(basic.rows[0].amount);
        } catch (e2) {}
      }

      if (Number.isFinite(finalAmount)) {
        let totalPaid = 0;
        let canAggregatePayments = true; // if payment_transactions table/columns don't exist, fallback to full paid
        try {
          const paidRes = await db.query(
            `SELECT COALESCE(SUM(pt.gross_amount),0) AS paid
             FROM payment_transactions pt
             WHERE pt.order_id=$1 AND pt.status IN ('complete','completed')`,
            [order_id]
          );
          totalPaid = parseFloat(paidRes.rows[0]?.paid || 0);
        } catch (e3) {
          try {
            const paidRes2 = await db.query(
              `SELECT COALESCE(SUM(pt.amount),0) AS paid
               FROM payment_transactions pt
               WHERE pt.order_id=$1 AND pt.status IN ('complete','completed')`,
              [order_id]
            );
            totalPaid = parseFloat(paidRes2.rows[0]?.paid || 0);
          } catch (e4) {
            // Could not read from payment_transactions at all (likely table missing)
            canAggregatePayments = false;
            totalPaid = 0;
          }
        }

        // If we cannot aggregate payments (no table), consider this payment as fully settling the order
        const fullyPaid = canAggregatePayments ? (totalPaid >= finalAmount - 1e-6) : true;

        if (fullyPaid) {
          let orderUpdated = false;
          try {
            await db.query(`UPDATE orders SET payment_status='paid', updated_at=NOW() WHERE id=$1`, [order_id]);
            orderUpdated = true;
          } catch (e) {}
          // Always ensure legacy schemas get marked as paid
          if (!orderUpdated) {
            try { await db.query(`UPDATE orders SET status='paid', updated_at=NOW() WHERE id=$1`, [order_id]); } catch (e2) {}
          }
        } else {
          // Mark as partial if supported; otherwise leave as is
          let partialUpdated = false;
          try { 
            await db.query(`UPDATE orders SET payment_status='partial', updated_at=NOW() WHERE id=$1`, [order_id]);
            partialUpdated = true;
          } catch (e) {}
          // If we cannot track partials (no column) and cannot aggregate payments reliably, mark legacy order as paid
          if (!partialUpdated && !canAggregatePayments) {
            try { await db.query(`UPDATE orders SET status='paid', updated_at=NOW() WHERE id=$1`, [order_id]); } catch (e2) {}
          }
        }
      } else {
        // Fallback to previous behavior if we couldn't determine final amount
        let orderUpdated = false;
        try {
          await db.query(`UPDATE orders SET payment_status='paid', updated_at=NOW() WHERE id=$1`, [order_id]);
          orderUpdated = true;
        } catch (e) {}
        if (!orderUpdated) {
          try { await db.query(`UPDATE orders SET status='paid', updated_at=NOW() WHERE id=$1`, [order_id]); } catch (e2) {}
        }
      }
    }

    // Redirect to frontend success page (include order_id)
    return res.redirect(`${FRONTEND_URL}/payment-success?ref=${encodeURIComponent(transaction_uuid)}${Number.isFinite(total_amount) && total_amount > 0 ? `&amount=${encodeURIComponent(total_amount)}` : ''}${order_id ? `&order_id=${encodeURIComponent(order_id)}` : ''}`);
  } catch (err) {
    console.error('eSewa success-v2 handler error:', err);
    return res.redirect(`${FRONTEND_URL}/payment-success`);
  }
});

// Failure callback (supports GET/POST)
router.all('/failure-v2', async (req, res) => {
  try {
    const data = Object.keys(req.body || {}).length ? req.body : req.query;
    const { transaction_uuid, order_id } = data;

    console.warn('[ESEWA][FAILURE] Incoming:', data);

    try {
      await db.query(
        `UPDATE payment_transactions 
         SET status='failed', raw_response=$1, updated_at=NOW()
         WHERE transaction_id=$2`,
        [JSON.stringify(data), transaction_uuid]
      );
    } catch (e) {
      try {
        await db.query(
          `UPDATE payment_transactions 
           SET status='failed', error_details=$1, updated_at=NOW()
           WHERE transaction_id=$2`,
          [JSON.stringify(data), transaction_uuid]
        );
      } catch (e2) {
        console.warn('Skipping payment_transactions failure update (schema mismatch):', e2.message);
      }
    }

    if (order_id) {
      let orderUpdated = false;
      try { 
        await db.query(`UPDATE orders SET payment_status='failed', updated_at=NOW() WHERE id=$1`, [order_id]); 
        orderUpdated = true;
      } catch {}
      if (!orderUpdated) {
        try { await db.query(`UPDATE orders SET status='failed', updated_at=NOW() WHERE id=$1`, [order_id]); } catch {}
      }
    }

    return res.redirect(`${FRONTEND_URL}/payment-failed?ref=${encodeURIComponent(transaction_uuid || '')}`);
  } catch (err) {
    console.error('eSewa failure-v2 handler error:', err);
    return res.redirect(`${FRONTEND_URL}/payment-failed`);
  }
});

module.exports = router;