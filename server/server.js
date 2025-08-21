require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const session = require('express-session');
const passport = require('./config/passport');

// Import routes
const authRoutes = require('./routes/auth');
const auctionRoutes = require('./routes/auctions');
const bidRoutes = require('./routes/bids');
const bidRequestRoutes = require('./routes/bid-requests');
const categoriesRoutes = require('./routes/categories');
const adminRoutes = require('./routes/admin');
const notificationRoutes = require('./routes/notifications');
const notificationsApi = require('./routes/notifications');
const paymentRoutes = require('./routes/payments');
const esewaRoutes = require('./routes/esewa');
const adminBidsRoutes = require('./routes/admin-bids');
const searchRoutes = require('./routes/search');
const usersRoutes = require('./routes/users');
const paymentsEnhancedRoutes = require('./routes/payments-enhanced');

const notificationService = require('./services/notificationService');
const db = require('./config/database');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: (origin, callback) => {
      // Allow requests from any localhost port or no origin (for mobile apps)
      if (!origin || /^http:\/\/localhost:\d+$/.test(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ["GET", "POST"],
    credentials: true
  },
  allowEIO3: true
});

// Middleware - Dynamic CORS for development
app.use(cors({ 
  origin: (origin, callback) => {
    // Allow requests from any localhost port or no origin (for mobile apps)
    if (!origin || /^http:\/\/localhost:\d+$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true 
}));
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "ws:", "wss:"],
    },
  },
}));
app.use(morgan('dev'));
app.use(express.json());

