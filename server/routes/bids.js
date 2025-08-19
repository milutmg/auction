const express = require('express');
const db = require('../config/database');
const { optionalAuth, authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Place a bid on an auction
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { auctionId, amount } = req.body;
    const bidderId = req.user.id;

    // Validate input
    if (!auctionId || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid auction ID or bid amount' });
    }

    // Check if auction exists and is active
    const auctionResult = await db.query(
      'SELECT id, starting_bid, current_bid, end_time, approval_status FROM auctions WHERE id = $1',
      [auctionId]
    );

    if (auctionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Auction not found' });
    }

    const auction = auctionResult.rows[0];

    // Check if auction is approved and active
    if (auction.approval_status !== 'approved') {
      return res.status(400).json({ error: 'Auction is not approved for bidding' });
    }

    // Check if auction has ended
    if (new Date() > new Date(auction.end_time)) {
      return res.status(400).json({ error: 'Auction has ended' });
    }

    // Check if bid amount is valid
    const currentBid = parseFloat(auction.current_bid || auction.starting_bid);
    const minimumBid = currentBid + 1;
    
    if (amount < minimumBid) {
      return res.status(400).json({ 
        error: `Bid must be at least $${minimumBid}` 
      });
    }

    // Start transaction
    await db.query('BEGIN');

    try {
      // Insert the bid with pending status
      const bidResult = await db.query(
        'INSERT INTO bids (auction_id, bidder_id, amount, status) VALUES ($1, $2, $3, $4) RETURNING *',
        [auctionId, bidderId, amount, 'pending']
      );

      // DO NOT update auction's current bid yet - wait for admin approval
      
      // Commit transaction
      await db.query('COMMIT');

      // Get bidder name for response
      const userResult = await db.query(
        'SELECT full_name FROM users WHERE id = $1',
        [bidderId]
      );

      const bidData = {
        ...bidResult.rows[0],
        bidder_name: userResult.rows[0]?.full_name || 'Unknown'
      };

      res.status(201).json({
        message: 'Bid submitted successfully and pending admin approval',
        bid: bidData
      });

    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Place bid error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get bids for an auction
router.get('/auction/:auctionId', optionalAuth, async (req, res) => {
  try {
    const { auctionId } = req.params;
    const { limit = 10 } = req.query;

    const result = await db.query(
      `SELECT 
        bids.id, bids.amount, bids.created_at,
        users.full_name as bidder_name
      FROM bids 
      INNER JOIN users ON bids.bidder_id = users.id
      WHERE bids.auction_id = $1
      ORDER BY bids.created_at DESC
      LIMIT $2`,
      [auctionId, limit]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get bids error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get categories
router.get('/categories', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM categories ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
