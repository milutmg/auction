const express = require('express');
const db = require('../config/database');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');
// Add eSewa payment service
const EsewaPaymentService = require('../services/esewaPayment');

const router = express.Router();

// Get auction statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await db.query(`
      SELECT 
        COUNT(*) as total_auctions,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_auctions,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_auctions,
        COUNT(CASE WHEN status = 'ended' THEN 1 END) as ended_auctions,
        COALESCE(SUM(CASE WHEN status = 'active' THEN COALESCE(current_bid, starting_bid) END), 0) as total_active_value,
        COALESCE(AVG(CASE WHEN status = 'active' THEN COALESCE(current_bid, starting_bid) END), 0) as avg_auction_value
      FROM auctions
    `);

    const categoryStats = await db.query(`
      SELECT 
        c.name as category_name,
        COUNT(a.id) as auction_count,
        COALESCE(SUM(COALESCE(a.current_bid, a.starting_bid)), 0) as total_value
      FROM categories c
      LEFT JOIN auctions a ON c.id = a.category_id
      GROUP BY c.id, c.name
      ORDER BY auction_count DESC
    `);

    res.json({
      overall: stats.rows[0],
      by_category: categoryStats.rows
    });
  } catch (error) {
    console.error('Get auction stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get trending auctions
router.get('/trending', async (req, res) => {
  try {
    const { limit = 6 } = req.query;
    
    const result = await db.query(`
      SELECT 
        a.id, 
        a.title, 
        a.image_url, 
        a.starting_bid, 
        a.current_bid, 
        a.end_time, 
        a.status,
        c.name as category_name, 
        u.full_name as seller_name,
        COUNT(b.id) as bid_count,
        COALESCE(a.current_bid, a.starting_bid) as current_price
      FROM auctions a
      INNER JOIN categories c ON a.category_id = c.id
      INNER JOIN users u ON a.seller_id = u.id
      LEFT JOIN bids b ON a.id = b.auction_id
      WHERE a.status = 'active' 
        AND a.end_time > NOW()
        AND a.approval_status = 'approved'
      GROUP BY a.id, c.name, u.full_name
      ORDER BY bid_count DESC, current_price DESC
      LIMIT $1
    `, [parseInt(limit)]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get trending auctions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get featured auctions
router.get('/featured', async (req, res) => {
  try {
    const { limit = 4 } = req.query;
    
    const result = await db.query(`
      SELECT 
        a.id, 
        a.title, 
        a.description,
        a.image_url, 
        a.starting_bid, 
        a.current_bid, 
        a.end_time, 
        a.status,
        c.name as category_name, 
        u.full_name as seller_name,
        COUNT(b.id) as bid_count
      FROM auctions a
      INNER JOIN categories c ON a.category_id = c.id
      INNER JOIN users u ON a.seller_id = u.id
      LEFT JOIN bids b ON a.id = b.auction_id
      WHERE a.status = 'active' 
        AND a.end_time > NOW()
        AND a.approval_status = 'approved'
        AND COALESCE(a.current_bid, a.starting_bid) >= 100
      GROUP BY a.id, c.name, u.full_name
      ORDER BY COALESCE(a.current_bid, a.starting_bid) DESC
      LIMIT $1
    `, [parseInt(limit)]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get featured auctions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List auctions created by current user
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await db.query(`
      SELECT 
        a.id,
        a.title,
        a.description,
        a.image_url,
        a.starting_bid,
        a.current_bid,
        a.status,
        a.approval_status,
        a.created_at,
        c.name as category_name,
        (SELECT COUNT(*) FROM bids b WHERE b.auction_id = a.id) as bid_count
      FROM auctions a
      LEFT JOIN categories c ON a.category_id = c.id
      WHERE a.seller_id = $1
      ORDER BY a.created_at DESC
    `, [userId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get my auctions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all auctions with enhanced filtering
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { 
      category, 
      status, 
      search, 
      sort = 'created_at', 
      order = 'DESC', 
      page = 1, 
      limit = 12,
      min_price,
      max_price 
    } = req.query;

    let query = `SELECT 
      auctions.id, 
      auctions.title, 
      auctions.description,
      auctions.image_url, 
      auctions.starting_bid, 
      auctions.current_bid, 
      auctions.end_time, 
      auctions.status,
      auctions.approval_status,
      auctions.created_at,
      auctions.seller_id,
      categories.id as category_id,
      categories.name as category_name, 
      users.full_name as seller_name,
      (SELECT COUNT(*) FROM bids WHERE auction_id = auctions.id) as bid_count,
      (SELECT COUNT(*) FROM users WHERE id = auctions.seller_id) as seller_exists
      FROM auctions 
      INNER JOIN categories ON auctions.category_id = categories.id
      INNER JOIN users ON auctions.seller_id = users.id
      WHERE 1=1`;

    const params = [];

    // Only show approved + active auctions to public (non-auth) users
    if (!req.user) {
      query += ` AND auctions.approval_status = 'approved' AND auctions.status = 'active'`;
    } else if (req.user && req.user.role !== 'admin') {
      // Authenticated non-admin: approved active OR own pending
      params.push(req.user.id);
      query += ` AND ((auctions.approval_status = 'approved' AND auctions.status = 'active') OR auctions.seller_id = $${params.length})`;
    }

    // Category filter
    if (category && category !== 'All Categories') {
      params.push(category);
      query += ` AND categories.name = $${params.length}`;
    }

    // Status filter
    if (status) {
      params.push(status);
      query += ` AND auctions.status = $${params.length}`;
    }

    // Search filter
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (auctions.title ILIKE $${params.length} OR auctions.description ILIKE $${params.length})`;
    }

    // Price range filters
    if (min_price) {
      params.push(parseFloat(min_price));
      query += ` AND COALESCE(auctions.current_bid, auctions.starting_bid) >= $${params.length}`;
    }

    if (max_price) {
      params.push(parseFloat(max_price));
      query += ` AND COALESCE(auctions.current_bid, auctions.starting_bid) <= $${params.length}`;
    }

    // Sorting
    const validSortFields = ['created_at', 'title', 'current_bid', 'starting_bid', 'end_time'];
    const validOrders = ['ASC', 'DESC'];
    const sortField = validSortFields.includes(sort) ? sort : 'created_at';
    const sortOrder = validOrders.includes(order.toUpperCase()) ? order.toUpperCase() : 'DESC';
    
    if (sortField === 'current_bid') {
      query += ` ORDER BY COALESCE(auctions.current_bid, auctions.starting_bid) ${sortOrder}`;
    } else {
      query += ` ORDER BY auctions.${sortField} ${sortOrder}`;
    }

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    params.push(parseInt(limit), offset);
    query += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const result = await db.query(query, params);

    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) as total FROM auctions 
      INNER JOIN categories ON auctions.category_id = categories.id
      INNER JOIN users ON auctions.seller_id = users.id
      WHERE 1=1`;

    const countParams = [];
    let paramIndex = 0;

    // Apply same approval visibility rules to count query
    if (!req.user) {
      countQuery += ` AND auctions.approval_status = 'approved' AND auctions.status = 'active'`;
    } else if (req.user && req.user.role !== 'admin') {
      countParams.push(req.user.id);
      countQuery += ` AND ((auctions.approval_status = 'approved' AND auctions.status = 'active') OR auctions.seller_id = $${++paramIndex})`;
    }

    if (category && category !== 'All Categories') {
      countParams.push(category);
      countQuery += ` AND categories.name = $${++paramIndex}`;
    }

    if (status) {
      countParams.push(status);
      countQuery += ` AND auctions.status = $${++paramIndex}`;
    }

    if (search) {
      countParams.push(`%${search}%`);
      countQuery += ` AND (auctions.title ILIKE $${++paramIndex} OR auctions.description ILIKE $${paramIndex})`;
    }

    if (min_price) {
      countParams.push(parseFloat(min_price));
      countQuery += ` AND COALESCE(auctions.current_bid, auctions.starting_bid) >= $${++paramIndex}`;
    }

    if (max_price) {
      countParams.push(parseFloat(max_price));
      countQuery += ` AND COALESCE(auctions.current_bid, auctions.starting_bid) <= $${++paramIndex}`;
    }

    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    // --- Defensive visibility sanitization (extra safety net) ---
    // Even though SQL WHERE clause should already enforce visibility, we add a
    // final in-memory filter to guarantee no unapproved auctions leak to public
    // or to other users. If any rows are stripped here, we log a warning so we
    // can trace unexpected behaviour in upstream query construction.
    let visibleRows = result.rows;
    if (!req.user) {
      const before = visibleRows.length;
      visibleRows = visibleRows.filter(a => a.approval_status === 'approved' && a.status === 'active');
      if (visibleRows.length !== before) {
        console.warn('[AUCTIONS] Sanitization removed %d unapproved rows for public request', before - visibleRows.length);
      }
    } else if (req.user.role !== 'admin') {
      const before = visibleRows.length;
      visibleRows = visibleRows.filter(a => (
        (a.approval_status === 'approved' && a.status === 'active') || a.seller_id === req.user.id
      ));
      if (visibleRows.length !== before) {
        console.warn('[AUCTIONS] Sanitization removed %d unapproved rows for user=%s', before - visibleRows.length, req.user.id);
      }
    }
    // Admin keeps full result set

    // If sanitization altered the number of returned rows unexpectedly compared to the
    // count query, log a diagnostic to help debugging.
    if (visibleRows.length > 0 && visibleRows.length < result.rows.length) {
      console.warn('[AUCTIONS] Post-filter mismatch: sqlReturned=%d afterSanitize=%d user=%s role=%s', result.rows.length, visibleRows.length, req.user?.id || 'public', req.user?.role || 'public');
    }

    res.json({
      auctions: visibleRows,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / parseInt(limit)),
        total_items: total,
        items_per_page: parseInt(limit)
      },
      filters: {
        category,
        status,
        search,
        min_price,
        max_price,
        sort: sortField,
        order: sortOrder
      }
    });
  } catch (error) {
    console.error('Get auctions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a single auction
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT 
        auctions.id, 
        auctions.title, 
        auctions.description, 
        auctions.image_url, 
        auctions.thumbnail_url, 
        auctions.starting_bid, 
        auctions.current_bid, 
        auctions.reserve_price, 
        auctions.estimated_value_min, 
        auctions.estimated_value_max, 
        auctions.end_time, 
        auctions.status,
        auctions.approval_status,
        auctions.seller_id,
        auctions.created_at,
        categories.name as category_name, 
        users.full_name as seller_name
      FROM auctions 
      INNER JOIN categories ON auctions.category_id = categories.id
      INNER JOIN users ON auctions.seller_id = users.id
      WHERE auctions.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Auction not found' });
    }

    const auction = result.rows[0];

    // Visibility rule: if not approved, only seller or admin can view
    if (auction.approval_status !== 'approved') {
      if (!req.user || (req.user.role !== 'admin' && req.user.id !== auction.seller_id)) {
        return res.status(404).json({ error: 'Auction not found' });
      }
    }

    res.json(auction);
  } catch (error) {
    console.error('Get auction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new auction
router.post('/', authenticateToken, (req, res, next) => {
  upload.fields([{ name: 'image', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }])(req, res, (err) => {
    if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    const { title, description, starting_bid, reserve_price, 
            estimated_value_min, estimated_value_max, category_id, end_time } = req.body;

    const seller_id = req.user.id;

    if (!title || !starting_bid || !category_id || !end_time) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Handle uploaded image or provided image URL
    let image_url = req.body.image_url;
    let thumbnail_url = null;
    
    if (req.files) {
      if (req.files.image && req.files.image[0]) {
        image_url = `/uploads/${req.files.image[0].filename}`;
      }
      if (req.files.thumbnail && req.files.thumbnail[0]) {
        thumbnail_url = `/uploads/${req.files.thumbnail[0].filename}`;
      }
    }

    const result = await db.query(
      `INSERT INTO auctions 
        (title, description, image_url, thumbnail_url, starting_bid, reserve_price, 
        estimated_value_min, estimated_value_max, category_id, seller_id, end_time, status, approval_status)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending', 'pending') 
      RETURNING *`,
      [title, description, image_url, thumbnail_url, starting_bid, reserve_price, 
      estimated_value_min, estimated_value_max, category_id, seller_id, end_time]
    );

    const auction = result.rows[0];

    // Emit real-time creation event for user dashboards / activity feeds
    try {
      const io = req.app.get('io');
      if (io) {
        io.emit('auction-created', {
          auctionId: auction.id,
          sellerId: seller_id,
          title: auction.title,
          startingBid: auction.starting_bid,
          approval_status: auction.approval_status,
          created_at: auction.created_at || new Date().toISOString()
        });
      }
    } catch (emitErr) {
      console.error('Failed to emit auction-created:', emitErr);
    }

    // Send notification to all admins about new auction pending approval
    try {
      const adminResult = await db.query(
        'SELECT id FROM users WHERE role = $1',
        ['admin']
      );

      if (adminResult.rows.length > 0) {
        for (const admin of adminResult.rows) {
          await db.query(
            `INSERT INTO notifications (user_id, type, title, message, related_auction_id, is_read)
             VALUES ($1, $2, $3, $4, $5, false)`,
            [
              admin.id,
              'auction_pending_approval',
              'New Auction Awaiting Approval',
              `A new auction "${title}" has been submitted and requires approval. Starting bid: $${starting_bid}`,
              auction.id
            ]
          );
        }
        console.log(`Sent approval notifications to ${adminResult.rows.length} admins for auction: ${title}`);
      } else {
        console.log('No admin users found to notify');
      }
    } catch (notificationError) {
      console.error('Failed to send admin notifications:', notificationError);
      // Don't fail the auction creation if notification fails
    }

    res.status(201).json(auction);
  } catch (error) {
    console.error('Create auction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Place a bid
router.post('/:id/bid', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;
    const bidder_id = req.user.id;

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid bid amount' });
    }

    const auction = await db.query('SELECT * FROM auctions WHERE id = $1', [id]);
    const auctionData = auction.rows[0];

    if (!auctionData) {
      return res.status(404).json({ error: 'Auction not found' });
    }

    if (auctionData.status !== 'active') {
      return res.status(400).json({ error: 'Bidding is closed for this auction' });
    }

    // Check if bid is higher than current bid or starting bid
    const currentHighest = auctionData.current_bid || auctionData.starting_bid;
    if (parseFloat(amount) <= parseFloat(currentHighest)) {
      return res.status(400).json({ 
        error: `Bid must be higher than $${parseFloat(currentHighest).toFixed(2)}` 
      });
    }

    // Check if user is not bidding on their own auction
    if (auctionData.seller_id === bidder_id) {
      return res.status(400).json({ error: 'You cannot bid on your own auction' });
    }

    // Insert bid as pending (requires admin approval)
    const result = await db.query(
      `INSERT INTO bids (auction_id, bidder_id, amount, status) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [id, bidder_id, amount, 'pending']
    );

    res.status(201).json({
      message: 'Bid submitted successfully and pending admin approval',
      bid: result.rows[0]
    });
  } catch (error) {
    console.error('Place bid error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Post a comment on an auction
router.post('/:id/comments', authenticateToken, async (req, res) => {
  try {
    const { id: auctionId } = req.params;
    const { comment, parentId } = req.body;
    const userId = req.user.id;

    if (!comment) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const result = await db.query(
      `INSERT INTO auction_comments 
        (auction_id, user_id, comment, parent_id)
      VALUES 
        ($1, $2, $3, $4) 
      RETURNING *`,
      [auctionId, userId, comment, parentId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Post comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get bids for an auction (approved only)
router.get('/:id/bids', optionalAuth, async (req, res) => {
  try {
    const { id: auctionId } = req.params;

    const result = await db.query(
      `SELECT 
        bids.id, bids.amount, bids.created_at, bids.status,
        users.full_name as bidder_name,
        users.id as bidder_id
      FROM bids 
      INNER JOIN users ON bids.bidder_id = users.id
      WHERE bids.auction_id = $1 AND bids.status = 'approved'
      ORDER BY bids.amount DESC, bids.created_at DESC`,
      [auctionId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get bids error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all bids for an auction (including pending/rejected for transparency)
router.get('/:id/bids/all', optionalAuth, async (req, res) => {
  try {
    const { id: auctionId } = req.params;

    const result = await db.query(
      `SELECT 
        bids.id, bids.amount, bids.created_at, bids.status,
        users.full_name as bidder_name,
        users.id as bidder_id
      FROM bids 
      INNER JOIN users ON bids.bidder_id = users.id
      WHERE bids.auction_id = $1
      ORDER BY bids.created_at DESC`,
      [auctionId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get all bids error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get comments for an auction
router.get('/:id/comments', optionalAuth, async (req, res) => {
  try {
    const { id: auctionId } = req.params;

    const result = await db.query(
      `SELECT 
        auction_comments.id, auction_comments.comment, auction_comments.created_at,
        auction_comments.parent_id, 
        users.full_name as commenter_name
      FROM auction_comments 
      INNER JOIN users ON auction_comments.user_id = users.id
      WHERE auction_comments.auction_id = $1
      ORDER BY auction_comments.created_at ASC`,
      [auctionId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create order for winning bid
router.post('/:id/order', authenticateToken, async (req, res) => {
  try {
    const { id: auctionId } = req.params;
    const winnerId = req.user.id;

    // Check if user won the auction
    const auctionResult = await db.query('SELECT * FROM auctions WHERE id = $1 AND status = $2', [auctionId, 'ended']);
    const auction = auctionResult.rows[0];

    if (!auction) {
      return res.status(404).json({ error: 'Auction not found or not ended' });
    }

    if (auction.current_bidder_id !== winnerId) {
      return res.status(400).json({ error: 'You did not win this auction' });
    }

    // Create order
    const orderResult = await db.query(
      `INSERT INTO orders (auction_id, winner_id, final_amount, payment_deadline)
      VALUES ($1, $2, $3, NOW() + INTERVAL '1 day' * auctions.payment_deadline_hours)
      RETURNING *`,
      [auctionId, winnerId, auction.current_bid]
    );

    res.status(201).json(orderResult.rows[0]);
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Pay for order
router.post('/order/:orderId/pay', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    // Check if order exists and belongs to user
    const orderResult = await db.query('SELECT * FROM orders WHERE id = $1 AND winner_id = $2', [orderId, userId]);
    const order = orderResult.rows[0];

    if (!order) {
      return res.status(404).json({ error: 'Order not found or not owned by you' });
    }

    // Update order to paid
    const updatedOrderResult = await db.query(
      `UPDATE orders SET status = 'paid', updated_at = NOW() WHERE id = $1 RETURNING *`,
      [orderId]
    );

    res.json({
      message: 'Payment successful',
      order: updatedOrderResult.rows[0]
    });
  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// eSewa Payment Integration Endpoints

// Initiate eSewa payment for an order
router.post('/order/:orderId/payment/esewa/initiate', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    // Get order details with auction information
    const orderResult = await db.query(`
      SELECT o.*, a.title as auction_title, a.id as auction_id, u.email as winner_email
      FROM orders o 
      JOIN auctions a ON o.auction_id = a.id 
      JOIN users u ON o.winner_id = u.id
      WHERE o.id = $1 AND o.winner_id = $2 AND o.status = 'pending'
    `, [orderId, userId]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Order not found, not owned by you, or already paid' 
      });
    }

    const order = orderResult.rows[0];

    // Prepare order data for eSewa
    const orderData = {
      orderId: order.id,
      auctionId: order.auction_id,
      amount: order.final_amount,
      auctionTitle: order.auction_title,
      winnerEmail: order.winner_email
    };

    // Initiate eSewa payment
    const paymentResult = await EsewaPaymentService.initiatePayment(orderData);

    if (paymentResult.success) {
      // Store payment session in database (optional, for tracking)
      await db.query(`
        UPDATE orders 
        SET payment_method = 'esewa', updated_at = NOW() 
        WHERE id = $1
      `, [orderId]);

      // Generate payment summary
      const paymentSummary = EsewaPaymentService.generatePaymentSummary(orderData);

      res.json({
        success: true,
        message: 'eSewa payment initiated successfully',
        payment: {
          paymentUrl: paymentResult.paymentUrl,
          formData: paymentResult.formData,
          summary: paymentSummary
        }
      });
    } else {
      res.status(400).json({
        error: 'Failed to initiate eSewa payment',
        message: paymentResult.message
      });
    }

  } catch (error) {
    console.error('eSewa payment initiation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Handle eSewa payment success callback
router.post('/payment/esewa/success', async (req, res) => {
  try {
    const { orderId } = req.query;
    const callbackData = req.body;

    console.log('eSewa success callback:', { orderId, callbackData });

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    // Handle payment success and verification
    const result = await EsewaPaymentService.handlePaymentSuccess(callbackData, orderId);

    if (result.success) {
      // Update order status to paid
      const updateResult = await db.query(`
        UPDATE orders 
        SET status = 'paid', 
            payment_method = 'esewa',
            updated_at = NOW()
        WHERE id = $1 
        RETURNING *
      `, [orderId]);

      if (updateResult.rows.length > 0) {
        // Log successful payment
        console.log(`eSewa payment successful for order ${orderId}:`, result);
        
        res.json({
          success: true,
          message: 'Payment completed successfully',
          order: updateResult.rows[0],
          transaction: {
            transactionId: result.transactionId,
            amount: result.amount,
            verifiedAt: result.verifiedAt
          }
        });
      } else {
        res.status(404).json({ error: 'Order not found' });
      }
    } else {
      res.status(400).json({
        error: 'Payment verification failed',
        message: result.message
      });
    }

  } catch (error) {
    console.error('eSewa success callback error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Handle eSewa payment failure callback
router.post('/payment/esewa/failure', async (req, res) => {
  try {
    const { orderId } = req.query;

    console.log('eSewa failure callback for order:', orderId);

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    // Handle payment failure
    const result = await EsewaPaymentService.handlePaymentFailure(orderId);

    // Optionally update order with failure information
    await db.query(`
      UPDATE orders 
      SET updated_at = NOW()
      WHERE id = $1
    `, [orderId]);

    res.json({
      success: false,
      message: 'Payment was cancelled or failed',
      orderId: orderId,
      failedAt: result.failedAt
    });

  } catch (error) {
    console.error('eSewa failure callback error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get order details with payment status
router.get('/order/:orderId', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const orderResult = await db.query(`
      SELECT o.*, a.title as auction_title, a.image_url as auction_image,
             u.full_name as winner_name
      FROM orders o 
      JOIN auctions a ON o.auction_id = a.id 
      JOIN users u ON o.winner_id = u.id
      WHERE o.id = $1 AND o.winner_id = $2
    `, [orderId, userId]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderResult.rows[0];
    
    // Generate payment summary if order is pending
    let paymentSummary = null;
    if (order.status === 'pending') {
      paymentSummary = EsewaPaymentService.generatePaymentSummary({
        orderId: order.id,
        amount: order.final_amount,
        auctionTitle: order.auction_title
      });
    }

    res.json({
      order,
      paymentSummary
    });

  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Get pending bids
router.get('/admin/bids/pending', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const result = await db.query(
      `SELECT 
        b.id, b.amount, b.created_at, b.status,
        a.id as auction_id, a.title as auction_title, a.current_bid, a.starting_bid,
        u.full_name as bidder_name, u.email as bidder_email
      FROM bids b
      INNER JOIN auctions a ON b.auction_id = a.id
      INNER JOIN users u ON b.bidder_id = u.id
      WHERE b.status = 'pending'
      ORDER BY b.created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get pending bids error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Approve bid
router.post('/admin/bids/:bidId/approve', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { bidId } = req.params;

    await db.query('BEGIN');

    try {
      // Get bid details with bidder name
      const bidResult = await db.query(
        `SELECT b.*, u.full_name as bidder_name FROM bids b 
         JOIN users u ON b.bidder_id = u.id 
         WHERE b.id = $1 AND b.status = $2`,
        [bidId, 'pending']
      );

      if (bidResult.rows.length === 0) {
        await db.query('ROLLBACK');
        return res.status(404).json({ error: 'Pending bid not found' });
      }

      const bid = bidResult.rows[0];

      // Update bid status to approved
      await db.query(
        'UPDATE bids SET status = $1 WHERE id = $2',
        ['approved', bidId]
      );

      // Update auction current_bid
      await db.query(
        'UPDATE auctions SET current_bid = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [bid.amount, bid.auction_id]
      );

      // Send notification to bidder
      const auctionResult = await db.query(
        'SELECT title FROM auctions WHERE id = $1',
        [bid.auction_id]
      );
      
      if (auctionResult.rows.length > 0) {
        await db.query(
          `INSERT INTO notifications (user_id, type, title, message, related_auction_id, is_read)
           VALUES ($1, $2, $3, $4, $5, false)`,
          [
            bid.bidder_id,
            'bid_approved',
            'Bid Approved! 🎉',
            `Congratulations! Your bid of $${parseFloat(bid.amount).toFixed(2)} for "${auctionResult.rows[0].title}" has been approved and you are now the highest bidder!`,
            bid.auction_id
          ]
        );
      }

      await db.query('COMMIT');

      // Emit real-time event
      try {
        const io = req.app.get('io');
        if (io) {
          io.emit('bid-approved', {
            bidId,
            auctionId: bid.auction_id,
            amount: bid.amount,
            bidderId: bid.bidder_id,
            bidderName: bid.bidder_name,
            timestamp: new Date().toISOString()
          });
        }
      } catch (emitErr) { console.error('Emit bid-approved failed:', emitErr); }

      res.json({ message: 'Bid approved successfully' });
    } catch (dbError) {
      await db.query('ROLLBACK');
      throw dbError;
    }
  } catch (error) {
    console.error('Approve bid error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Reject bid
router.post('/admin/bids/:bidId/reject', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { bidId } = req.params;

    // Get bid details before rejecting (include bidder name)
    const bidResult = await db.query(
      `SELECT b.*, a.title as auction_title, a.current_bid, a.starting_bid, u.full_name as bidder_name
       FROM bids b 
       JOIN auctions a ON b.auction_id = a.id 
       JOIN users u ON b.bidder_id = u.id
       WHERE b.id = $1 AND b.status = $2`,
      [bidId, 'pending']
    );

    if (bidResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pending bid not found' });
    }

    const bid = bidResult.rows[0];
    const currentHighest = bid.current_bid || bid.starting_bid;

    await db.query('BEGIN');
    
    try {
      // Update bid status to rejected
      await db.query(
        'UPDATE bids SET status = $1 WHERE id = $2',
        ['rejected', bidId]
      );

      // Find the highest approved bid for this auction
      const highestApprovedResult = await db.query(
        `SELECT MAX(amount) as highest_approved 
         FROM bids 
         WHERE auction_id = $1 AND status = 'approved'`,
        [bid.auction_id]
      );

      const highestApproved = highestApprovedResult.rows[0].highest_approved;
      
      // Update auction current_bid to the highest approved bid (or starting_bid if no approved bids)
      const newCurrentBid = highestApproved || bid.starting_bid;
      await db.query(
        'UPDATE auctions SET current_bid = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [newCurrentBid, bid.auction_id]
      );

      // Send notification to bidder
      await db.query(
        `INSERT INTO notifications (user_id, type, title, message, related_auction_id, is_read)
         VALUES ($1, $2, $3, $4, $5, false)`,
        [
          bid.bidder_id,
          'bid_rejected',
          'Bid Rejected',
            `Your bid of $${parseFloat(bid.amount).toFixed(2)} for "${bid.auction_title}" was rejected. The current highest bid is $${parseFloat(newCurrentBid).toFixed(2)}. You can place a higher bid to compete.`,
          bid.auction_id
        ]
      );

      await db.query('COMMIT');

      // Emit real-time event
      try {
        const io = req.app.get('io');
        if (io) {
          io.emit('bid-rejected', {
            bidId,
            auctionId: bid.auction_id,
            amount: bid.amount,
            bidderId: bid.bidder_id,
            bidderName: bid.bidder_name,
            timestamp: new Date().toISOString()
          });
        }
      } catch (emitErr) { console.error('Emit bid-rejected failed:', emitErr); }

      res.json({ message: 'Bid rejected successfully' });
    } catch (dbError) {
      await db.query('ROLLBACK');
      throw dbError;
    }
  } catch (error) {
    console.error('Reject bid error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete auction (only by owner)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const force = (req.query.force === 'true');

    console.log('[DELETE /api/auctions/%s] user=%s force=%s', id, userId, force);

    // Check if auction exists and belongs to user
    const auctionResult = await db.query(
      'SELECT id, seller_id, title FROM auctions WHERE id = $1 AND seller_id = $2',
      [id, userId]
    );

    if (auctionResult.rows.length === 0) {
      console.log('  -> Not found or not owner');
      return res.status(404).json({ error: 'Auction not found or not owned by you' });
    }

    // Count bids by status
    const bidCountsResult = await db.query(
      `SELECT 
         COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
         COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
         COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count
       FROM bids WHERE auction_id = $1`, [id]
    );

    const { approved_count, pending_count, rejected_count } = bidCountsResult.rows[0];
    console.log('  -> Bid counts:', bidCountsResult.rows[0]);

    if (parseInt(approved_count) > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete auction with approved bids',
        details: bidCountsResult.rows[0]
      });
    }

    if (!force && parseInt(pending_count) > 0) {
      return res.status(400).json({ 
        error: 'Auction has pending bids. Add ?force=true to delete anyway (pending & rejected bids will be removed).',
        details: bidCountsResult.rows[0]
      });
    }

    await db.query('BEGIN');
    try {
      // Remove (pending/rejected) bids if any and no approved bids
      if (parseInt(pending_count) > 0 || parseInt(rejected_count) > 0) {
        await db.query('DELETE FROM bids WHERE auction_id = $1 AND status != $2', [id, 'approved']);
      }
      // Delete related comments / notifications (ignore if tables absent)
      try { await db.query('DELETE FROM auction_comments WHERE auction_id = $1', [id]); } catch (e) { /* ignore */ }
      try { await db.query('DELETE FROM notifications WHERE related_auction_id = $1', [id]); } catch (e) { /* ignore */ }

      // Delete the auction
      await db.query('DELETE FROM auctions WHERE id = $1', [id]);
      await db.query('COMMIT');
      console.log('  -> Auction %s deleted', id);
    } catch (inner) {
      await db.query('ROLLBACK');
      if (inner.code === '23503') { // FK violation
        console.error('  -> FK constraint prevents deletion:', inner.detail);
        return res.status(400).json({ error: 'Cannot delete auction due to related records (foreign key constraint).', detail: inner.detail });
      }
      throw inner;
    }

    // Emit real-time deletion event (optional for clients to update UI)
    const io = req.app.get('io');
    if (io) {
      io.emit('auction-deleted', { 
        auctionId: id,
        sellerId: auctionResult.rows[0].seller_id,
        title: auctionResult.rows[0].title,
        timestamp: new Date().toISOString()
      });
    }

    res.json({ message: 'Auction deleted successfully', auctionId: id });
  } catch (error) {
    console.error('Delete auction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