// Session configuration for passport
app.use(session({
  secret: process.env.JWT_SECRET || 'fallback-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, process.env.UPLOAD_DIR || 'uploads');
const fs = require('fs');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve static files
app.use('/uploads', express.static(uploadsDir));

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Antique Auction API is running!' });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Make io available to all routes
app.set('io', io);

app.use('/api/auth', authRoutes);
app.use('/api/auctions', auctionRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/bid-requests', bidRequestRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/notifications', notificationsApi);
app.use('/api/payments', paymentRoutes);
app.use('/api/esewa', esewaRoutes);
app.use('/api/admin', adminBidsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/payments-v2', paymentsEnhancedRoutes);

// Manual admin endpoint to trigger ended auction processing (testing)
app.post('/api/admin/process-ended-auctions', async (req, res) => {
  try {
    // Simple auth: require admin token if available
    // If authenticateToken middleware not globally applied here, rely on role check via optional header decode if implemented elsewhere.
    // For safety, only allow in non-production unless proper auth integrated.
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'Disabled in production' });
    }
    await processEndedAuctions();
    res.json({ status: 'ok', message: 'Ended auctions processed' });
  } catch (e) {
    console.error('manual processEndedAuctions error', e);
    res.status(500).json({ error: 'Failed to process ended auctions' });
  }
});

// Initialize notification service with io
notificationService.setSocketIO(io);

// Function to process ended auctions
async function processEndedAuctions() {
  try {
    // Find auctions that have ended but are still marked as active
    const endedAuctionsResult = await db.query(`
      SELECT id, title, current_bid, seller_id
      FROM auctions 
      WHERE status = 'active' 
        AND end_time < NOW()
        AND approval_status = 'approved'
    `);

    for (const auction of endedAuctionsResult.rows) {
      // Get the highest approved bid for this auction
      const highestBidResult = await db.query(`
        SELECT bidder_id, amount 
        FROM bids 
        WHERE auction_id = $1 AND status = 'approved'
        ORDER BY amount DESC 
        LIMIT 1
      `, [auction.id]);

      if (highestBidResult.rows.length > 0) {
        const winningBid = highestBidResult.rows[0];
        
        // Update auction status to ended and set final bid
        await db.query(`
          UPDATE auctions 
          SET status = 'ended', 
              current_bid = $1,
              updated_at = NOW()
          WHERE id = $2
        `, [winningBid.amount, auction.id]);

        // Create order for the winner
        await db.query(`
          INSERT INTO orders (auction_id, winner_id, final_amount, status, payment_deadline)
          VALUES ($1, $2, $3, 'pending', NOW() + INTERVAL '48 hours')
        `, [auction.id, winningBid.bidder_id, winningBid.amount]);

        // Notify the winner
        await db.query(`
          INSERT INTO notifications (user_id, type, title, message, related_auction_id)
          VALUES ($1, 'auction_won', 'Congratulations! You won the auction!', 
                  'You won the auction "${auction.title}" with a bid of $${winningBid.amount}. Please complete your payment within 48 hours.', $2)
        `, [winningBid.bidder_id, auction.id]);

        // Notify the seller
        await db.query(`
          INSERT INTO notifications (user_id, type, title, message, related_auction_id)
          VALUES ($1, 'auction_ended', 'Your auction has ended', 
                  'Your auction "${auction.title}" has ended with a winning bid of $${winningBid.amount}.', $2)
        `, [auction.seller_id, auction.id]);

        console.log(`Auction ${auction.id} (${auction.title}) ended with winning bid: $${winningBid.amount}`);
      } else {
        // No bids, just mark as ended
        await db.query(`
          UPDATE auctions 
          SET status = 'ended', 
              updated_at = NOW()
          WHERE id = $1
        `, [auction.id]);

        // Notify the seller that auction ended with no bids
        await db.query(`
          INSERT INTO notifications (user_id, type, title, message, related_auction_id)
          VALUES ($1, 'auction_ended', 'Your auction has ended', 
                  'Your auction "${auction.title}" has ended with no bids.', $2)
        `, [auction.seller_id, auction.id]);

        console.log(`Auction ${auction.id} (${auction.title}) ended with no bids`);
      }
    }

    return endedAuctionsResult.rows.length;
  } catch (error) {
    console.error('Error processing ended auctions:', error);
    throw error;
  }
}

// Socket.IO for real-time bidding
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join auction room
  socket.on('join-auction', (auctionId) => {
    socket.join(`auction-${auctionId}`);
    console.log(`User ${socket.id} joined auction ${auctionId}`);
    
    // Send current auction state to the user
    socket.emit('auction-joined', {
      auctionId,
      message: `Joined auction ${auctionId}`,
      timestamp: new Date().toISOString()
    });
  });

  // Leave auction room
  socket.on('leave-auction', (auctionId) => {
    socket.leave(`auction-${auctionId}`);
    console.log(`User ${socket.id} left auction ${auctionId}`);
  });

  // Handle new bid (emit to all users in auction room including sender)
  socket.on('new-bid', async (data) => {
    console.log('New bid received:', data);
    
    // Validate bid data
    if (!data.auctionId || !data.amount || !data.userId) {
      socket.emit('bid-error', {
        message: 'Invalid bid data',
        timestamp: new Date().toISOString()
      });
      return;
    }

    try {
      // Get auction details and previous bidders
      const auctionResult = await db.query(
        'SELECT title, current_bid FROM auctions WHERE id = $1',
        [data.auctionId]
      );
      
      if (auctionResult.rows.length === 0) {
        socket.emit('bid-error', {
          message: 'Auction not found',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const auction = auctionResult.rows[0];
      
      // Get previous bidders who should be notified of being outbid
      const previousBiddersResult = await db.query(
        `SELECT DISTINCT b.bidder_id, u.full_name, u.email
         FROM bids b
         JOIN users u ON b.bidder_id = u.id
         WHERE b.auction_id = $1 AND b.bidder_id != $2
         ORDER BY b.created_at DESC`,
        [data.auctionId, data.userId]
      );

      // Add server timestamp
      const bidData = {
        ...data,
        serverTimestamp: new Date().toISOString(),
        id: `bid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };

      // Emit to all users in the auction room (including sender)
      io.to(`auction-${data.auctionId}`).emit('bid-update', bidData);
      
      // Emit auction update with new current bid
      io.to(`auction-${data.auctionId}`).emit('auction-update', {
        auctionId: data.auctionId,
        currentBid: data.amount,
        lastBidder: data.bidderName,
        timestamp: new Date().toISOString()
      });

      // Store bid in database with pending status
      try {
        const bidResult = await db.query(
          'INSERT INTO bids (auction_id, bidder_id, amount, status) VALUES ($1, $2, $3, $4) RETURNING *',
          [data.auctionId, data.userId, data.amount, 'pending']
        );
        
        // Don't update auction current bid until approved
        console.log('Bid stored with pending status:', bidResult.rows[0]);
        
        // Emit real-time stats update
        const statsResult = await db.query(`
          SELECT 
            (SELECT COUNT(*) FROM users) as total_users,
            (SELECT COUNT(*) FROM auctions WHERE status = 'active') as active_auctions,
            (SELECT COUNT(*) FROM bids) as total_bids,
            (SELECT COALESCE(SUM(current_bid), 0) FROM auctions WHERE status = 'ended') as revenue
        `);
        
        io.emit('stats-update', statsResult.rows[0]);
        
        console.log('Bid saved to database:', bidResult.rows[0]);
      } catch (dbError) {
        console.error('Database error:', dbError);
      }

      // Create notifications for outbid users
      for (const previousBidder of previousBiddersResult.rows) {
        try {
          // Insert notification into database
          await db.query(`
            INSERT INTO notifications (user_id, title, message, type, related_auction_id)
            VALUES ($1, $2, $3, $4, $5)
          `, [
            previousBidder.bidder_id,
            'You have been outbid!',
            `${data.bidderName} placed a higher bid of $${data.amount} on "${auction.title}"`,
            'outbid',
            data.auctionId
          ]);
          
          // Emit real-time notification
          io.emit('new-notification', {
            userId: previousBidder.bidder_id,
            type: 'outbid',
            title: 'You have been outbid!',
            message: `${data.bidderName} placed a higher bid of $${data.amount} on "${auction.title}"`,
            auction_id: data.auctionId,
            auction_title: auction.title,
            created_at: new Date().toISOString(),
            read: false
          });
        } catch (notificationError) {
          console.error('Failed to create notification:', notificationError);
        }
      }
      
      // Log successful bid
      console.log(`Bid processed for auction ${data.auctionId}: $${data.amount} by ${data.bidderName}`);
      
    } catch (error) {
      console.error('Error processing bid:', error);
      socket.emit('bid-error', {
        message: 'Failed to process bid',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Debugging endpoint to manually mark an auction as ended
  socket.on('debug-mark-auction-ended', async ({ auctionId }) => {
    // legacy: no payment_events creation
    try {
      await db.query(`UPDATE auctions SET status='ended' WHERE id=$1`, [auctionId]);
    } catch (e) { console.error('debug end auction error', e); }
  });

  // Handle connection errors
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  socket.on('disconnect', (reason) => {
    console.log('User disconnected:', socket.id, 'Reason:', reason);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  
  // Start scheduled job to process ended auctions every minute
  setInterval(async () => {
    try {
      const processedCount = await processEndedAuctions();
      if (processedCount > 0) {
        console.log(`Processed ${processedCount} ended auctions`);
      }
    } catch (error) {
      console.error('Scheduled auction processing error:', error);
    }
  }, 60000); // Run every minute
});

// Export io instance for use in other modules
module.exports = { io };
