const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Middleware to check if user is admin
function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access only' });
  }
  next();
}

// Get all recent bids for admin dashboard
router.get('/recent-bids', authenticateToken, adminOnly, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        b.id as bid_id,
        b.amount,
        b.status,
        b.created_at,
        a.id as auction_id,
        a.title as auction_title,
        a.description as auction_description,
        a.image_url as auction_image,
        a.current_bid,
        a.starting_bid,
        u.id as bidder_id,
        u.full_name as bidder_name,
        u.email as bidder_email,
        u.avatar_url as bidder_avatar,
        c.name as category_name
      FROM bids b
      JOIN auctions a ON b.auction_id = a.id
      JOIN users u ON b.bidder_id = u.id
      LEFT JOIN categories c ON a.category_id = c.id
      ORDER BY b.created_at DESC
      LIMIT 20
    `);

    res.json({
      recent_bids: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Get recent bids error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;