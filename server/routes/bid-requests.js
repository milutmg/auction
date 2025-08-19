const express = require('express');
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Submit a new bid request
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      title,
      description,
      image_url,
      starting_bid,
      estimated_value,
      category,
      condition,
      provenance
    } = req.body;

    const user_id = req.user.id;

    if (!title || !description || !starting_bid) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await db.query(
      `INSERT INTO bid_requests 
        (user_id, title, description, image_url, starting_bid, estimated_value, category, condition, provenance, status)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending') 
      RETURNING *`,
      [user_id, title, description, image_url, starting_bid, estimated_value, category, condition, provenance]
    );

    res.status(201).json({
      message: 'Bid request submitted successfully',
      bidRequest: result.rows[0]
    });
  } catch (error) {
    console.error('Submit bid request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all pending bid requests (admin only)
router.get('/pending', requireAdmin, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT 
        bid_requests.*,
        users.full_name as user_name,
        users.email as user_email
      FROM bid_requests 
      INNER JOIN users ON bid_requests.user_id = users.id
      WHERE bid_requests.status = 'pending'
      ORDER BY bid_requests.created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get pending bid requests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's bid requests
router.get('/my-requests', authenticateToken, async (req, res) => {
  try {
    const user_id = req.user.id;

    const result = await db.query(
      `SELECT * FROM bid_requests 
      WHERE user_id = $1 
      ORDER BY created_at DESC`,
      [user_id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get user bid requests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update bid request (admin only)
router.patch('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      starting_bid,
      estimated_value,
      category,
      condition,
      image_url
    } = req.body;

    const result = await db.query(
      `UPDATE bid_requests SET 
        title = $1, description = $2, starting_bid = $3, estimated_value = $4,
        category = $5, condition = $6, image_url = $7, updated_at = NOW()
      WHERE id = $8 AND status = 'pending'
      RETURNING *`,
      [title, description, starting_bid, estimated_value, category, condition, image_url, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bid request not found or not pending' });
    }

    res.json({
      message: 'Bid request updated successfully',
      bidRequest: result.rows[0]
    });
  } catch (error) {
    console.error('Update bid request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Approve bid request and create auction (admin only)
router.post('/:id/approve', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { end_time, rules } = req.body;

    // Get the bid request
    const bidRequestResult = await db.query(
      'SELECT * FROM bid_requests WHERE id = $1',
      [id]
    );

    if (bidRequestResult.rows.length === 0) {
      return res.status(404).json({ error: 'Bid request not found' });
    }

    const bidRequest = bidRequestResult.rows[0];

    if (bidRequest.status !== 'pending') {
      return res.status(400).json({ error: 'Bid request is not pending' });
    }

    // Find or create category
    let categoryResult = await db.query(
      'SELECT id FROM categories WHERE name = $1',
      [bidRequest.category || 'Other']
    );

    let categoryId;
    if (categoryResult.rows.length === 0) {
      // Create the category if it doesn't exist
      categoryResult = await db.query(
        'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING id',
        [bidRequest.category || 'Other', `${bidRequest.category || 'Other'} category`]
      );
      categoryId = categoryResult.rows[0].id;
    } else {
      categoryId = categoryResult.rows[0].id;
    }

    // Calculate end time (default to 7 days from now if not provided)
    const auctionEndTime = end_time || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // Create auction from bid request with admin-configured rules
    const auctionResult = await db.query(
      `INSERT INTO auctions 
        (title, description, image_url, starting_bid, current_bid, category_id, seller_id, end_time, status, approval_status, min_bid_increment, auto_extend_minutes)
      VALUES 
        ($1, $2, $3, $4, $4, $5, $6, $7, 'active', 'approved', $8, $9) 
      RETURNING *`,
      [
        bidRequest.title,
        bidRequest.description,
        bidRequest.image_url,
        bidRequest.starting_bid,
        categoryId,
        bidRequest.user_id,
        auctionEndTime,
        rules?.min_bid_increment || 5,
        rules?.auto_extend_minutes || 10
      ]
    );

    // Update bid request status
    await db.query(
      'UPDATE bid_requests SET status = $1, auction_id = $2, updated_at = NOW() WHERE id = $3',
      ['approved', auctionResult.rows[0].id, id]
    );

    // Send approval notification
    try {
      const notificationService = require('../services/notificationService');
      await notificationService.sendBidApprovalNotification(
        bidRequest.user_id,
        bidRequest.title,
        auctionResult.rows[0].id
      );
    } catch (notificationError) {
      console.error('Failed to create approval notification:', notificationError);
    }

    res.json({
      message: 'Bid request approved and auction created',
      auction: auctionResult.rows[0]
    });
  } catch (error) {
    console.error('Approve bid request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reject bid request (admin only)
router.post('/:id/reject', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const result = await db.query(
      'UPDATE bid_requests SET status = $1, rejection_reason = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      ['rejected', reason, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bid request not found' });
    }

    const rejectedRequest = result.rows[0];

    // Send rejection notification
    try {
      const notificationService = require('../services/notificationService');
      await notificationService.sendBidRejectionNotification(
        rejectedRequest.user_id,
        rejectedRequest.title,
        reason
      );
    } catch (notificationError) {
      console.error('Failed to create rejection notification:', notificationError);
    }

    res.json({
      message: 'Bid request rejected',
      bidRequest: rejectedRequest
    });
  } catch (error) {
    console.error('Reject bid request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
