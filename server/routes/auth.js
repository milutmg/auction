const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../middleware/upload');
const passport = require('../config/passport');
const { 
  validateSignupData, 
  validateLoginData, 
  createRateLimiter,
  isValidUserAgent,
  getPasswordStrength 
} = require('../utils/validation');

const router = express.Router();

// Health check route
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Auth Service',
    timestamp: new Date().toISOString()
  });
});

// Route aliases for common naming conventions - Direct implementation instead of redirect
router.post('/login', async (req, res) => {
  // Add CORS headers
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const result = await db.query(
      'SELECT id, email, password_hash, full_name, avatar_url, role FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/register', (req, res) => {
  res.redirect(307, '/api/auth/signup');
});

// Rate limiters
const signupLimiter = createRateLimiter(15 * 60 * 1000, 3); // 3 attempts per 15 minutes
const loginLimiter = createRateLimiter(15 * 60 * 1000, 5); // 5 attempts per 15 minutes

// Register new user
router.post('/signup', async (req, res) => {
  // Add CORS headers
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  try {
    const { email, password, fullName } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    // Rate limiting check
    const rateLimitResult = signupLimiter(clientIP);
    if (!rateLimitResult.allowed) {
      return res.status(429).json({ 
        error: 'Too many signup attempts. Please try again later.',
        retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
      });
    }

    // Basic user agent validation (optional security check) - DISABLED for development
    // if (!isValidUserAgent(userAgent)) {
    //   return res.status(400).json({ error: 'Invalid request' });
    // }

    // Comprehensive validation
    const validation = validateSignupData({ email, password, fullName });
    if (!validation.isValid) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validation.errors 
      });
    }

    const { sanitized } = validation;

    // Check if user already exists
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1', 
      [sanitized.email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    // Hash password with high salt rounds
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(sanitized.password, saltRounds);

    // Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');

    // Begin transaction
    await db.query('BEGIN');

    try {
      // Create user with basic data (only columns that exist)
      const userResult = await db.query(
        `INSERT INTO users (
          email, password_hash, full_name, is_verified
        ) VALUES ($1, $2, $3, $4) 
        RETURNING id, email, full_name, is_verified, created_at`,
        [
          sanitized.email, 
          passwordHash, 
          sanitized.fullName,
          true // Auto-verify for now
        ]
      );

      const user = userResult.rows[0];

      // Skip user_preferences and activity logging for now (tables might not exist)

      await db.query('COMMIT');

      // Return success response WITHOUT token (don't auto-login)
      res.status(201).json({
        success: true,
        message: 'Account created successfully! Please sign in with your credentials.',
        user: {
          email: user.email,
          full_name: user.full_name
        },
        // Instruct frontend to redirect to sign-in
        redirect: 'signin',
        nextSteps: [
          'Please sign in with your email and password',
          'Complete your profile after signing in',
          'Browse available auctions'
        ]
      });

    } catch (dbError) {
      await db.query('ROLLBACK');
      throw dbError;
    }

  } catch (error) {
    console.error('Signup error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
      body: req.body
    });
    
    // Handle specific database constraint errors
    if (error.code === '23505') { // Unique constraint violation
      return res.status(409).json({ 
        error: 'An account with this email already exists' 
      });
    }
    
    if (error.code === '23514') { // Check constraint violation
      return res.status(400).json({ 
        error: 'Invalid data provided. Please check your input.' 
      });
    }

    res.status(500).json({ 
      error: 'Unable to create account. Please try again later.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Login user
router.post('/signin', async (req, res) => {
  // Add CORS headers
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const result = await db.query(
      'SELECT id, email, password_hash, full_name, avatar_url, role FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    res.json({
      user: req.user
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    const { full_name } = req.body;
    const userId = req.user.id;

    // Handle uploaded avatar or provided avatar URL
    let avatar_url = req.body.avatar_url;
    if (req.file) {
      avatar_url = `/uploads/${req.file.filename}`;
    }

    const result = await db.query(
      'UPDATE users SET full_name = $1, avatar_url = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING id, email, full_name, avatar_url',
      [full_name, avatar_url, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's auctions
router.get('/my-auctions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    let query = `SELECT 
      auctions.id, title, description, image_url, starting_bid, current_bid, end_time, status, approval_status,
      categories.name as category_name,
      (SELECT COUNT(*) FROM bids WHERE auction_id = auctions.id) as bid_count
      FROM auctions 
      INNER JOIN categories ON auctions.category_id = categories.id
      WHERE auctions.seller_id = $1`;

    const params = [userId];
    if (status) {
      params.push(status);
      query += ` AND auctions.status = $${params.length}`;
    }

    query += ' ORDER BY auctions.created_at DESC';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get user auctions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's bids
router.get('/my-bids', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `SELECT 
        bids.id, bids.amount, bids.created_at,
        auctions.id as auction_id, auctions.title, auctions.image_url, 
        auctions.current_bid, auctions.status,
        categories.name as category_name
      FROM bids 
      INNER JOIN auctions ON bids.auction_id = auctions.id
      INNER JOIN categories ON auctions.category_id = categories.id
      WHERE bids.bidder_id = $1
      ORDER BY bids.created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get user bids error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change password
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    // Get user's current password hash
    const userResult = await db.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await db.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, userId]
    );

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Google OAuth routes
// Check if we're in development mode with mock credentials
const isDevelopmentMode = process.env.NODE_ENV === 'development' && 
  process.env.GOOGLE_CLIENT_ID.includes('abcdefghijklmnop');

// Development mock Google OAuth
if (isDevelopmentMode) {
  router.get('/google', (req, res) => {
    // Mock Google OAuth flow for development
    const mockUser = {
      id: 1,
      email: 'demo@example.com',
      full_name: 'Demo User',
      role: 'user',
      is_active: true,
      is_verified: true
    };
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: mockUser.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    
    // Redirect with mock data
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify(mockUser))}`);
  });
} else {
  // Real Google OAuth
  router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
  }));
}

// Google OAuth callback
router.get('/google/callback', passport.authenticate('google', {
  failureRedirect: `${process.env.FRONTEND_URL}/auth?error=oauth_failed`
}), async (req, res) => {
  try {
    // Generate JWT token for the authenticated user
    const token = jwt.sign(
      { userId: req.user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify(req.user))}`);
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/auth?error=callback_failed`);
  }
});

// Get user's orders
router.get('/my-orders', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    let query = `SELECT 
      orders.id, orders.final_amount, orders.status, orders.payment_deadline, 
      orders.payment_method, orders.created_at, orders.updated_at,
      auctions.id as auction_id, auctions.title as auction_title, 
      auctions.image_url as auction_image, auctions.description as auction_description,
      categories.name as category_name
      FROM orders 
      INNER JOIN auctions ON orders.auction_id = auctions.id
      INNER JOIN categories ON auctions.category_id = categories.id
      WHERE orders.winner_id = $1`;

    const params = [userId];
    if (status) {
      params.push(status);
      query += ` AND orders.status = $${params.length}`;
    }

    query += ' ORDER BY orders.created_at DESC';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's activity
router.get('/my-activity', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50 } = req.query;

    // Get comprehensive activity data
    const activities = [];

    // Get bid activities
    const bidResult = await db.query(
      `SELECT 
        'bid' as activity_type,
        bids.id,
        bids.amount,
        bids.created_at,
        auctions.id as auction_id,
        auctions.title as auction_title,
        auctions.image_url,
        auctions.status as auction_status,
        auctions.current_bid,
        'Placed bid on' as action_description
      FROM bids 
      INNER JOIN auctions ON bids.auction_id = auctions.id
      WHERE bids.bidder_id = $1
      ORDER BY bids.created_at DESC
      LIMIT $2`,
      [userId, Math.min(parseInt(limit), 100)]
    );

    activities.push(...bidResult.rows);

    // Get auction creation activities
    const auctionResult = await db.query(
      `SELECT 
        'auction_created' as activity_type,
        auctions.id,
        NULL as amount,
        auctions.created_at,
        auctions.id as auction_id,
        auctions.title as auction_title,
        auctions.image_url,
        auctions.status as auction_status,
        auctions.current_bid,
        'Created auction for' as action_description
      FROM auctions 
      WHERE auctions.seller_id = $1
      ORDER BY auctions.created_at DESC
      LIMIT $2`,
      [userId, Math.min(parseInt(limit), 100)]
    );

    activities.push(...auctionResult.rows);

    // Get order activities
    const orderResult = await db.query(
      `SELECT 
        'order' as activity_type,
        orders.id,
        orders.final_amount as amount,
        orders.created_at,
        auctions.id as auction_id,
        auctions.title as auction_title,
        auctions.image_url,
        orders.status as auction_status,
        orders.final_amount as current_bid,
        CASE 
          WHEN orders.status = 'pending' THEN 'Won auction -'
          WHEN orders.status = 'paid' THEN 'Paid for'
          WHEN orders.status = 'shipped' THEN 'Item shipped -'
          WHEN orders.status = 'delivered' THEN 'Item delivered -'
          ELSE 'Order activity -'
        END as action_description
      FROM orders 
      INNER JOIN auctions ON orders.auction_id = auctions.id
      WHERE orders.winner_id = $1
      ORDER BY orders.created_at DESC
      LIMIT $2`,
      [userId, Math.min(parseInt(limit), 100)]
    );

    activities.push(...orderResult.rows);

    // Get user activities if the table exists
    try {
      const userActivityResult = await db.query(
        `SELECT 
          'user_activity' as activity_type,
          user_activities.id,
          NULL as amount,
          user_activities.created_at,
          NULL as auction_id,
          user_activities.activity_type as auction_title,
          NULL as image_url,
          NULL as auction_status,
          NULL as current_bid,
          CASE 
            WHEN user_activities.activity_type = 'login' THEN 'Logged in'
            WHEN user_activities.activity_type = 'logout' THEN 'Logged out'
            WHEN user_activities.activity_type = 'password_change' THEN 'Changed password'
            WHEN user_activities.activity_type = 'profile_update' THEN 'Updated profile'
            ELSE CONCAT('User activity: ', user_activities.activity_type)
          END as action_description
        FROM user_activities 
        WHERE user_activities.user_id = $1
        ORDER BY user_activities.created_at DESC
        LIMIT $2`,
        [userId, Math.min(parseInt(limit), 100)]
      );
      activities.push(...userActivityResult.rows);
    } catch (userActivityError) {
      // user_activities table might not exist, skip it
      console.log('User activities table not found, skipping user activity data');
    }

    // Sort all activities by date
    activities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Limit the final result
    const limitedActivities = activities.slice(0, parseInt(limit));

    res.json(limitedActivities);
  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user statistics
router.get('/my-stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get bid statistics
    const bidStatsResult = await db.query(
      `SELECT 
        COUNT(*) as total_bids,
        COUNT(DISTINCT auction_id) as auctions_bid_on,
        COALESCE(AVG(amount), 0) as avg_bid_amount,
        COALESCE(MAX(amount), 0) as highest_bid
      FROM bids 
      WHERE bidder_id = $1`,
      [userId]
    );

    // Get auction statistics (items they've sold)
    const auctionStatsResult = await db.query(
      `SELECT 
        COUNT(*) as total_auctions,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_auctions,
        COUNT(CASE WHEN status = 'ended' THEN 1 END) as ended_auctions,
        COALESCE(AVG(current_bid), 0) as avg_final_price
      FROM auctions 
      WHERE seller_id = $1`,
      [userId]
    );

    // Get order statistics (items they've won)
    const orderStatsResult = await db.query(
      `SELECT 
        COUNT(*) as total_wins,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as completed_orders,
        COALESCE(SUM(final_amount), 0) as total_spent,
        COALESCE(AVG(final_amount), 0) as avg_order_value
      FROM orders 
      WHERE winner_id = $1`,
      [userId]
    );

    res.json({
      bids: bidStatsResult.rows[0],
      auctions: auctionStatsResult.rows[0],
      orders: orderStatsResult.rows[0]
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Google OAuth status check (for frontend)
router.get('/google/status', (req, res) => {
  if (req.user) {
    res.json({ authenticated: true, user: req.user });
  } else {
    res.json({ authenticated: false });
  }
});

// Get public aggregate stats (non-admin)
router.get('/public-stats', async (req, res) => {
  try {
    const usersResult = await db.query('SELECT COUNT(*)::int AS count FROM users');
    const activeAuctionsResult = await db.query("SELECT COUNT(*)::int AS count FROM auctions WHERE status = 'active'");
    const bidsResult = await db.query('SELECT COUNT(*)::int AS count FROM bids');
    const revenueResult = await db.query(`
      SELECT COALESCE(SUM(final_amount), 0)::float AS revenue 
      FROM orders 
      WHERE status IN ('paid','shipped','delivered')
    `);

    res.json({
      total_users: usersResult.rows[0].count,
      active_auctions: activeAuctionsResult.rows[0].count,
      total_bids: bidsResult.rows[0].count,
      revenue: revenueResult.rows[0].revenue
    });
  } catch (error) {
    console.error('Get public stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
