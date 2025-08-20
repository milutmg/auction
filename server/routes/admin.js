const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Middleware to check if user is admin
function adminOnly(req, res, next) {
  console.log('Admin check - User:', req.user); // Debug log
  if (!req.user || req.user.role !== 'admin') {
    console.log('Admin access denied - User role:', req.user?.role); // Debug log
    return res.status(403).json({ error: 'Admin access only' });
  }
  next();
}

// Debug endpoint to check user authentication
router.get('/debug-auth', authenticateToken, async (req, res) => {
  res.json({
    user: req.user,
    isAdmin: req.user?.role === 'admin'
  });
});

// Get system statistics
router.get('/stats', authenticateToken, adminOnly, async (req, res) => {
  try {
    const stats = {};
    
    // Total users
    const usersResult = await db.query('SELECT COUNT(*) as count FROM users');
    stats.total_users = parseInt(usersResult.rows[0].count);
    
    // Active auctions
    const activeAuctionsResult = await db.query("SELECT COUNT(*) as count FROM auctions WHERE status = 'active'");
    stats.active_auctions = parseInt(activeAuctionsResult.rows[0].count);
    
    // Pending auctions
    const pendingAuctionsResult = await db.query("SELECT COUNT(*) as count FROM auctions WHERE approval_status = 'pending'");
    stats.pending_auctions = parseInt(pendingAuctionsResult.rows[0].count);
    
    // Total bids
    const bidsResult = await db.query('SELECT COUNT(*) as count FROM bids');
    stats.total_bids = parseInt(bidsResult.rows[0].count);
    
    // Revenue (sum of winning bids)
    const revenueResult = await db.query(`
      SELECT COALESCE(SUM(final_amount), 0) as revenue 
      FROM orders 
      WHERE status IN ('paid', 'shipped', 'delivered')
    `);
    stats.revenue = parseFloat(revenueResult.rows[0].revenue || 0);

    // Daily changes (compared to yesterday)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Yesterday's user count
    const yesterdayUsersResult = await db.query('SELECT COUNT(*) as count FROM users WHERE created_at < $1', [yesterday + ' 23:59:59']);
    const yesterdayUsers = parseInt(yesterdayUsersResult.rows[0].count);
    const userChange = yesterdayUsers > 0 ? ((stats.total_users - yesterdayUsers) / yesterdayUsers * 100) : 0;

    // Yesterday's auction count
    const yesterdayAuctionsResult = await db.query("SELECT COUNT(*) as count FROM auctions WHERE created_at < $1", [yesterday + ' 23:59:59']);
    const yesterdayAuctions = parseInt(yesterdayAuctionsResult.rows[0].count);
    const auctionChange = yesterdayAuctions > 0 ? ((stats.active_auctions - yesterdayAuctions) / yesterdayAuctions * 100) : 0;

    // Yesterday's bid count
    const yesterdayBidsResult = await db.query('SELECT COUNT(*) as count FROM bids WHERE created_at < $1', [yesterday + ' 23:59:59']);
    const yesterdayBids = parseInt(yesterdayBidsResult.rows[0].count);
    const bidChange = yesterdayBids > 0 ? ((stats.total_bids - yesterdayBids) / yesterdayBids * 100) : 0;

    // Yesterday's revenue
    const yesterdayRevenueResult = await db.query(`
      SELECT COALESCE(SUM(final_amount), 0) as revenue 
      FROM orders 
      WHERE status IN ('paid', 'shipped', 'delivered') AND created_at < $1
    `, [yesterday + ' 23:59:59']);
    const yesterdayRevenue = parseFloat(yesterdayRevenueResult.rows[0].revenue || 0);
    const revenueChange = yesterdayRevenue > 0 ? ((stats.revenue - yesterdayRevenue) / yesterdayRevenue * 100) : 0;

    stats.daily_change = {
      users: Math.round(userChange * 100) / 100,
      auctions: Math.round(auctionChange * 100) / 100,
      bids: Math.round(bidChange * 100) / 100,
      revenue: Math.round(revenueChange * 100) / 100
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get recent activity for admin dashboard
router.get('/activity', authenticateToken, adminOnly, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const activities = [];

    // Recent bids
    const bidsResult = await db.query(`
      SELECT 
        b.id,
        'bid' as type,
        CONCAT('New bid on ', a.title) as title,
        u.full_name as user_name,
        b.amount,
        b.created_at
      FROM bids b
      JOIN auctions a ON b.auction_id = a.id
      JOIN users u ON b.bidder_id = u.id
      ORDER BY b.created_at DESC
      LIMIT $1
    `, [limit / 2]);

    // Recent auctions
    const auctionsResult = await db.query(`
      SELECT 
        a.id,
        'auction' as type,
        CONCAT('New auction: ', a.title) as title,
        u.full_name as user_name,
        a.starting_bid as amount,
        a.created_at
      FROM auctions a
      JOIN users u ON a.seller_id = u.id
      WHERE a.approval_status = 'approved'
      ORDER BY a.created_at DESC
      LIMIT $1
    `, [limit / 2]);

    // Recent registrations
    const usersResult = await db.query(`
      SELECT 
        u.id,
        'user' as type,
        'New user registered' as title,
        u.full_name as user_name,
        NULL as amount,
        u.created_at
      FROM users u
      WHERE u.role = 'user'
      ORDER BY u.created_at DESC
      LIMIT $1
    `, [Math.floor(limit / 4)]);

    // Recent payments
    const paymentsResult = await db.query(`
      SELECT 
        o.id,
        'payment' as type,
        'Payment completed' as title,
        u.full_name as user_name,
        o.final_amount as amount,
        o.created_at
      FROM orders o
      JOIN users u ON o.winner_id = u.id
      WHERE o.status IN ('paid', 'shipped', 'delivered')
      ORDER BY o.created_at DESC
      LIMIT $1
    `, [Math.floor(limit / 4)]);

    // Combine and sort all activities
    const allActivities = [
      ...bidsResult.rows,
      ...auctionsResult.rows,
      ...usersResult.rows,
      ...paymentsResult.rows
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, limit);

    // Add status to each activity
    const activitiesWithStatus = allActivities.map(activity => ({
      ...activity,
      status: activity.type === 'payment' ? 'success' : 
              activity.type === 'auction' ? 'pending' : 'success'
    }));

    res.json({
      data: activitiesWithStatus,
      pagination: {
        page,
        limit,
        total: allActivities.length
      }
    });
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get top performers for admin dashboard
router.get('/top-performers', authenticateToken, adminOnly, async (req, res) => {
  try {
    const performers = [];

    // Top category by auction count
    const topCategoryResult = await db.query(`
      SELECT 
        c.name as category,
        COUNT(*) as auction_count,
        COALESCE(SUM(a.current_bid), 0) as total_value
      FROM auctions a
      JOIN categories c ON a.category_id = c.id
      WHERE a.status IN ('ended', 'active') AND a.current_bid IS NOT NULL
      GROUP BY c.name
      ORDER BY auction_count DESC, total_value DESC
      LIMIT 1
    `);

    if (topCategoryResult.rows.length > 0) {
      const category = topCategoryResult.rows[0];
      performers.push({
        name: category.category,
        category: 'Top Category',
        value: parseInt(category.total_value),
        change: 12.5, // Mock change for now
        type: 'category'
      });
    }

    // Top bidder by total bid amount
    const topBidderResult = await db.query(`
      SELECT 
        u.full_name,
        COUNT(b.id) as bid_count,
        COALESCE(SUM(b.amount), 0) as total_bids
      FROM users u
      JOIN bids b ON u.id = b.bidder_id
      GROUP BY u.id, u.full_name
      ORDER BY total_bids DESC, bid_count DESC
      LIMIT 1
    `);

    if (topBidderResult.rows.length > 0) {
      const bidder = topBidderResult.rows[0];
      performers.push({
        name: bidder.full_name,
        category: 'Top Bidder',
        value: parseInt(bidder.total_bids),
        change: -2.1, // Mock change for now
        type: 'user'
      });
    }

    // Top auction by bid count or final price
    const topAuctionResult = await db.query(`
      SELECT 
        a.title,
        COALESCE(a.current_bid, a.starting_bid) as final_price,
        COUNT(b.id) as bid_count
      FROM auctions a
      LEFT JOIN bids b ON a.id = b.auction_id
      WHERE a.status IN ('ended', 'active')
      GROUP BY a.id, a.title, a.current_bid, a.starting_bid
      ORDER BY COALESCE(a.current_bid, a.starting_bid) DESC, bid_count DESC
      LIMIT 1
    `);

    if (topAuctionResult.rows.length > 0) {
      const auction = topAuctionResult.rows[0];
      performers.push({
        name: auction.title,
        category: 'Top Auction',
        value: parseInt(auction.final_price || 0),
        change: 8.7, // Mock change for now
        type: 'auction'
      });
    }

    res.json(performers);
  } catch (error) {
    console.error('Get top performers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get pending auctions for approval
router.get('/auctions/pending', authenticateToken, adminOnly, async (req, res) => {
  try {
    console.log('Fetching pending auctions...');
    const result = await db.query(`
      SELECT a.*, u.full_name as seller_name
      FROM auctions a
      JOIN users u ON a.seller_id = u.id
      WHERE a.approval_status = 'pending'
      ORDER BY a.created_at DESC
    `);
    console.log(`Found ${result.rows.length} pending auctions`);
    res.json(result.rows);
  } catch (error) {
    console.error('Get pending auctions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Approve or reject an auction
router.post('/auction/:id/approve', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { approvalStatus, rejectionReason } = req.body;
    const adminId = req.user.id;

    if (!['approved', 'rejected'].includes(approvalStatus)) {
      return res.status(400).json({ error: 'Invalid approval status' });
    }

    const update = {
      approval_status: approvalStatus,
      approved_by: adminId,
      approved_at: new Date()
    };

    if (approvalStatus === 'rejected') {
      update.rejection_reason = rejectionReason || 'No reason provided';
    }

    // If approving, also set status to 'active' so users can bid
    let statusUpdate = '';
    let params = [update.approval_status, update.approved_by, update.approved_at, update.rejection_reason, id];
    
    if (approvalStatus === 'approved') {
      statusUpdate = ', status = $6';
      params.push('active');
    }

    const result = await db.query(
      `UPDATE auctions SET 
        approval_status = $1, approved_by = $2, approved_at = $3, rejection_reason = $4${statusUpdate}
      WHERE id = $5
      RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Auction not found' });
    }

    const auction = result.rows[0];

    // Send notification to auction creator
    try {
      const notificationType = approvalStatus === 'approved' ? 'auction_approved' : 'auction_rejected';
      const notificationTitle = approvalStatus === 'approved' ? 
        'Your auction has been approved!' : 
        'Your auction was not approved';
      const notificationMessage = approvalStatus === 'approved' ? 
        `Your auction "${auction.title}" has been approved and is now live for bidding!` :
        `Your auction "${auction.title}" was not approved. ${rejectionReason ? 'Reason: ' + rejectionReason : ''}`;

      await db.query(
        `INSERT INTO notifications (user_id, type, title, message, related_auction_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [auction.seller_id, notificationType, notificationTitle, notificationMessage, auction.id]
      );

      console.log(`Sent ${approvalStatus} notification to user ${auction.seller_id} for auction: ${auction.title}`);
    } catch (notificationError) {
      console.error('Failed to send auction approval notification:', notificationError);
    }

    // Log admin action
    await db.query(
      `INSERT INTO admin_actions (admin_id, action, target_type, target_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [adminId, `${approvalStatus}_auction`, 'auction', id, JSON.stringify({ rejection_reason: rejectionReason })]
    );

    res.json({
      message: `Auction ${approvalStatus}`,
      auction: result.rows[0]
    });
  } catch (error) {
    console.error('Auction approval error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Approve a pending auction
router.post('/auctions/:id/approve', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;

    // Update auction approval_status
    const result = await db.query(`
      UPDATE auctions
      SET approval_status = 'approved', approved_at = NOW(), status = CASE WHEN status = 'pending' THEN 'active' ELSE status END
      WHERE id = $1 AND approval_status = 'pending'
      RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Auction not found or not pending' });
    }

    const auction = result.rows[0];

    // Notify seller
    await db.query(`
      INSERT INTO notifications (user_id, type, title, message, related_auction_id, is_read)
      VALUES ($1, 'auction_approved', 'Auction Approved', 'Your auction "${auction.title}" has been approved and is now live.', $2, false)
    `, [auction.seller_id, auction.id]);

    // Emit socket event
    try {
      const io = req.app.get('io');
      io && io.emit('auction-approved', { auctionId: auction.id, title: auction.title, sellerId: auction.seller_id });
    } catch (e) { console.error('Emit auction-approved failed', e); }

    res.json({ message: 'Auction approved', auction });
  } catch (error) {
    console.error('Approve auction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reject a pending auction
router.post('/auctions/:id/reject', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const result = await db.query(`
      UPDATE auctions
      SET approval_status = 'rejected', rejection_reason = $2
      WHERE id = $1 AND approval_status = 'pending'
      RETURNING *
    `, [id, reason || null]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Auction not found or not pending' });
    }

    const auction = result.rows[0];

    await db.query(`
      INSERT INTO notifications (user_id, type, title, message, related_auction_id, is_read)
      VALUES ($1, 'auction_rejected', 'Auction Rejected', 'Your auction "${auction.title}" was rejected.${reason ? ' Reason: ' + reason : ''}', $2, false)
    `, [auction.seller_id, auction.id]);

    try {
      const io = req.app.get('io');
      io && io.emit('auction-rejected', { auctionId: auction.id, title: auction.title, sellerId: auction.seller_id, reason: reason || null });
    } catch (e) { console.error('Emit auction-rejected failed', e); }

    res.json({ message: 'Auction rejected', auction });
  } catch (error) {
    console.error('Reject auction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List all users (for management)
router.get('/users', authenticateToken, adminOnly, async (req, res) => {
  try {
    const result = await db.query('SELECT id, email, full_name, role, is_active, created_at FROM users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Suspend or activate a user
router.post('/users/:id/status', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    const adminId = req.user.id;

    const result = await db.query(
      `UPDATE users SET is_active = $1 WHERE id = $2 RETURNING id, email, is_active`,
      [is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Log admin action
    await db.query(
      `INSERT INTO admin_actions (admin_id, action, target_type, target_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [adminId, is_active ? 'activate_user' : 'suspend_user', 'user', id, JSON.stringify({ is_active })]
    );

    res.json({
      message: `User ${is_active ? 'activated' : 'suspended'}`,
      user: result.rows[0]
    });
  } catch (error) {
    console.error('User status change error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get recent bids for monitoring
router.get('/bids/recent', authenticateToken, adminOnly, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT b.*, a.title as auction_title, u.full_name as bidder_name
      FROM bids b
      JOIN auctions a ON b.auction_id = a.id
      JOIN users u ON b.bidder_id = u.id
      ORDER BY b.created_at DESC
      LIMIT 50
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Get recent bids error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get reports
router.get('/reports', authenticateToken, adminOnly, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT r.*, 
             reporter.full_name as reporter_name,
             reported.full_name as reported_user_name,
             a.title as auction_title
      FROM reports r
      LEFT JOIN users reporter ON r.reporter_id = reporter.id
      LEFT JOIN users reported ON r.reported_user_id = reported.id
      LEFT JOIN auctions a ON r.auction_id = a.id
      ORDER BY r.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update report status
router.post('/reports/:id/status', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const adminId = req.user.id;

    if (!['pending', 'investigating', 'resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const update = { status };
    if (status === 'resolved' || status === 'dismissed') {
      update.resolved_at = new Date();
      update.resolved_by = adminId;
    }

    const result = await db.query(
      `UPDATE reports SET status = $1, resolved_at = $2, resolved_by = $3
       WHERE id = $4 RETURNING *`,
      [status, update.resolved_at, update.resolved_by, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Log admin action
    await db.query(
      `INSERT INTO admin_actions (admin_id, action, target_type, target_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [adminId, 'update_report_status', 'report', id, JSON.stringify({ status })]
    );

    res.json({
      message: `Report status updated to ${status}`,
      report: result.rows[0]
    });
  } catch (error) {
    console.error('Update report status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send system notification to all users
router.post('/notifications/broadcast', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { title, message, type } = req.body;
    const adminId = req.user.id;

    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required' });
    }

    // Get all active users
    const usersResult = await db.query('SELECT id FROM users WHERE is_active = true');
    
    // Insert notification for each user
    const insertPromises = usersResult.rows.map(user => 
      db.query(
        `INSERT INTO notifications (user_id, title, message, type)
         VALUES ($1, $2, $3, $4)`,
        [user.id, title, message, type || 'system']
      )
    );

    await Promise.all(insertPromises);

    // Log admin action
    await db.query(
      `INSERT INTO admin_actions (admin_id, action, target_type, target_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [adminId, 'broadcast_notification', 'system', 'all_users', JSON.stringify({ title, message, type })]
    );

    res.json({
      message: `System notification sent to ${usersResult.rows.length} users`,
      recipient_count: usersResult.rows.length
    });
  } catch (error) {
    console.error('Broadcast notification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update bidding rules
router.post('/settings/bid-rules', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { min_increment, auto_extend_minutes, payment_deadline_hours } = req.body;
    const adminId = req.user.id;

    // Update default values in auctions table or create a settings table
    // For now, we'll just log the action and return success
    // In a real implementation, you might want a settings table
    
    // Log admin action
    await db.query(
      `INSERT INTO admin_actions (admin_id, action, target_type, target_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [adminId, 'update_bid_rules', 'system', 'bid_settings', JSON.stringify({ min_increment, auto_extend_minutes, payment_deadline_hours })]
    );

    res.json({
      message: 'Bidding rules updated successfully',
      settings: { min_increment, auto_extend_minutes, payment_deadline_hours }
    });
  } catch (error) {
    console.error('Update bid rules error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get admin action logs
router.get('/logs', authenticateToken, adminOnly, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT aa.*, u.full_name as admin_name
      FROM admin_actions aa
      JOIN users u ON aa.admin_id = u.id
      ORDER BY aa.created_at DESC
      LIMIT 100
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Get admin logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Configure bidding rules (admin only)
router.post('/bidding-rules', authenticateToken, adminOnly, async (req, res) => {
  try {
    const {
      min_starting_bid,
      max_starting_bid,
      default_duration_hours,
      min_bid_increment,
      auto_extend_minutes,
      payment_deadline_hours
    } = req.body;
    const adminId = req.user.id;

    // Store bidding rules in a settings table or use a key-value store
    // For now, we'll log the action and return success
    await db.query(
      `INSERT INTO admin_actions (admin_id, action, target_type, target_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [adminId, 'update_bidding_rules', 'system', 'rules', JSON.stringify(req.body)]
    );

    res.json({
      message: 'Bidding rules updated successfully',
      rules: req.body
    });
  } catch (error) {
    console.error('Update bidding rules error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all auctions for admin management
router.get('/auctions/all', authenticateToken, adminOnly, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        a.id, a.title, a.starting_bid, a.current_bid, a.status, a.end_time,
        a.approval_status, a.rejection_reason, a.created_at,
        u.full_name as seller_name,
        c.name as category,
        (SELECT COUNT(*) FROM bids WHERE auction_id = a.id) as total_bids
      FROM auctions a
      LEFT JOIN users u ON a.seller_id = u.id
      LEFT JOIN categories c ON a.category_id = c.id
      ORDER BY a.created_at DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get all auctions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete an auction (admin only)
router.delete('/auctions/:id', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    // Get auction details for logging
    const auctionResult = await db.query('SELECT * FROM auctions WHERE id = $1', [id]);
    if (auctionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Auction not found' });
    }

    const auction = auctionResult.rows[0];

    // Delete associated bids first
    await db.query('DELETE FROM bids WHERE auction_id = $1', [id]);
    
    // Delete the auction
    await db.query('DELETE FROM auctions WHERE id = $1', [id]);

    // Log admin action
    await db.query(
      `INSERT INTO admin_actions (admin_id, action, target_type, target_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [adminId, 'delete_auction', 'auction', id, JSON.stringify(auction)]
    );

    res.json({ message: 'Auction deleted successfully' });
  } catch (error) {
    console.error('Delete auction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get enhanced user list with activity stats
router.get('/users/enhanced', authenticateToken, adminOnly, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        u.id, u.email, u.full_name, u.role, u.is_active, u.created_at,
        COALESCE(bid_stats.total_bids, 0) as total_bids,
        COALESCE(bid_stats.total_spent, 0) as total_spent
      FROM users u
      LEFT JOIN (
        SELECT 
          b.bidder_id,
          COUNT(*) as total_bids,
          SUM(CASE WHEN b.amount = a.current_bid AND a.status = 'ended' THEN b.amount ELSE 0 END) as total_spent
        FROM bids b
        LEFT JOIN auctions a ON b.auction_id = a.id
        GROUP BY b.bidder_id
      ) bid_stats ON u.id = bid_stats.bidder_id
      ORDER BY u.created_at DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get enhanced user list error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get admin statistics
router.get('/stats/enhanced', authenticateToken, adminOnly, async (req, res) => {
  try {
    const stats = {};
    
    // Total users
    const usersResult = await db.query('SELECT COUNT(*) as count FROM users');
    stats.total_users = parseInt(usersResult.rows[0].count);
    
    // Active auctions
    const activeAuctionsResult = await db.query("SELECT COUNT(*) as count FROM auctions WHERE status = 'active'");
    stats.active_auctions = parseInt(activeAuctionsResult.rows[0].count);
    
    // Pending requests
    const pendingRequestsResult = await db.query("SELECT COUNT(*) as count FROM bid_requests WHERE status = 'pending'");
    stats.pending_requests = parseInt(pendingRequestsResult.rows[0].count);
    
    // Total revenue (mock calculation)
    const revenueResult = await db.query(`
      SELECT COALESCE(SUM(current_bid * 0.1), 0) as revenue 
      FROM auctions 
      WHERE status = 'ended'
    `);
    stats.total_revenue = parseFloat(revenueResult.rows[0].revenue || 0);
    
    // Daily signups (last 24 hours)
    const signupsResult = await db.query(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE created_at >= NOW() - INTERVAL '24 hours'
    `);
    stats.daily_signups = parseInt(signupsResult.rows[0].count);
    
    res.json(stats);
  } catch (error) {
    console.error('Get enhanced stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a bid (for suspicious activity)
router.delete('/bids/:id', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    // First get the bid details for logging
    const bidResult = await db.query('SELECT * FROM bids WHERE id = $1', [id]);
    if (bidResult.rows.length === 0) {
      return res.status(404).json({ error: 'Bid not found' });
    }

    const bid = bidResult.rows[0];

    // Delete the bid
    await db.query('DELETE FROM bids WHERE id = $1', [id]);

    // Update auction current bid (recalculate from remaining bids)
    const maxBidResult = await db.query(
      'SELECT COALESCE(MAX(amount), 0) as max_bid FROM bids WHERE auction_id = $1',
      [bid.auction_id]
    );
    
    await db.query(
      'UPDATE auctions SET current_bid = $1 WHERE id = $2',
      [maxBidResult.rows[0].max_bid, bid.auction_id]
    );

    // Log admin action
    await db.query(
      `INSERT INTO admin_actions (admin_id, action, target_type, target_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [adminId, 'delete_suspicious_bid', 'bid', id, JSON.stringify(bid)]
    );

    res.json({ message: 'Suspicious bid deleted successfully' });
  } catch (error) {
    console.error('Delete bid error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User Analytics and Management
router.get('/analytics/users', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    
    const analytics = {};
    
    // User growth over time
    const userGrowthResult = await db.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as new_users
      FROM users 
      WHERE created_at >= NOW() - INTERVAL '${period} days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);
    analytics.user_growth = userGrowthResult.rows;
    
    // Active users (users who placed bids in the last 7 days)
    const activeUsersResult = await db.query(`
      SELECT COUNT(DISTINCT b.bidder_id) as active_users
      FROM bids b
      WHERE b.created_at >= NOW() - INTERVAL '7 days'
    `);
    analytics.active_users = parseInt(activeUsersResult.rows[0].active_users);
    
    // User activity by category
    const activityResult = await db.query(`
      SELECT 
        c.name as category,
        COUNT(b.id) as bid_count,
        COUNT(DISTINCT b.bidder_id) as unique_users
      FROM bids b
      JOIN auctions a ON b.auction_id = a.id
      JOIN categories c ON a.category_id = c.id
      WHERE b.created_at >= NOW() - INTERVAL '${period} days'
      GROUP BY c.name
      ORDER BY bid_count DESC
    `);
    analytics.activity_by_category = activityResult.rows;
    
    // Top users by bid count
    const topUsersResult = await db.query(`
      SELECT 
        u.full_name,
        u.email,
        COUNT(b.id) as total_bids,
        SUM(b.amount) as total_bid_amount,
        MAX(b.created_at) as last_bid
      FROM users u
      JOIN bids b ON u.id = b.bidder_id
      WHERE b.created_at >= NOW() - INTERVAL '${period} days'
      GROUP BY u.id, u.full_name, u.email
      ORDER BY total_bids DESC
      LIMIT 10
    `);
    analytics.top_users = topUsersResult.rows;
    
    res.json(analytics);
  } catch (error) {
    console.error('User analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Financial Reporting
router.get('/reports/financial', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { period = '30' } = req.query;
    
    const report = {};
    
    // Revenue by period
    const revenueResult = await db.query(`
      SELECT 
        DATE(created_at) as date,
        SUM(final_amount) as daily_revenue,
        COUNT(*) as orders_count
      FROM orders
      WHERE status IN ('paid', 'shipped', 'delivered')
        AND created_at >= NOW() - INTERVAL '${period} days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);
    report.daily_revenue = revenueResult.rows;
    
    // Commission calculation (assume 10% commission)
    const commissionResult = await db.query(`
      SELECT 
        SUM(final_amount * 0.1) as total_commission,
        COUNT(*) as total_orders
      FROM orders
      WHERE status IN ('paid', 'shipped', 'delivered')
        AND created_at >= NOW() - INTERVAL '${period} days'
    `);
    report.commission_summary = commissionResult.rows[0];
    
    // Revenue by category
    const categoryRevenueResult = await db.query(`
      SELECT 
        c.name as category,
        SUM(o.final_amount) as revenue,
        COUNT(o.id) as orders,
        AVG(o.final_amount) as avg_order_value
      FROM orders o
      JOIN auctions a ON o.auction_id = a.id
      JOIN categories c ON a.category_id = c.id
      WHERE o.status IN ('paid', 'shipped', 'delivered')
        AND o.created_at >= NOW() - INTERVAL '${period} days'
      GROUP BY c.name
      ORDER BY revenue DESC
    `);
    report.revenue_by_category = categoryRevenueResult.rows;
    
    // Payment method statistics
    const paymentStatsResult = await db.query(`
      SELECT 
        payment_method,
        COUNT(*) as transaction_count,
        SUM(final_amount) as total_amount
      FROM orders
      WHERE status IN ('paid', 'shipped', 'delivered')
        AND created_at >= NOW() - INTERVAL '${period} days'
      GROUP BY payment_method
    `);
    report.payment_methods = paymentStatsResult.rows;
    
    res.json(report);
  } catch (error) {
    console.error('Financial reporting error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// System Monitoring
router.get('/monitoring/system', authenticateToken, adminOnly, async (req, res) => {
  try {
    const monitoring = {};
    
    // Database health check
    const dbHealthResult = await db.query('SELECT NOW() as current_time');
    monitoring.database_status = 'healthy';
    monitoring.database_response_time = '< 10ms';
    
    // Active sessions (simplified - count recent logins)
    monitoring.active_sessions = 127; // Mock data for demo
    
    // Error monitoring (simplified)
    monitoring.recent_errors = 0;
    
    // Auction activity
    const auctionActivityResult = await db.query(`
      SELECT 
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_auctions,
        COUNT(CASE WHEN status = 'ended' AND end_time >= NOW() - INTERVAL '24 hours' THEN 1 END) as recently_ended,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as newly_created
      FROM auctions
    `);
    monitoring.auction_activity = auctionActivityResult.rows[0];
    
    // Bid activity in last hour
    const bidActivityResult = await db.query(`
      SELECT COUNT(*) as recent_bids
      FROM bids
      WHERE created_at >= NOW() - INTERVAL '1 hour'
    `);
    monitoring.recent_bid_activity = parseInt(bidActivityResult.rows[0].recent_bids);
    
    res.json(monitoring);
  } catch (error) {
    console.error('System monitoring error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send Email Alerts to Users
router.post('/alerts/email', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { recipient_type, user_ids, subject, message, priority } = req.body;
    const adminId = req.user.id;
    
    let targetUsers = [];
    
    if (recipient_type === 'all') {
      const usersResult = await db.query('SELECT id, email, full_name FROM users WHERE is_active = true');
      targetUsers = usersResult.rows;
    } else if (recipient_type === 'specific' && user_ids) {
      const usersResult = await db.query(
        'SELECT id, email, full_name FROM users WHERE id = ANY($1) AND is_active = true',
        [user_ids]
      );
      targetUsers = usersResult.rows;
    } else if (recipient_type === 'active_bidders') {
      const usersResult = await db.query(`
        SELECT DISTINCT u.id, u.email, u.full_name
        FROM users u
        JOIN bids b ON u.id = b.bidder_id
        WHERE b.created_at >= NOW() - INTERVAL '30 days'
          AND u.is_active = true
      `);
      targetUsers = usersResult.rows;
    }
    
    // Store email alerts in database (you'd integrate with actual email service)
    const emailPromises = targetUsers.map(user => 
      db.query(
        `INSERT INTO notifications (user_id, title, message, type, priority)
         VALUES ($1, $2, $3, $4, $5)`,
        [user.id, subject, message, 'email_alert', priority || 'normal']
      )
    );
    
    await Promise.all(emailPromises);
    
    // Log admin action
    await db.query(
      `INSERT INTO admin_actions (admin_id, action, target_type, target_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [adminId, 'send_email_alert', 'bulk_email', 'system', JSON.stringify({ 
        recipient_type, 
        recipient_count: targetUsers.length, 
        subject, 
        priority 
      })]
    );
    
    res.json({
      message: `Email alert sent to ${targetUsers.length} users`,
      recipient_count: targetUsers.length
    });
  } catch (error) {
    console.error('Send email alert error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Product/Auction Moderation
router.get('/moderation/auctions', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { status = 'all' } = req.query;
    
    let whereClause = '';
    if (status !== 'all') {
      whereClause = `WHERE a.approval_status = '${status}'`;
    }
    
    const result = await db.query(`
      SELECT 
        a.*,
        u.full_name as seller_name,
        u.email as seller_email,
        c.name as category_name,
        (SELECT COUNT(*) FROM bids WHERE auction_id = a.id) as bid_count,
        (SELECT COUNT(*) FROM reports WHERE auction_id = a.id) as report_count
      FROM auctions a
      JOIN users u ON a.seller_id = u.id
      LEFT JOIN categories c ON a.category_id = c.id
      ${whereClause}
      ORDER BY a.created_at DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Auction moderation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Approve/Reject Auctions with detailed feedback
router.post('/moderation/auction/:id/decision', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { decision, feedback, quality_score, send_notification } = req.body;
    const adminId = req.user.id;
    
    if (!['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({ error: 'Invalid decision' });
    }
    
    const updateQuery = `
      UPDATE auctions SET 
        approval_status = $1,
        approved_by = $2,
        approved_at = $3,
        admin_feedback = $4,
        quality_score = $5
      WHERE id = $6
      RETURNING *
    `;
    
    const result = await db.query(updateQuery, [
      decision,
      adminId,
      new Date(),
      feedback,
      quality_score,
      id
    ]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Auction not found' });
    }
    
    const auction = result.rows[0];
    
    // Send notification to seller if requested
    if (send_notification) {
      await db.query(
        `INSERT INTO notifications (user_id, title, message, type)
         VALUES ($1, $2, $3, $4)`,
        [
          auction.seller_id,
          `Auction ${decision}: ${auction.title}`,
          `Your auction has been ${decision}. ${feedback ? 'Admin feedback: ' + feedback : ''}`,
          decision === 'approved' ? 'success' : 'warning'
        ]
      );
    }
    
    // Log admin action
    await db.query(
      `INSERT INTO admin_actions (admin_id, action, target_type, target_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [adminId, `${decision}_auction`, 'auction', id, JSON.stringify({ 
        feedback, 
        quality_score, 
        send_notification 
      })]
    );
    
    res.json({
      message: `Auction ${decision} successfully`,
      auction: result.rows[0]
    });
  } catch (error) {
    console.error('Auction decision error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Set Global Bidding Rules
router.post('/settings/bidding-rules', authenticateToken, adminOnly, async (req, res) => {
  try {
    const {
      min_starting_bid,
      max_auction_duration_hours,
      min_bid_increment,
      auto_extend_minutes,
      payment_deadline_hours
    } = req.body;
    
    const adminId = req.user.id;
    
    // Store rules in a settings table (create if doesn't exist)
    await db.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value JSONB NOT NULL,
        updated_by UUID REFERENCES users(id),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    const rules = {
      min_starting_bid,
      max_auction_duration_hours,
      min_bid_increment,
      auto_extend_minutes,
      payment_deadline_hours
    };
    
    await db.query(`
      INSERT INTO system_settings (setting_key, setting_value, updated_by)
      VALUES ('bidding_rules', $1, $2)
      ON CONFLICT (setting_key)
      DO UPDATE SET 
        setting_value = $1,
        updated_by = $2,
        updated_at = CURRENT_TIMESTAMP
    `, [JSON.stringify(rules), adminId]);
    
    // Log admin action
    await db.query(
      `INSERT INTO admin_actions (admin_id, action, target_type, target_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [adminId, 'update_bidding_rules', 'system', 'bidding_rules', JSON.stringify(rules)]
    );
    
    res.json({
      message: 'Bidding rules updated successfully',
      rules: rules
    });
  } catch (error) {
    console.error('Update bidding rules error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Current Bidding Rules
router.get('/settings/bidding-rules', authenticateToken, adminOnly, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT setting_value, updated_at, updated_by
      FROM system_settings
      WHERE setting_key = 'bidding_rules'
    `);
    
    if (result.rows.length === 0) {
      // Return default rules
      const defaultRules = {
        min_starting_bid: 1.00,
        max_auction_duration_hours: 168, // 7 days
        min_bid_increment: 0.01,
        auto_extend_minutes: 10,
        payment_deadline_hours: 48
      };
      return res.json({ rules: defaultRules, is_default: true });
    }
    
    res.json({
      rules: result.rows[0].setting_value,
      updated_at: result.rows[0].updated_at,
      updated_by: result.rows[0].updated_by,
      is_default: false
    });
  } catch (error) {
    console.error('Get bidding rules error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Dispute Resolution
router.get('/disputes', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { status = 'all' } = req.query;
    
    let whereClause = '';
    if (status !== 'all') {
      whereClause = `WHERE r.status = '${status}'`;
    }
    
    const result = await db.query(`
      SELECT 
        r.*,
        reporter.full_name as reporter_name,
        reporter.email as reporter_email,
        reported.full_name as reported_user_name,
        reported.email as reported_user_email,
        a.title as auction_title,
        resolver.full_name as resolver_name
      FROM reports r
      LEFT JOIN users reporter ON r.reporter_id = reporter.id
      LEFT JOIN users reported ON r.reported_user_id = reported.id
      LEFT JOIN auctions a ON r.auction_id = a.id
      LEFT JOIN users resolver ON r.resolved_by = resolver.id
      ${whereClause}
      ORDER BY r.created_at DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get disputes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Resolve Dispute
router.post('/disputes/:id/resolve', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution, action_taken, compensation, send_notifications } = req.body;
    const adminId = req.user.id;
    
    const result = await db.query(`
      UPDATE reports SET 
        status = 'resolved',
        resolution = $1,
        action_taken = $2,
        compensation = $3,
        resolved_at = CURRENT_TIMESTAMP,
        resolved_by = $4
      WHERE id = $5
      RETURNING *
    `, [resolution, action_taken, compensation, adminId, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Dispute not found' });
    }
    
    const dispute = result.rows[0];
    
    // Send notifications if requested
    if (send_notifications) {
      // Notify reporter
      if (dispute.reporter_id) {
        await db.query(
          `INSERT INTO notifications (user_id, title, message, type)
           VALUES ($1, $2, $3, $4)`,
          [
            dispute.reporter_id,
            'Dispute Resolved',
            `Your report has been resolved. Resolution: ${resolution}`,
            'success'
          ]
        );
      }
      
      // Notify reported user
      if (dispute.reported_user_id) {
        await db.query(
          `INSERT INTO notifications (user_id, title, message, type)
           VALUES ($1, $2, $3, $4)`,
          [
            dispute.reported_user_id,
            'Report Resolution',
            `A report concerning your account has been resolved. ${action_taken ? 'Action taken: ' + action_taken : ''}`,
            'info'
          ]
        );
      }
    }
    
    // Log admin action
    await db.query(
      `INSERT INTO admin_actions (admin_id, action, target_type, target_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [adminId, 'resolve_dispute', 'report', id, JSON.stringify({ 
        resolution, 
        action_taken, 
        compensation 
      })]
    );
    
    res.json({
      message: 'Dispute resolved successfully',
      dispute: result.rows[0]
    });
  } catch (error) {
    console.error('Resolve dispute error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get All Bids for a Specific Auction
router.get('/auction/:id/bids', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      SELECT 
        b.*,
        u.full_name as bidder_name,
        u.email as bidder_email,
        u.is_active as bidder_active,
        (SELECT COUNT(*) FROM bids WHERE bidder_id = b.bidder_id) as bidder_total_bids
      FROM bids b
      JOIN users u ON b.bidder_id = u.id
      WHERE b.auction_id = $1
      ORDER BY b.created_at DESC
    `, [id]);
    
    // Also get auction details
    const auctionResult = await db.query(`
      SELECT a.*, u.full_name as seller_name
      FROM auctions a
      JOIN users u ON a.seller_id = u.id
      WHERE a.id = $1
    `, [id]);
    
    res.json({
      auction: auctionResult.rows[0] || null,
      bids: result.rows
    });
  } catch (error) {
    console.error('Get auction bids error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove Suspicious Bids/Users
router.post('/moderation/remove-suspicious-activity', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { type, target_ids, reason, notify_users } = req.body;
    const adminId = req.user.id;
    
    let removedCount = 0;
    let affectedUsers = [];
    
    if (type === 'bids' && target_ids && target_ids.length > 0) {
      // Get bid details before deletion
      const bidsResult = await db.query(`
        SELECT b.*, u.full_name, u.email, a.title as auction_title
        FROM bids b
        JOIN users u ON b.bidder_id = u.id
        JOIN auctions a ON b.auction_id = a.id
        WHERE b.id = ANY($1)
      `, [target_ids]);
      
      affectedUsers = bidsResult.rows;
      
      // Remove suspicious bids
      const deleteResult = await db.query(
        'DELETE FROM bids WHERE id = ANY($1)',
        [target_ids]
      );
      removedCount = deleteResult.rowCount;
      
      // Update auction current bids
      const uniqueAuctionIds = [...new Set(affectedUsers.map(bid => bid.auction_id))];
      for (const auctionId of uniqueAuctionIds) {
        const maxBidResult = await db.query(
          'SELECT COALESCE(MAX(amount), 0) as max_bid FROM bids WHERE auction_id = $1',
          [auctionId]
        );
        
        await db.query(
          'UPDATE auctions SET current_bid = $1 WHERE id = $2',
          [maxBidResult.rows[0].max_bid, auctionId]
        );
      }
    } else if (type === 'users' && target_ids && target_ids.length > 0) {
      // Suspend suspicious users
      const updateResult = await db.query(`
        UPDATE users SET is_active = false 
        WHERE id = ANY($1) 
        RETURNING full_name, email
      `, [target_ids]);
      
      affectedUsers = updateResult.rows;
      removedCount = updateResult.rowCount;
    }
    
    // Send notifications if requested
    if (notify_users && affectedUsers.length > 0) {
      const notificationPromises = affectedUsers.map(user => 
        db.query(
          `INSERT INTO notifications (user_id, title, message, type)
           VALUES ($1, $2, $3, $4)`,
          [
            user.bidder_id || user.id,
            'Account Action Taken',
            `Administrative action taken on your account. Reason: ${reason}`,
            'warning'
          ]
        )
      );
      
      await Promise.all(notificationPromises);
    }
    
    // Log admin action
    await db.query(
      `INSERT INTO admin_actions (admin_id, action, target_type, target_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [adminId, 'remove_suspicious_activity', type, 'bulk', JSON.stringify({ 
        target_ids, 
        reason, 
        removed_count: removedCount 
      })]
    );
    
    res.json({
      message: `Successfully removed ${removedCount} suspicious ${type}`,
      removed_count: removedCount,
      affected_users: affectedUsers.length
    });
  } catch (error) {
    console.error('Remove suspicious activity error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Bid Requests Management
router.get('/bid-requests', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    
    const result = await db.query(`
      SELECT 
        bid_requests.*,
        users.full_name as user_name,
        users.email as user_email
      FROM bid_requests 
      INNER JOIN users ON bid_requests.user_id = users.id
      WHERE bid_requests.status = $1
      ORDER BY bid_requests.created_at DESC
    `, [status]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get bid requests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Approve bid request
router.post('/bid-requests/:id/approve', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Update bid request status
    const updateResult = await db.query(
      'UPDATE bid_requests SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      ['approved', id]
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({ error: 'Bid request not found' });
    }

    const bidRequest = updateResult.rows[0];

    // Create auction from approved bid request
    const auctionResult = await db.query(`
      INSERT INTO auctions (
        seller_id, title, description, image_url, starting_bid,
        category_id, condition_description, provenance, 
        end_time, status, approval_status
      ) VALUES (
        $1, $2, $3, $4, $5,
        (SELECT id FROM categories WHERE name = $6 LIMIT 1),
        $7, $8,
        NOW() + INTERVAL '7 days',
        'active', 'approved'
      ) RETURNING *
    `, [
      bidRequest.user_id,
      bidRequest.title,
      bidRequest.description,
      bidRequest.image_url,
      bidRequest.starting_bid,
      bidRequest.category || 'Other',
      bidRequest.condition,
      bidRequest.provenance
    ]);

    res.json({
      message: 'Bid request approved and auction created',
      bidRequest: updateResult.rows[0],
      auction: auctionResult.rows[0]
    });
  } catch (error) {
    console.error('Approve bid request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reject bid request
router.post('/bid-requests/:id/reject', authenticateToken, adminOnly, async (req, res) => {
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

    res.json({
      message: 'Bid request rejected',
      bidRequest: result.rows[0]
    });
  } catch (error) {
    console.error('Reject bid request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update bid request
router.put('/bid-requests/:id', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      starting_bid,
      estimated_value,
      category,
      condition,
      image_url,
      provenance
    } = req.body;

    const result = await db.query(`
      UPDATE bid_requests 
      SET title = $1, description = $2, starting_bid = $3, estimated_value = $4,
          category = $5, condition = $6, image_url = $7, provenance = $8,
          updated_at = NOW()
      WHERE id = $9
      RETURNING *
    `, [title, description, starting_bid, estimated_value, category, condition, image_url, provenance, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bid request not found' });
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

// Get pending bids for approval
router.get('/pending-bids', authenticateToken, adminOnly, async (req, res) => {
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
      WHERE b.status = 'pending'
      ORDER BY b.created_at DESC
    `);

    res.json({
      pending_bids: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Get pending bids error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Approve a bid
router.post('/bids/:bidId/approve', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { bidId } = req.params;
    const adminId = req.user.id;

    const bidResult = await db.query(`SELECT b.*, a.title as auction_title, a.status as auction_status, a.current_bid, a.end_time, a.id as auction_id FROM bids b JOIN auctions a ON b.auction_id=a.id WHERE b.id=$1`, [bidId]);
    if (!bidResult.rows.length) return res.status(404).json({ error: 'Bid not found' });
    const bid = bidResult.rows[0];
    if (bid.status !== 'pending') return res.status(400).json({ error: 'Bid not pending' });

    await db.query('BEGIN');
    try {
      await db.query('SELECT id FROM bids WHERE id=$1 FOR UPDATE', [bidId]);
      const lockedAuction = await db.query('SELECT id,status,current_bid FROM auctions WHERE id=$1 FOR UPDATE', [bid.auction_id]);
      const auctionRow = lockedAuction.rows[0];
      if (!auctionRow) throw new Error('Auction missing');

      if (auctionRow.status === 'ended') {
        await db.query('UPDATE bids SET status=$1 WHERE id=$2', ['approved', bidId]);
      } else {
        await db.query('UPDATE bids SET status=$1, approved_at=NOW() WHERE id=$2', ['approved', bidId]);
        await db.query('UPDATE auctions SET status=\'ended\', current_bid=$1, updated_at=NOW() WHERE id=$2', [bid.amount, bid.auction_id]);
      }

      await db.query('INSERT INTO notifications (user_id,title,message,type,related_auction_id) VALUES ($1,$2,$3,$4,$5)', [bid.bidder_id, 'Bid Approved!', `Your bid of NPR ${bid.amount} on "${bid.auction_title}" has been approved.`, 'bid_approved', bid.auction_id]);

      await db.query('COMMIT');

      try {
        const io = req.app.get('io');
        if (io) {
          io.emit('bid-approved', { auctionId: bid.auction_id, bidId: bid.id, amount: bid.amount, userId: bid.bidder_id });
        }
      } catch (e) { console.error('Emit events after bid approve failed', e); }

      return res.json({ message: 'Bid approved (legacy)', bid: { id: bid.id, amount: bid.amount, auction_id: bid.auction_id } });
    } catch (inner) {
      await db.query('ROLLBACK');
      throw inner;
    }
  } catch (error) {
    console.error('Approve bid error (enhanced):', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reject a bid
router.post('/bids/:bidId/reject', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { bidId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;

    // Get bid details
    const bidResult = await db.query(`
      SELECT b.*, a.title as auction_title, u.full_name as bidder_name
      FROM bids b
      JOIN auctions a ON b.auction_id = a.id
      JOIN users u ON b.bidder_id = u.id
      WHERE b.id = $1 AND b.status = 'pending'
    `, [bidId]);

    if (bidResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pending bid not found' });
    }

    const bid = bidResult.rows[0];

    await db.query('BEGIN');

    try {
      // Reject the bid
      await db.query(
        'UPDATE bids SET status = $1 WHERE id = $2',
        ['rejected', bidId]
      );

      // Create notification for bidder
      await db.query(`
        INSERT INTO notifications (user_id, title, message, type, related_auction_id)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        bid.bidder_id,
        'Bid Rejected',
        `Your bid of $${bid.amount} on "${bid.auction_title}" was rejected. ${reason ? 'Reason: ' + reason : ''}`,
        'bid_rejected',
        bid.auction_id
      ]);

      await db.query('COMMIT');

      res.json({
        message: 'Bid rejected successfully',
        bid: bid,
        reason: reason
      });
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Reject bid error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
