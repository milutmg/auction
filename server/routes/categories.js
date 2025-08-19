const express = require('express');
const db = require('../config/database');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Get all categories with auction counts and featured status
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        c.id,
        c.name,
        c.description,
        c.created_at,
        COUNT(a.id) as auction_count,
        COUNT(CASE WHEN a.status = 'active' THEN 1 END) as active_auction_count,
        COUNT(CASE WHEN a.status = 'pending' THEN 1 END) as pending_auction_count,
        COALESCE(AVG(CASE WHEN a.status = 'active' THEN COALESCE(a.current_bid, a.starting_bid) END), 0) as avg_price,
        COALESCE(MIN(CASE WHEN a.status = 'active' THEN COALESCE(a.current_bid, a.starting_bid) END), 0) as min_price,
        COALESCE(MAX(CASE WHEN a.status = 'active' THEN COALESCE(a.current_bid, a.starting_bid) END), 0) as max_price
      FROM categories c
      LEFT JOIN auctions a ON c.id = a.category_id
      GROUP BY c.id, c.name, c.description, c.created_at
      ORDER BY auction_count DESC, c.name ASC
    `);

    // Add featured status based on auction count
    const categories = result.rows.map(category => ({
      ...category,
      featured: parseInt(category.auction_count) >= 3, // Categories with 3+ auctions are featured
      avg_price: parseFloat(category.avg_price).toFixed(2),
      min_price: parseFloat(category.min_price).toFixed(2),
      max_price: parseFloat(category.max_price).toFixed(2)
    }));

    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get category details with auctions
router.get('/:categoryId', optionalAuth, async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { 
      status, 
      search, 
      sort = 'created_at', 
      order = 'DESC', 
      page = 1, 
      limit = 12,
      min_price,
      max_price 
    } = req.query;

    // Get category details
    let category;
    const categoryResult = await db.query(
      'SELECT id, name, description FROM categories WHERE name = $1',
      [categoryId]
    );

    if (categoryResult.rows.length === 0) {
      // Try by ID if not found by name
      const categoryByIdResult = await db.query(
        'SELECT id, name, description FROM categories WHERE id = $1',
        [categoryId]
      );
      
      if (categoryByIdResult.rows.length === 0) {
        return res.status(404).json({ error: 'Category not found' });
      }
      
      category = categoryByIdResult.rows[0];
    } else {
      category = categoryResult.rows[0];
    }

    // Build auctions query
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
      (SELECT COUNT(*) FROM bids WHERE auction_id = auctions.id) as bid_count
      FROM auctions 
      INNER JOIN categories ON auctions.category_id = categories.id
      INNER JOIN users ON auctions.seller_id = users.id
      WHERE categories.id = $1`;

    const params = [category.id];

    // Approval visibility rules (updated to require active status for approved auctions)
    if (!req.user) {
      // Public: only approved & active
      query += ` AND auctions.approval_status = 'approved' AND auctions.status = 'active'`;
    } else if (req.user.role !== 'admin') {
      // Authenticated non-admin: approved & active OR (own pending)
      params.push(req.user.id);
      query += ` AND ((auctions.approval_status = 'approved' AND auctions.status = 'active') OR (auctions.seller_id = $${params.length} AND auctions.approval_status = 'pending'))`;
    }
    // Admin sees all

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

    const auctionsResult = await db.query(query, params);

    // Get total count for pagination (mirror visibility rules)
    let countQuery = `SELECT COUNT(*) as total FROM auctions 
      INNER JOIN categories ON auctions.category_id = categories.id
      WHERE categories.id = $1`;
    const countParams = [category.id];

    if (!req.user) {
      countQuery += ` AND auctions.approval_status = 'approved' AND auctions.status = 'active'`;
    } else if (req.user.role !== 'admin') {
      countParams.push(req.user.id);
      countQuery += ` AND ((auctions.approval_status = 'approved' AND auctions.status = 'active') OR (auctions.seller_id = $${countParams.length} AND auctions.approval_status = 'pending'))`;
    }

    let paramIndex = countParams.length; // current highest index

    // Status filter
    if (status) {
      countParams.push(status);
      countQuery += ` AND auctions.status = $${++paramIndex}`;
    }

    // Search filter
    if (search) {
      countParams.push(`%${search}%`);
      countQuery += ` AND (auctions.title ILIKE $${++paramIndex} OR auctions.description ILIKE $${paramIndex})`;
    }

    // Price range filters
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

    // Category statistics (mirror visibility rules)
    let statsQuery = `
      SELECT 
        COUNT(*) as total_auctions,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_auctions,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_auctions,
        COUNT(CASE WHEN status = 'ended' THEN 1 END) as ended_auctions,
        COALESCE(AVG(CASE WHEN status = 'active' THEN COALESCE(current_bid, starting_bid) END), 0) as avg_price,
        COALESCE(MIN(CASE WHEN status = 'active' THEN COALESCE(current_bid, starting_bid) END), 0) as min_price,
        COALESCE(MAX(CASE WHEN status = 'active' THEN COALESCE(current_bid, starting_bid) END), 0) as max_price
      FROM auctions 
      WHERE category_id = $1`;
    const statsParams = [category.id];
    if (!req.user) {
      statsQuery += ` AND approval_status = 'approved' AND status = 'active'`;
    } else if (req.user.role !== 'admin') {
      statsParams.push(req.user.id);
      statsQuery += ` AND ((approval_status = 'approved' AND status = 'active') OR (seller_id = $${statsParams.length} AND approval_status = 'pending'))`;
    }

    const statsResult = await db.query(statsQuery, statsParams);

    // Defensive sanitization (should normally be a no-op)
    let visibleAuctions = auctionsResult.rows;
    if (!req.user) {
      const before = visibleAuctions.length;
      visibleAuctions = visibleAuctions.filter(a => a.approval_status === 'approved' && a.status === 'active');
      if (visibleAuctions.length !== before) {
        console.warn('[CATEGORIES] Sanitization removed %d rows (public) category=%s', before - visibleAuctions.length, category.id);
      }
    } else if (req.user.role !== 'admin') {
      const before = visibleAuctions.length;
      visibleAuctions = visibleAuctions.filter(a => (a.approval_status === 'approved' && a.status === 'active') || (a.approval_status === 'pending' && a.seller_id === req.user.id));
      if (visibleAuctions.length !== before) {
        console.warn('[CATEGORIES] Sanitization removed %d rows user=%s category=%s', before - visibleAuctions.length, req.user.id, category.id);
      }
    }

    if (visibleAuctions.length < auctionsResult.rows.length) {
      console.warn('[CATEGORIES] Post-filter mismatch: sqlReturned=%d afterSanitize=%d user=%s role=%s category=%s', auctionsResult.rows.length, visibleAuctions.length, req.user?.id || 'public', req.user?.role || 'public', category.id);
    }

    const stats = {
      ...statsResult.rows[0],
      avg_price: parseFloat(statsResult.rows[0].avg_price).toFixed(2),
      min_price: parseFloat(statsResult.rows[0].min_price).toFixed(2),
      max_price: parseFloat(statsResult.rows[0].max_price).toFixed(2)
    };

    return res.json({
      category,
      auctions: visibleAuctions,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / parseInt(limit)),
        total_items: total,
        items_per_page: parseInt(limit)
      },
      stats,
      filters: {
        status,
        search,
        min_price,
        max_price,
        sort: sortField,
        order: sortOrder
      }
    });
  } catch (error) {
    console.error('Get category details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get category statistics only
router.get('/:categoryId/stats', async (req, res) => {
  try {
    const { categoryId } = req.params;

    const result = await db.query(`
      SELECT 
        c.name as category_name,
        COUNT(a.id) as total_auctions,
        COUNT(CASE WHEN a.status = 'active' THEN 1 END) as active_auctions,
        COUNT(CASE WHEN a.status = 'pending' THEN 1 END) as pending_auctions,
        COUNT(CASE WHEN a.status = 'ended' THEN 1 END) as ended_auctions,
        COALESCE(AVG(CASE WHEN a.status = 'active' THEN COALESCE(a.current_bid, a.starting_bid) END), 0) as avg_price,
        COALESCE(MIN(CASE WHEN a.status = 'active' THEN COALESCE(a.current_bid, a.starting_bid) END), 0) as min_price,
        COALESCE(MAX(CASE WHEN a.status = 'active' THEN COALESCE(a.current_bid, a.starting_bid) END), 0) as max_price,
        COALESCE(SUM(CASE WHEN a.status = 'active' THEN COALESCE(a.current_bid, a.starting_bid) END), 0) as total_value
      FROM categories c
      LEFT JOIN auctions a ON c.id = a.category_id
      WHERE c.name = $1
      GROUP BY c.id, c.name
    `, [categoryId]);

    if (result.rows.length === 0) {
      // Try by ID if not found by name
      const resultById = await db.query(`
        SELECT 
          c.name as category_name,
          COUNT(a.id) as total_auctions,
          COUNT(CASE WHEN a.status = 'active' THEN 1 END) as active_auctions,
          COUNT(CASE WHEN a.status = 'pending' THEN 1 END) as pending_auctions,
          COUNT(CASE WHEN a.status = 'ended' THEN 1 END) as ended_auctions,
          COALESCE(AVG(CASE WHEN a.status = 'active' THEN COALESCE(a.current_bid, a.starting_bid) END), 0) as avg_price,
          COALESCE(MIN(CASE WHEN a.status = 'active' THEN COALESCE(a.current_bid, a.starting_bid) END), 0) as min_price,
          COALESCE(MAX(CASE WHEN a.status = 'active' THEN COALESCE(a.current_bid, a.starting_bid) END), 0) as max_price,
          COALESCE(SUM(CASE WHEN a.status = 'active' THEN COALESCE(a.current_bid, a.starting_bid) END), 0) as total_value
        FROM categories c
        LEFT JOIN auctions a ON c.id = a.category_id
        WHERE c.id = $1
        GROUP BY c.id, c.name
      `, [categoryId]);
      
      if (resultById.rows.length === 0) {
        return res.status(404).json({ error: 'Category not found' });
      }
      
      result.rows = resultById.rows;
    }

    const stats = {
      ...result.rows[0],
      avg_price: parseFloat(result.rows[0].avg_price).toFixed(2),
      min_price: parseFloat(result.rows[0].min_price).toFixed(2),
      max_price: parseFloat(result.rows[0].max_price).toFixed(2),
      total_value: parseFloat(result.rows[0].total_value).toFixed(2)
    };

    res.json(stats);
  } catch (error) {
    console.error('Get category stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
