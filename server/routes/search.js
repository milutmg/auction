const express = require('express');
const db = require('../config/database');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Advanced search with multiple filters
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      q: searchQuery,
      category,
      condition,
      min_price,
      max_price,
      location,
      featured,
      authenticity_certificate,
      shipping_included,
      sort = 'relevance',
      order = 'DESC',
      page = 1,
      limit = 12,
      auction_type = 'active', // active, ended, upcoming
      seller_rating,
      keywords,
      materials,
      date_range, // 24h, 7d, 30d, 90d
      end_time_range // ending_soon (24h), this_week, etc.
    } = req.query;

    let query = `
      SELECT DISTINCT
        a.id,
        a.title,
        a.description,
        a.image_url,
        a.starting_bid,
        a.current_bid,
        a.end_time,
        a.status,
        a.approval_status,
        a.created_at,
        a.seller_id,
        a.condition,
        a.location,
        a.authenticity_certificate,
        a.shipping_included,
        a.featured,
        a.views_count,
        a.keywords,
        a.materials,
        c.id as category_id,
        c.name as category_name,
        u.full_name as seller_name,
        up.rating as seller_rating,
        up.seller_level,
        up.total_ratings as seller_total_ratings,
        (SELECT COUNT(*) FROM bids WHERE auction_id = a.id) as bid_count,
        (SELECT COUNT(*) FROM user_watchlist WHERE auction_id = a.id) as watchers_count,
        CASE 
          WHEN $1::text IS NOT NULL THEN 
            ts_rank(a.search_vector, plainto_tsquery('english', $1::text))
          ELSE 0
        END as search_rank
      FROM auctions a
      INNER JOIN categories c ON a.category_id = c.id
      INNER JOIN users u ON a.seller_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE 1=1
    `;

    const params = [searchQuery || null];
    let paramIndex = 1;

    // Apply access control
    if (!req.user) {
      query += ` AND a.approval_status = 'approved' AND a.status = 'active'`;
    } else if (req.user.role !== 'admin') {
      params.push(req.user.id);
      paramIndex++;
      query += ` AND ((a.approval_status = 'approved' AND a.status = 'active') OR a.seller_id = $${paramIndex})`;
    }

    // Full-text search
    if (searchQuery) {
      params.push(searchQuery);
      paramIndex++;
      query += ` AND a.search_vector @@ plainto_tsquery('english', $${paramIndex})`;
    }

    // Category filter
    if (category && category !== 'All Categories') {
      params.push(category);
      paramIndex++;
      query += ` AND c.name = $${paramIndex}`;
    }

    // Condition filter
    if (condition) {
      params.push(condition);
      paramIndex++;
      query += ` AND a.condition = $${paramIndex}`;
    }

    // Price range filters
    if (min_price) {
      params.push(parseFloat(min_price));
      paramIndex++;
      query += ` AND COALESCE(a.current_bid, a.starting_bid) >= $${paramIndex}`;
    }

    if (max_price) {
      params.push(parseFloat(max_price));
      paramIndex++;
      query += ` AND COALESCE(a.current_bid, a.starting_bid) <= $${paramIndex}`;
    }

    // Location filter
    if (location) {
      params.push(`%${location}%`);
      paramIndex++;
      query += ` AND a.location ILIKE $${paramIndex}`;
    }

    // Featured filter
    if (featured === 'true') {
      query += ` AND a.featured = true`;
    }

    // Authenticity certificate filter
    if (authenticity_certificate === 'true') {
      query += ` AND a.authenticity_certificate = true`;
    }

    // Shipping included filter
    if (shipping_included === 'true') {
      query += ` AND a.shipping_included = true`;
    }

    // Auction type filter
    if (auction_type === 'active') {
      query += ` AND a.status = 'active' AND a.end_time > NOW()`;
    } else if (auction_type === 'ended') {
      query += ` AND a.status = 'ended'`;
    } else if (auction_type === 'ending_soon') {
      query += ` AND a.status = 'active' AND a.end_time BETWEEN NOW() AND NOW() + INTERVAL '24 hours'`;
    }

    // Seller rating filter
    if (seller_rating) {
      params.push(parseFloat(seller_rating));
      paramIndex++;
      query += ` AND up.rating >= $${paramIndex}`;
    }

    // Keywords filter
    if (keywords) {
      const keywordArray = keywords.split(',').map(k => k.trim());
      params.push(JSON.stringify(keywordArray));
      paramIndex++;
      query += ` AND a.keywords ?| $${paramIndex}`;
    }

    // Materials filter
    if (materials) {
      const materialArray = materials.split(',').map(m => m.trim());
      params.push(JSON.stringify(materialArray));
      paramIndex++;
      query += ` AND a.materials ?| $${paramIndex}`;
    }

    // Date range filter
    if (date_range) {
      let interval;
      switch (date_range) {
        case '24h':
          interval = '24 hours';
          break;
        case '7d':
          interval = '7 days';
          break;
        case '30d':
          interval = '30 days';
          break;
        case '90d':
          interval = '90 days';
          break;
        default:
          interval = null;
      }
      
      if (interval) {
        query += ` AND a.created_at >= NOW() - INTERVAL '${interval}'`;
      }
    }

    // End time range filter
    if (end_time_range) {
      let endInterval;
      switch (end_time_range) {
        case 'ending_soon':
          query += ` AND a.end_time BETWEEN NOW() AND NOW() + INTERVAL '24 hours'`;
          break;
        case 'this_week':
          query += ` AND a.end_time BETWEEN NOW() AND NOW() + INTERVAL '7 days'`;
          break;
        case 'this_month':
          query += ` AND a.end_time BETWEEN NOW() AND NOW() + INTERVAL '30 days'`;
          break;
      }
    }

    // Sorting
    let orderBy = '';
    switch (sort) {
      case 'relevance':
        orderBy = searchQuery ? 'search_rank DESC, a.featured DESC' : 'a.featured DESC, a.created_at DESC';
        break;
      case 'price_low':
        orderBy = 'COALESCE(a.current_bid, a.starting_bid) ASC';
        break;
      case 'price_high':
        orderBy = 'COALESCE(a.current_bid, a.starting_bid) DESC';
        break;
      case 'ending_soon':
        orderBy = 'a.end_time ASC';
        break;
      case 'newest':
        orderBy = 'a.created_at DESC';
        break;
      case 'oldest':
        orderBy = 'a.created_at ASC';
        break;
      case 'most_bids':
        orderBy = 'bid_count DESC';
        break;
      case 'most_watched':
        orderBy = 'watchers_count DESC';
        break;
      case 'seller_rating':
        orderBy = 'up.rating DESC NULLS LAST';
        break;
      default:
        orderBy = 'a.created_at DESC';
    }

    query += ` ORDER BY ${orderBy}`;

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    params.push(parseInt(limit), offset);
    query += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;

    // Execute main query
    const result = await db.query(query, params);

    // Get total count for pagination
    let countQuery = query.split('ORDER BY')[0];
    countQuery = countQuery.replace(/SELECT DISTINCT.*?FROM/, 'SELECT COUNT(DISTINCT a.id) FROM');
    const countParams = params.slice(0, -2); // Remove limit and offset
    const countResult = await db.query(countQuery, countParams);

    // Calculate pagination info
    const totalItems = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalItems / parseInt(limit));
    const currentPage = parseInt(page);

    res.json({
      auctions: result.rows,
      pagination: {
        current_page: currentPage,
        total_pages: totalPages,
        total_items: totalItems,
        items_per_page: parseInt(limit),
        has_next: currentPage < totalPages,
        has_prev: currentPage > 1
      },
      filters_applied: {
        search_query: searchQuery,
        category,
        condition,
        price_range: { min: min_price, max: max_price },
        location,
        featured: featured === 'true',
        authenticity_certificate: authenticity_certificate === 'true',
        shipping_included: shipping_included === 'true',
        auction_type,
        seller_rating,
        keywords,
        materials,
        date_range,
        end_time_range
      }
    });

  } catch (error) {
    console.error('Advanced search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get search suggestions and auto-complete
router.get('/suggestions', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({ suggestions: [] });
    }

    // Get title suggestions
    const titleSuggestions = await db.query(`
      SELECT DISTINCT title
      FROM auctions
      WHERE title ILIKE $1
        AND approval_status = 'approved'
        AND status = 'active'
      ORDER BY title
      LIMIT 5
    `, [`%${q}%`]);

    // Get category suggestions
    const categorySuggestions = await db.query(`
      SELECT DISTINCT c.name
      FROM categories c
      INNER JOIN auctions a ON c.id = a.category_id
      WHERE c.name ILIKE $1
        AND a.approval_status = 'approved'
        AND a.status = 'active'
      ORDER BY c.name
      LIMIT 5
    `, [`%${q}%`]);

    // Get location suggestions
    const locationSuggestions = await db.query(`
      SELECT DISTINCT location
      FROM auctions
      WHERE location ILIKE $1
        AND location IS NOT NULL
        AND approval_status = 'approved'
        AND status = 'active'
      ORDER BY location
      LIMIT 5
    `, [`%${q}%`]);

    const suggestions = [
      ...titleSuggestions.rows.map(row => ({ type: 'title', value: row.title })),
      ...categorySuggestions.rows.map(row => ({ type: 'category', value: row.name })),
      ...locationSuggestions.rows.map(row => ({ type: 'location', value: row.location }))
    ];

    res.json({ suggestions });

  } catch (error) {
    console.error('Search suggestions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get popular search terms and trending
router.get('/trending', async (req, res) => {
  try {
    // Get trending categories based on auction count and recent activity
    const trendingCategories = await db.query(`
      SELECT 
        c.name,
        COUNT(a.id) as auction_count,
        COUNT(CASE WHEN a.created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as recent_auctions,
        AVG(COALESCE(a.current_bid, a.starting_bid)) as avg_price
      FROM categories c
      INNER JOIN auctions a ON c.id = a.category_id
      WHERE a.approval_status = 'approved'
        AND a.status = 'active'
      GROUP BY c.id, c.name
      HAVING COUNT(a.id) > 0
      ORDER BY recent_auctions DESC, auction_count DESC
      LIMIT 10
    `);

    // Get trending keywords from recent auctions
    const trendingKeywords = await db.query(`
      SELECT 
        keyword,
        COUNT(*) as frequency
      FROM (
        SELECT jsonb_array_elements_text(keywords) as keyword
        FROM auctions
        WHERE approval_status = 'approved'
          AND status = 'active'
          AND created_at >= NOW() - INTERVAL '30 days'
          AND keywords IS NOT NULL
      ) t
      GROUP BY keyword
      ORDER BY frequency DESC
      LIMIT 20
    `);

    // Get trending locations
    const trendingLocations = await db.query(`
      SELECT 
        location,
        COUNT(*) as auction_count
      FROM auctions
      WHERE approval_status = 'approved'
        AND status = 'active'
        AND location IS NOT NULL
        AND location != ''
      GROUP BY location
      ORDER BY auction_count DESC
      LIMIT 10
    `);

    res.json({
      trending_categories: trendingCategories.rows,
      trending_keywords: trendingKeywords.rows,
      trending_locations: trendingLocations.rows
    });

  } catch (error) {
    console.error('Trending search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Save search query for user
router.post('/save', async (req, res) => {
  try {
    const { name, search_criteria, email_alerts = false } = req.body;
    const user_id = req.user?.id;

    if (!user_id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!name || !search_criteria) {
      return res.status(400).json({ error: 'Name and search criteria are required' });
    }

    const result = await db.query(`
      INSERT INTO saved_searches (user_id, name, search_criteria, email_alerts)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [user_id, name, JSON.stringify(search_criteria), email_alerts]);

    res.status(201).json({
      message: 'Search saved successfully',
      saved_search: result.rows[0]
    });

  } catch (error) {
    console.error('Save search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's saved searches
router.get('/saved', async (req, res) => {
  try {
    const user_id = req.user?.id;

    if (!user_id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const result = await db.query(`
      SELECT *
      FROM saved_searches
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, [user_id]);

    res.json({ saved_searches: result.rows });

  } catch (error) {
    console.error('Get saved searches error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
