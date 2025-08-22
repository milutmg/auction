const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const userResult = await db.query(`
      SELECT 
        u.id,
        u.email,
        u.full_name,
        u.role,
        u.created_at,
        up.bio,
        up.location,
        up.phone,
        up.avatar_url,
        up.website,
        up.social_links,
        up.verification_status,
        up.rating,
        up.total_ratings,
        up.seller_level,
        uprefs.notification_email,
        uprefs.notification_sms,
        uprefs.notification_push,
        uprefs.newsletter_subscription,
        uprefs.preferred_currency,
        uprefs.timezone,
        uprefs.language
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      LEFT JOIN user_preferences uprefs ON u.id = uprefs.user_id
      WHERE u.id = $1
    `, [userId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Get user statistics
    const statsResult = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM auctions WHERE seller_id = $1) as total_auctions,
        (SELECT COUNT(*) FROM auctions WHERE seller_id = $1 AND status = 'active') as active_auctions,
        (SELECT COUNT(*) FROM auctions WHERE seller_id = $1 AND status = 'ended') as completed_auctions,
        (SELECT COUNT(*) FROM bids WHERE bidder_id = $1) as total_bids,
        (SELECT COUNT(*) FROM user_watchlist WHERE user_id = $1) as watchlist_count,
        (SELECT COUNT(*) FROM orders WHERE buyer_id = $1) as total_purchases,
        (SELECT COUNT(*) FROM orders WHERE seller_id = $1) as total_sales,
        (SELECT AVG(rating) FROM user_ratings WHERE reviewed_user_id = $1) as avg_rating,
        (SELECT COUNT(*) FROM user_ratings WHERE reviewed_user_id = $1) as rating_count
    `, [userId]);

    const stats = statsResult.rows[0];

    res.json({
      user,
      stats
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      full_name,
      bio,
      location,
      phone,
      website,
      social_links,
      notification_email,
      notification_sms,
      notification_push,
      newsletter_subscription,
      preferred_currency,
      timezone,
      language
    } = req.body;

    // Update user basic info
    await db.query(`
      UPDATE users 
      SET full_name = $1, updated_at = NOW()
      WHERE id = $2
    `, [full_name, userId]);

    // Update or insert user profile
    await db.query(`
      INSERT INTO user_profiles (user_id, bio, location, phone, website, social_links, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        bio = EXCLUDED.bio,
        location = EXCLUDED.location,
        phone = EXCLUDED.phone,
        website = EXCLUDED.website,
        social_links = EXCLUDED.social_links,
        updated_at = EXCLUDED.updated_at
    `, [userId, bio, location, phone, website, JSON.stringify(social_links || {})]);

    // Update or insert user preferences
    await db.query(`
      INSERT INTO user_preferences (
        user_id, notification_email, notification_sms, notification_push, 
        newsletter_subscription, preferred_currency, timezone, language, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        notification_email = EXCLUDED.notification_email,
        notification_sms = EXCLUDED.notification_sms,
        notification_push = EXCLUDED.notification_push,
        newsletter_subscription = EXCLUDED.newsletter_subscription,
        preferred_currency = EXCLUDED.preferred_currency,
        timezone = EXCLUDED.timezone,
        language = EXCLUDED.language,
        updated_at = EXCLUDED.updated_at
    `, [
      userId, 
      notification_email !== undefined ? notification_email : true,
      notification_sms !== undefined ? notification_sms : false,
      notification_push !== undefined ? notification_push : true,
      newsletter_subscription !== undefined ? newsletter_subscription : true,
      preferred_currency || 'USD',
      timezone || 'UTC',
      language || 'en'
    ]);

    res.json({ message: 'Profile updated successfully' });

  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload avatar
router.post('/avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    const userId = req.user.id;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const avatarUrl = `/uploads/${req.file.filename}`;

    // Update user profile with avatar URL
    await db.query(`
      INSERT INTO user_profiles (user_id, avatar_url, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        avatar_url = EXCLUDED.avatar_url,
        updated_at = EXCLUDED.updated_at
    `, [userId, avatarUrl]);

    res.json({
      message: 'Avatar uploaded successfully',
      avatar_url: avatarUrl
    });

  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user watchlist
router.get('/watchlist', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(`
      SELECT 
        w.id as watchlist_id,
        w.auction_id,
        w.note,
        w.created_at as added_at,
        a.title,
        a.description,
        a.image_url,
        a.starting_bid,
        a.current_bid,
        a.end_time,
        a.status,
        a.seller_id,
        c.name as category_name,
        u.full_name as seller_name,
        (SELECT COUNT(*) FROM bids WHERE auction_id = a.id) as bid_count
      FROM user_watchlist w
      INNER JOIN auctions a ON w.auction_id = a.id
      INNER JOIN categories c ON a.category_id = c.id
      INNER JOIN users u ON a.seller_id = u.id
      WHERE w.user_id = $1
      ORDER BY w.created_at DESC
    `, [userId]);

    res.json({ watchlist: result.rows });

  } catch (error) {
    console.error('Get watchlist error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add item to watchlist
router.post('/watchlist', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { auction_id, note } = req.body;

    if (!auction_id) {
      return res.status(400).json({ error: 'Auction ID is required' });
    }

    // Check if auction exists
    const auctionResult = await db.query('SELECT id FROM auctions WHERE id = $1', [auction_id]);
    if (auctionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Auction not found' });
    }

    // Add to watchlist
    await db.query(`
      INSERT INTO user_watchlist (user_id, auction_id, note)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, auction_id) DO UPDATE SET
        note = EXCLUDED.note
    `, [userId, auction_id, note || null]);

    res.status(201).json({ message: 'Added to watchlist successfully' });

  } catch (error) {
    console.error('Add to watchlist error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove item from watchlist
router.delete('/watchlist/:auction_id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { auction_id } = req.params;

    await db.query(`
      DELETE FROM user_watchlist 
      WHERE user_id = $1 AND auction_id = $2
    `, [userId, auction_id]);

    res.json({ message: 'Removed from watchlist successfully' });

  } catch (error) {
    console.error('Remove from watchlist error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's auctions
router.get('/auctions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status = 'all', page = 1, limit = 10 } = req.query;

    let query = `
      SELECT 
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
        c.name as category_name,
        (SELECT COUNT(*) FROM bids WHERE auction_id = a.id) as bid_count,
        (SELECT COUNT(*) FROM user_watchlist WHERE auction_id = a.id) as watchers_count
      FROM auctions a
      INNER JOIN categories c ON a.category_id = c.id
      WHERE a.seller_id = $1
    `;

    const params = [userId];

    if (status !== 'all') {
      params.push(status);
      query += ` AND a.status = $${params.length}`;
    }

    query += ` ORDER BY a.created_at DESC`;

    // Add pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    params.push(parseInt(limit), offset);
    query += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const result = await db.query(query, params);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) 
      FROM auctions 
      WHERE seller_id = $1
    `;
    const countParams = [userId];
    
    if (status !== 'all') {
      countParams.push(status);
      countQuery += ` AND status = $${countParams.length}`;
    }

    const countResult = await db.query(countQuery, countParams);
    const totalItems = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalItems / parseInt(limit));

    res.json({
      auctions: result.rows,
      pagination: {
        current_page: parseInt(page),
        total_pages: totalPages,
        total_items: totalItems,
        items_per_page: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get user auctions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's bids
router.get('/bids', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const query = `
      SELECT 
        b.id as bid_id,
        b.amount,
        b.created_at as bid_time,
        b.status as bid_status,
        a.id as auction_id,
        a.title,
        a.description,
        a.image_url,
        a.current_bid,
        a.end_time,
        a.status as auction_status,
        c.name as category_name,
        u.full_name as seller_name,
        (SELECT MAX(amount) FROM bids WHERE auction_id = a.id) as highest_bid,
        (SELECT COUNT(*) FROM bids WHERE auction_id = a.id) as total_bids,
        CASE 
          WHEN b.amount = (SELECT MAX(amount) FROM bids WHERE auction_id = a.id) THEN true 
          ELSE false 
        END as is_highest_bid
      FROM bids b
      INNER JOIN auctions a ON b.auction_id = a.id
      INNER JOIN categories c ON a.category_id = c.id
      INNER JOIN users u ON a.seller_id = u.id
      WHERE b.bidder_id = $1
      ORDER BY b.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const result = await db.query(query, [userId, parseInt(limit), offset]);

    // Get total count
    const countResult = await db.query(`
      SELECT COUNT(*) 
      FROM bids 
      WHERE bidder_id = $1
    `, [userId]);

    const totalItems = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalItems / parseInt(limit));

    res.json({
      bids: result.rows,
      pagination: {
        current_page: parseInt(page),
        total_pages: totalPages,
        total_items: totalItems,
        items_per_page: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get user bids error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's orders
router.get('/orders', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type = 'all', page = 1, limit = 10 } = req.query; // type: all, purchases, sales

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    // Attempt advanced schema first (buyer_id / seller_id / winning_bid_amount, order_status, payment_status)
    let advancedQuery = `
      SELECT 
        o.id as order_id,
        o.winning_bid_amount,
        o.payment_status,
        o.payment_method,
        o.order_status,
        o.tracking_number,
        o.estimated_delivery,
        o.delivered_at,
        o.created_at,
        a.id as auction_id,
        a.title,
        a.description,
        a.image_url,
        c.name as category_name,
        buyer.full_name as buyer_name,
        seller.full_name as seller_name,
        CASE 
          WHEN o.buyer_id = $1 THEN 'purchase'
          WHEN o.seller_id = $1 THEN 'sale'
        END as order_type
      FROM orders o
      INNER JOIN auctions a ON o.auction_id = a.id
      INNER JOIN categories c ON a.category_id = c.id
      INNER JOIN users buyer ON o.buyer_id = buyer.id
      INNER JOIN users seller ON o.seller_id = seller.id
      WHERE (o.buyer_id = $1 OR o.seller_id = $1)
    `;

    const advancedParams = [userId];
    if (type === 'purchases') {
      advancedQuery += ' AND o.buyer_id = $1';
    } else if (type === 'sales') {
      advancedQuery += ' AND o.seller_id = $1';
    }
    advancedQuery += ' ORDER BY o.created_at DESC LIMIT $2 OFFSET $3';
    advancedParams.push(limitNum, offset);

    let result;
    let totalItems;

    try {
      result = await db.query(advancedQuery, advancedParams);
      // Count for advanced schema
      let countQuery = `SELECT COUNT(*) FROM orders o WHERE (o.buyer_id = $1 OR o.seller_id = $1)`;
      const countParams = [userId];
      if (type === 'purchases') {
        countQuery += ' AND o.buyer_id = $1';
      } else if (type === 'sales') {
        countQuery += ' AND o.seller_id = $1';
      }
      const countResult = await db.query(countQuery, countParams);
      totalItems = parseInt(countResult.rows[0].count);
    } catch (err) {
      // If undefined column error (42703) fallback to basic schema variant
      if (err.code !== '42703') {
        throw err; // Different error, rethrow
      }

      // Basic schema: winner_id, final_amount, status (no buyer_id/seller_id/order_status/payment_status)
      let basicQuery = `
        SELECT 
          o.id as order_id,
          o.final_amount as winning_bid_amount,
          -- Map legacy status to payment_status / order_status semantics
          CASE WHEN o.status IN ('paid') THEN 'paid' ELSE 'pending' END as payment_status,
          o.payment_method,
            o.status as order_status,
          o.tracking_number,
          NULL::timestamp as estimated_delivery,
          NULL::timestamp as delivered_at,
          o.created_at,
          a.id as auction_id,
          a.title,
          a.description,
          a.image_url,
          c.name as category_name,
          winner.full_name as buyer_name,
          seller.full_name as seller_name,
          CASE 
            WHEN o.winner_id = $1 THEN 'purchase'
            WHEN a.seller_id = $1 THEN 'sale'
          END as order_type
        FROM orders o
        INNER JOIN auctions a ON o.auction_id = a.id
        INNER JOIN categories c ON a.category_id = c.id
        INNER JOIN users winner ON o.winner_id = winner.id
        INNER JOIN users seller ON a.seller_id = seller.id
        WHERE (o.winner_id = $1 OR a.seller_id = $1)
      `;
      const basicParams = [userId];
      if (type === 'purchases') {
        basicQuery += ' AND o.winner_id = $1';
      } else if (type === 'sales') {
        basicQuery += ' AND a.seller_id = $1';
      }
      basicQuery += ' ORDER BY o.created_at DESC LIMIT $2 OFFSET $3';
      basicParams.push(limitNum, offset);
      result = await db.query(basicQuery, basicParams);

      // Count for basic schema
      let countQuery = `SELECT COUNT(*) FROM orders o INNER JOIN auctions a ON o.auction_id = a.id WHERE (o.winner_id = $1 OR a.seller_id = $1)`;
      const countParams = [userId];
      if (type === 'purchases') {
        countQuery += ' AND o.winner_id = $1';
      } else if (type === 'sales') {
        countQuery += ' AND a.seller_id = $1';
      }
      const countResult = await db.query(countQuery, countParams);
      totalItems = parseInt(countResult.rows[0].count);
    }

    const totalPages = Math.ceil(totalItems / limitNum);

    return res.json({
      orders: result.rows,
      pagination: {
        current_page: pageNum,
        total_pages: totalPages,
        total_items: totalItems,
        items_per_page: limitNum
      }
    });
  } catch (error) {
    console.error('Get user orders error (unhandled):', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change password
router.put('/password', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    // Get current password hash
    const userResult = await db.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const validPassword = await bcrypt.compare(current_password, userResult.rows[0].password_hash);
    
    if (!validPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(new_password, saltRounds);

    // Update password
    await db.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [newPasswordHash, userId]);

    res.json({ message: 'Password updated successfully' });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
