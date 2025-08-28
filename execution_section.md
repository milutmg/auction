# 4.7 Execution

The Execution stage was associated with deploying the Transparent Bidding Platform with full-stack architecture. The backend was written in Node.js, Express, and PostgreSQL database with direct SQL queries, and the frontend was written in React with TypeScript and Vite. The following are some of the most important implementation files and code snippets illustrating how the auction system was set up, API endpoints created, database models and core bidding features implemented.

## 4.7.1 Technology Stack & Architecture Files:

### Figure 40: Client-side package.json - Frontend Dependencies
```json
{
  "name": "antique-bidderly-client",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "build:dev": "vite build --mode development",
    "lint": "eslint .",
    "preview": "vite preview",
    "start": "vite preview"
  },
  "dependencies": {
    "@hookform/resolvers": "^3.9.0",
    "@radix-ui/react-accordion": "^1.2.0",
    "@radix-ui/react-alert-dialog": "^1.1.1",
    "@radix-ui/react-avatar": "^1.1.0",
    "@radix-ui/react-checkbox": "^1.1.1",
    "@radix-ui/react-dialog": "^1.1.2",
    "@radix-ui/react-dropdown-menu": "^2.1.1",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.28.0",
    "socket.io-client": "^4.8.1",
    "tailwindcss": "^3.4.14",
    "typescript": "~5.6.2",
    "vite": "^5.4.10"
  }
}
```

This file specifies all the frontend dependencies including React 18 for component-based UI, Vite for fast development and building, Tailwind CSS for responsive styling, Socket.IO client for real-time bidding communication, Radix UI components for accessible interface elements, and TypeScript for type safety in the auction application.

### Figure 41: Server-side package.json - Backend Dependencies
```json
{
  "name": "antique-bidderly-server",
  "version": "1.0.0",
  "description": "Backend server for Antique Bidderly auction platform",
  "main": "server.js",
  "type": "commonjs",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "migrate": "node scripts/migrate-enhanced-schema.js",
    "db:setup": "psql -f database/schema.sql && npm run migrate"
  },
  "dependencies": {
    "bcrypt": "^6.0.0",
    "cors": "^2.8.5",
    "dotenv": "^17.2.1",
    "express": "^5.1.0",
    "express-session": "^1.18.2",
    "helmet": "^8.0.0",
    "jsonwebtoken": "^9.0.2",
    "multer": "^1.4.5-lts.1",
    "passport": "^0.7.0",
    "pg": "^8.13.1",
    "socket.io": "^4.8.1"
  }
}
```

This configuration file lists all backend dependencies including Express.js for server framework, PostgreSQL (pg) for database operations, Socket.IO for real-time bidding communication, JWT for authentication, Multer for file uploads, Helmet for security headers, and Passport for authentication strategies.

### Figure 42: server.js - Main Entry Point Server Setup
```javascript
require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth');
const auctionRoutes = require('./routes/auctions');
const bidRoutes = require('./routes/bids');
const categoriesRoutes = require('./routes/categories');
const paymentRoutes = require('./routes/payments');
const esewaRoutes = require('./routes/esewa');

const notificationService = require('./services/notificationService');
const db = require('./config/database');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || /^http:\/\/localhost:\d+$/.test(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(helmet());
app.use(morgan('combined'));
app.use(cors({ 
  origin: true, 
  credentials: true 
}));
app.use(express.json({ limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/auctions', auctionRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/esewa', esewaRoutes);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Auction server running on port ${PORT}`);
});
```

The primary server file initializes the Express application, creates HTTP server with Socket.IO for real-time bidding, configures security middleware, sets up database connections, and establishes API routes for auction operations with proper error handling.

### Figure 43: Database Configuration File
```javascript
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'antique_auction',
  user: process.env.DB_USER || 'auction_user',
  password: process.env.DB_PASSWORD || 'auction_password',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Database connection error:', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
```

This configuration establishes PostgreSQL database connection with connection pooling, environment-based configuration, connection monitoring, and error handling to ensure reliable database operations for auction data management.

## 4.7.2 API Implementation

### Figure 44: Auction Routes Implementation
```javascript
const express = require('express');
const db = require('../config/database');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');
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
        COALESCE(SUM(CASE WHEN status = 'active' THEN COALESCE(current_bid, starting_bid) END), 0) as total_active_value
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
      overview: stats.rows[0],
      categories: categoryStats.rows
    });
  } catch (error) {
    console.error('Error fetching auction stats:', error);
    res.status(500).json({ error: 'Failed to fetch auction statistics' });
  }
});

// Create new auction
router.post('/', authenticateToken, upload.array('images', 5), async (req, res) => {
  try {
    const { title, description, starting_bid, reserve_price, category_id, duration_hours } = req.body;
    const sellerId = req.user.id;
    
    const result = await db.query(
      `INSERT INTO auctions (title, description, starting_bid, reserve_price, 
       category_id, seller_id, end_time, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending') 
       RETURNING *`,
      [title, description, starting_bid, reserve_price, category_id, sellerId, 
       new Date(Date.now() + duration_hours * 60 * 60 * 1000)]
    );

    res.status(201).json({
      message: 'Auction created successfully',
      auction: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating auction:', error);
    res.status(500).json({ error: 'Failed to create auction' });
  }
});

module.exports = router;
```

This auction routes implementation handles core auction functionality including statistics retrieval, auction creation with file uploads, authentication middleware integration, and comprehensive error handling for auction management operations.

## 4.7.3 Key Feature Implementation

### Figure 45: Authentication Middleware
```javascript
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database including role
    const result = await db.query(
      'SELECT id, email, full_name, avatar_url, role FROM users WHERE id = $1',
      [decoded.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    req.user = result.rows[0];
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

module.exports = {
  authenticateToken,
  requireRole
};
```

Implements JWT token-based authentication middleware with role-based access control, token validation, user data retrieval from database, and comprehensive error handling for secure auction operations.

### Figure 46: eSewa Payment Integration
```javascript
const crypto = require('crypto');
const { ESEWA_CONFIG, generateEsewaPaymentData, generateProductCode } = require('../config/esewa');

class EsewaPaymentService {
  
  static async initiatePayment(orderData) {
    try {
      const {
        orderId,
        auctionId,
        amount,
        auctionTitle,
        winnerEmail
      } = orderData;

      // Generate unique product code
      const productCode = generateProductCode(auctionId, orderId);

      // Prepare payment data
      const paymentData = {
        amount: amount,
        failure_url: `${process.env.FRONTEND_URL}/payment/failed`,
        product_delivery_charge: 0,
        product_service_charge: 0,
        product_code: productCode,
        signature: this.generateSignature(
          `total_amount=${amount},transaction_uuid=${productCode},product_code=${productCode}`
        ),
        signed_field_names: "total_amount,transaction_uuid,product_code",
        success_url: `${process.env.FRONTEND_URL}/payment/success`,
        tax_amount: 0,
        total_amount: amount,
        transaction_uuid: productCode
      };

      return {
        paymentUrl: ESEWA_CONFIG.PAYMENT_URL,
        paymentData: paymentData,
        productCode: productCode
      };
    } catch (error) {
      console.error('eSewa payment initiation error:', error);
      throw new Error('Failed to initiate eSewa payment');
    }
  }

  static generateSignature(message) {
    const secret = process.env.ESEWA_SECRET_KEY;
    return crypto.createHmac('sha256', secret).update(message).digest('base64');
  }

  static async verifyPayment(verificationData) {
    try {
      const { transaction_code, status, total_amount, transaction_uuid } = verificationData;
      
      // Verify signature
      const message = `transaction_code=${transaction_code},status=${status},total_amount=${total_amount},transaction_uuid=${transaction_uuid}`;
      const expectedSignature = this.generateSignature(message);
      
      if (expectedSignature === verificationData.signature) {
        return { verified: true, transactionId: transaction_code };
      }
      
      return { verified: false, error: 'Invalid signature' };
    } catch (error) {
      console.error('eSewa payment verification error:', error);
      return { verified: false, error: 'Verification failed' };
    }
  }
}

module.exports = EsewaPaymentService;
```

Integrates eSewa payment gateway with signature generation, payment initiation, transaction verification, and secure callback handling for auction payment processing.

## 4.7.4 Frontend Implementation

### Figure 47: Main React Application Entry Point
```tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { Toaster } from './components/ui/toaster';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Import pages
import Index from './pages/Index';
import Auth from './pages/Auth';
import Auctions from './pages/Auctions';
import AuctionDetail from './pages/AuctionDetail';
import CreateAuction from './pages/CreateAuction';
import LiveBidding from './pages/LiveBidding';
import UserDashboard from './pages/UserDashboard';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentFailed from './pages/PaymentFailed';
import AdminDashboard from './pages/AdminDashboard';

// Import layout components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container mx-auto px-4 py-8">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/auctions" element={<Auctions />} />
                <Route path="/auctions/:id" element={<AuctionDetail />} />
                <Route path="/live-bidding/:id" element={<LiveBidding />} />
                <Route path="/payment/success" element={<PaymentSuccess />} />
                <Route path="/payment/failed" element={<PaymentFailed />} />
                
                <Route path="/create-auction" element={
                  <ProtectedRoute>
                    <CreateAuction />
                  </ProtectedRoute>
                } />
                
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <UserDashboard />
                  </ProtectedRoute>
                } />
                
                <Route path="/admin" element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
              </Routes>
            </main>
            <Footer />
            <Toaster />
          </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
```

The root React component establishes routing for auction pages, authentication and socket context providers for real-time functionality, protected routes for secure access, and the overall application structure with navigation and layout components.

### Figure 48: Socket Context for Real-time Communication
```tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinAuctionRoom: (auctionId: string) => void;
  leaveAuctionRoom: (auctionId: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const newSocket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:5000', {
        auth: {
          userId: user.id
        }
      });

      newSocket.on('connect', () => {
        console.log('Connected to auction server');
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from auction server');
        setIsConnected(false);
      });

      newSocket.on('bid_update', (data) => {
        console.log('New bid received:', data);
        // Handle real-time bid updates
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [user]);

  const joinAuctionRoom = (auctionId: string) => {
    if (socket) {
      socket.emit('join_auction', auctionId);
    }
  };

  const leaveAuctionRoom = (auctionId: string) => {
    if (socket) {
      socket.emit('leave_auction', auctionId);
    }
  };

  return (
    <SocketContext.Provider value={{
      socket,
      isConnected,
      joinAuctionRoom,
      leaveAuctionRoom
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
```

Implements real-time communication using Socket.IO for live bidding updates, auction room management, connection handling, and context-based state management for seamless real-time auction participation.

## 4.7.5 Configuration and Security

### Figure 49: Environment Configuration
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=antique_auction
DB_USER=auction_user
DB_PASSWORD=auction_password

# JWT Configuration
JWT_SECRET=your_jwt_secret_here_very_secure_random_string
JWT_EXPIRES_IN=7d

# eSewa Payment Gateway
ESEWA_MERCHANT_ID=EPAYTEST
ESEWA_SECRET_KEY=8gBm/:&EnhH.1/q
ESEWA_PAYMENT_URL=https://uat.esewa.com.np/epay/main

# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# File Upload
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880

# Email Configuration (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

Environment configuration isolates sensitive data including database credentials, JWT secrets, payment gateway settings, and service configurations to ensure security and deployment flexibility across different environments.

This execution section demonstrates the comprehensive implementation of the Transparent Bidding Platform, showcasing the integration of modern web technologies, real-time communication, secure payment processing, and robust authentication systems for a complete auction experience.

## 4.7.6 API Composition (Main Router)

The API surface is composed in the main server entry and mounts feature routers under a consistent `/api/*` namespace. This keeps concerns separated while giving clients a predictable base path.

```javascript
// server/server.js (router composition excerpt)
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
```

Explanation: Feature routers are registered under clear prefixes. Payments have both a stable v1 route and an enhanced v2 surface to enable incremental rollout.

[Screenshot placeholder: Thunder Client/Postman showing grouped `/api/*` routes responding (200) from local server]

---

## 4.7.7 Data Model Schema: Auctions (PostgreSQL)

The platform uses SQL-first models. The auctions domain is defined in the schema ensuring constraints, defaults, and indexing for query performance.

```sql
-- server/database/schema.sql (auctions table excerpt)
CREATE TABLE IF NOT EXISTS auctions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    starting_bid DECIMAL(10,2) NOT NULL,
    current_bid DECIMAL(10,2),
    reserve_price DECIMAL(10,2),
    estimated_value_min DECIMAL(10,2),
    estimated_value_max DECIMAL(10,2),
    category_id UUID REFERENCES categories(id),
    seller_id UUID REFERENCES users(id) NOT NULL,
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'active', 'ended', 'cancelled', 'rejected', 'paused')),
    approval_status VARCHAR(30) DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    bid_increment DECIMAL(10,2) DEFAULT 1.00,
    auto_extend_minutes INTEGER DEFAULT 5,
    payment_deadline_hours INTEGER DEFAULT 72,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Why this matters: validations live in the database, reducing application logic for status transitions, and indexes complement frequent queries (by status/category/seller). Triggers update `current_bid` and timestamps for data integrity.

[Screenshot placeholder: psql console showing `\d auctions` and a sample `SELECT * FROM auctions LIMIT 5;`]

---

## 4.7.8 File Upload Middleware (Images)

Images for listings are validated and stored via Multer. Only common image MIME types are accepted, with UUID filenames to avoid collisions.

```javascript
// server/middleware/upload.js
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_DIR || 'uploads');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error('Invalid file type. Only images are allowed.');
    error.code = 'INVALID_FILE_TYPE';
    cb(error, false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024, files: 5 }
});

module.exports = {
  single: (fieldName) => upload.single(fieldName),
  multiple: (fieldName, maxCount = 5) => upload.array(fieldName, maxCount),
  fields: (fields) => upload.fields(fields)
};
```

Usage example: `router.post('/', authenticateToken, upload.multiple('images', 5), handler)` ensures server-side validation and consistent storage. Static serving is configured via `app.use('/uploads', express.static(uploadsDir))`.

[Screenshot placeholder: Network tab showing multipart/form-data request with 2 images and 201 response payload containing stored filenames]

---

## 4.7.9 Frontend Build and Dev Server (Vite)

The client uses Vite + React SWC for fast DX, path aliases, and predictable dev ports for Socket.IO/CORS.

```ts
// client/vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 8080,
    strictPort: false,
    open: false,
    cors: true,
    hmr: { port: 8080, host: "localhost" }
  },
  preview: { host: "0.0.0.0", port: 4173, strictPort: false, cors: true },
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  build: { outDir: "dist", assetsDir: "assets", sourcemap: mode === "development" },
  define: { __DEV__: mode === "development" },
}));
```

Notes: The alias `@` simplifies imports, and HMR settings are aligned with the server CORS rules in `server.js`. This avoids WebSocket mixed-origin issues during local development.

[Screenshot placeholder: Vite dev console showing compiled modules and hot updates; app running at http://localhost:8080]

---

## 4.7.10 Suggested Screens to Showcase (Execution)

- API router map in a REST client hitting: `/api/health`, `/api/auctions/stats`, `/api/search?q=watch`
- Auction creation form with image uploads and the corresponding network multipart request
- Live bidding page with two browsers placing bids and real-time updates via Socket.IO
- Admin dashboard approving an auction and the status transition reflected in DB
- eSewa payment redirect flow and success callback updating order status

[Screenshot placeholder: Collage of key flows with captions and timestamps]

---

## 4.7.11 Auction Item Listing Component (AuctionCard)

Displays each auction with thumbnail, current/starting bid, time left, bid count, and seller badge. Uses design system components and router links.

```tsx
// client/src/components/auctions/AuctionCard.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Activity, User } from 'lucide-react';
import { GlassmorphicCard } from '@/components/ui/GlassmorphicCard';
import { cn } from '@/lib/utils';

export interface AuctionItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  currentBid: number;
  startingBid: number;
  timeLeft: string;
  category: string;
  bids: number;
  featured?: boolean;
  seller: { name: string; verified: boolean };
}

interface AuctionCardProps {
  auction: AuctionItem;
  className?: string;
}

export default function AuctionCard({ auction, className }: AuctionCardProps) {
  return (
    <GlassmorphicCard
      variant={auction.featured ? 'premium' : 'default'}
      hover="lift"
      shadow="sm"
      className={cn('overflow-hidden h-full', className)}
    >
      <Link to={`/auction/${auction.id}`} className="block h-full">
        <div className="relative">
          <div className="aspect-[4/3] overflow-hidden">
            <img
              src={auction.imageUrl || '/placeholder.svg'}
              alt={auction.title}
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
            />
          </div>
          {auction.featured && (
            <div className="absolute top-3 left-3 bg-gold/90 text-white text-xs font-semibold py-1 px-2 rounded-sm">
              Featured
            </div>
          )}
          <div className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm text-xs font-medium py-1 px-2 rounded-sm">
            {auction.category}
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <h3 className="font-display font-semibold text-lg line-clamp-1">{auction.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{auction.description}</p>
          </div>
          <div className="flex items-center text-sm">
            <User className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
            <span className="text-muted-foreground flex items-center">
              {auction.seller.name}
              {auction.seller.verified && (
                <span className="ml-1 bg-blue-500/20 text-blue-500 text-xs py-0.5 px-1 rounded">Verified</span>
              )}
            </span>
          </div>
          <div className="space-y-2 pt-2 border-t border-border">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Current Bid</span>
              <span className="font-semibold text-gold">${auction.currentBid.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Starting Bid</span>
              <span className="text-sm">${auction.startingBid.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5 mr-1" />
                {auction.timeLeft}
              </div>
              <div className="flex items-center text-sm">
                <Activity className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                <span>{auction.bids} bids</span>
              </div>
            </div>
          </div>
          <div className="pt-2">
            <div className="w-full py-2 text-center bg-gold hover:bg-gold-dark text-white font-medium rounded-md transition-colors">
              View Details
            </div>
          </div>
        </div>
      </Link>
    </GlassmorphicCard>
  );
}
```

Notes: The component is presentation-focused. It pairs with list pages that map server data into the `AuctionItem` view model.

[Screenshot placeholder: Auctions grid with multiple AuctionCard tiles and hover states]

---

## 4.7.12 API Integration Services (Client)

Typed client wrapper centralizes base URL, auth headers, retries with timeouts, and domain-specific helpers.

```ts
// client/src/services/api.ts (highlights)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const REQUEST_TIMEOUT = 10000;

class ApiService {
  private baseURL: string = API_BASE_URL;

  private async fetchWithRetry(url: string, options: RequestInit, retries = MAX_RETRIES): Promise<Response> { /* ...retry + timeout... */ }
  private getHeaders(includeAuth = true): HeadersInit { /* ...adds JSON + Authorization... */ }
  private async handleResponse(response: Response) { /* ...throws on !ok, returns JSON... */ }

  // Auth
  async signup(data: { email: string; password: string; fullName: string }) { /* POST /auth/signup */ }
  async signin(data: { email: string; password: string }) { /* POST /auth/signin */ }
  async getProfile() { /* GET /auth/profile */ }

  // Auctions
  async getAuctions(params?: { category?: string; status?: string; page?: number; limit?: number; search?: string; }) { /* GET /auctions with query */ }
  async getAuction(id: string) { /* GET /auctions/:id (public) */ }
  async createAuction(data: any) { /* POST /auctions (JSON) */ }
  async updateAuction(id: string, data: any) { /* PUT /auctions/:id */ }
  async deleteAuction(id: string) { /* DELETE /auctions/:id */ }

  // Bids
  async placeBid(auctionId: string, amount: number) { /* POST /bids */ }
  async getBids(auctionId: string) { /* GET /bids/:auctionId (public) */ }

  // Categories
  async getCategories() { /* GET /categories */ }

  // File uploads (helper)
  async uploadFile(file: File, endpoint: string) { /* multipart/form-data with token */ }

  // Orders and eSewa
  async createOrder(auctionId: string) { /* POST /auctions/:id/order */ }
  async getOrderDetails(orderId: string) { /* GET /auctions/order/:orderId */ }
  async initiateEsewaPayment(orderId: string) { /* POST /auctions/order/:orderId/payment/esewa/initiate */ }

  // Admin (examples)
  async approveAuction(auctionId: string) { /* POST /admin/auctions/:id/approve */ }
  async rejectAuction(auctionId: string, reason?: string) { /* POST /admin/auctions/:id/reject */ }
}

export const apiService = new ApiService();
export default apiService;
```

Notes:
- Configure `VITE_API_URL` to your server, e.g. `http://localhost:3001/api` in development.
- For listing image uploads, prefer a FormData-based create flow to match `upload.multiple('images')` on the server.

[Screenshot placeholder: Browser DevTools Network tab showing `GET /api/auctions?page=1` and `POST /api/bids` with 200 responses]

---

## 4.7.13 eSewa Minimal Standalone Sample (Express)

The following is a cleaned, environment-driven standalone sample based on the provided snippet. It uses UAT endpoints by default, moves all secrets to environment variables, validates inputs, and returns a redirect URL that the frontend can open.

```javascript
// server/routes/payments-esewa.js (standalone-style sample)
const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const path = require('path');

const router = express.Router();

// UAT defaults; override in production via env
const BASE_URL = process.env.ESEWA_PAYMENT_URL || 'https://rc-epay.esewa.com.np/api/epay/main/v2/form';
const STATUS_CHECK = process.env.ESEWA_STATUS_URL || 'https://rc.esewa.com.np/api/epay/transaction/status/';
const SECRET_KEY = process.env.ESEWA_SECRET_KEY; // required
const PRODUCT_CODE = process.env.ESEWA_MERCHANT_ID || 'EPAYTEST'; // UAT default
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8080';

function hmac(message) {
  return crypto.createHmac('sha256', SECRET_KEY).update(message).digest('base64');
}

// Initiate payment: returns redirect URL and transaction UUID
router.post('/pay', async (req, res) => {
  try {
    const { amount, tax_amount = 0, product_service_charge = 0, product_delivery_charge = 0 } = req.body || {};
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ status: false, message: 'Amount must be greater than 0.' });
    }

    const total_amount = Number(amount) + Number(tax_amount) + Number(product_service_charge) + Number(product_delivery_charge);
    const transaction_uuid = Date.now().toString();

    // Signature per eSewa docs: signed_field_names must match the message fields
    const message = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${PRODUCT_CODE}`;
    const signature = hmac(message);

    const paymentData = {
      amount: Number(amount),
      tax_amount: Number(tax_amount),
      total_amount: Number(total_amount),
      product_service_charge: Number(product_service_charge),
      product_delivery_charge: Number(product_delivery_charge),
      transaction_uuid,
      product_code: PRODUCT_CODE,
      success_url: `${FRONTEND_URL}/payment/success?tx=${transaction_uuid}`,
      failure_url: `${FRONTEND_URL}/payment/failed?tx=${transaction_uuid}`,
      signed_field_names: 'total_amount,transaction_uuid,product_code',
      signature
    };

    // Request form URL from eSewa. We capture redirect target for SPA to handle client-side navigation.
    const response = await axios.post(
      BASE_URL,
      new URLSearchParams(paymentData).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, maxRedirects: 0, validateStatus: s => s >= 200 && s < 400 }
    );

    const redirectUrl = response.headers.location || response.request?.res?.responseUrl;
    return res.status(200).json({ status: true, redirectUrl, transaction_uuid });
  } catch (error) {
    const msg = error?.response?.data || error.message || 'Payment initiation failed';
    return res.status(500).json({ status: false, message: msg });
  }
});

// Success callback handler (server-side verification)
router.get('/callback/success', async (req, res) => {
  try {
    const encodedData = req.query.data; // eSewa sends base64-encoded JSON in `data`
    if (!encodedData) return res.status(400).json({ status: false, message: 'Missing callback payload' });

    const decoded = JSON.parse(Buffer.from(encodedData, 'base64').toString('utf-8'));
    // decoded fields usually include: status, transaction_uuid, total_amount, product_code, signed_field_names, signature, etc.

    // If signature provided, verify it
    if (decoded.signature && decoded.signed_field_names) {
      const signedFields = decoded.signed_field_names.split(',');
      const message = signedFields.map(f => `${f}=${decoded[f]}`).join(',');
      const expected = hmac(message);
      if (expected !== decoded.signature) {
        return res.status(400).json({ status: false, message: 'Invalid signature' });
      }
    }

    // Cross-verify with eSewa status API (authoritative check)
    const amt = Number(String(decoded.total_amount).replace(/,/g, ''));
    const { data } = await axios.get(STATUS_CHECK, {
      headers: { Accept: 'application/json' },
      params: { product_code: PRODUCT_CODE, total_amount: amt, transaction_uuid: decoded.transaction_uuid }
    });

    if (data?.status !== 'COMPLETE') {
      return res.status(400).json({ status: false, message: 'Payment not complete', details: data });
    }

    // TODO: persist order/payment in DB here (auctionId, buyerId, ref_id = data.ref_id, amount = data.total_amount)
    return res.status(200).json({ status: true, message: 'Payment verified', transaction: data });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message || 'Verification failed' });
  }
});

// Failure handler
router.get('/callback/failure', (req, res) => {
  return res.status(400).json({ status: false, message: 'Transaction failed or cancelled' });
});

module.exports = router;
```

Usage in the server entry (already present in this project):

```javascript
// server/server.js
// ...existing code...
const esewaRoutes = require('./routes/esewa'); // or the sample above as './routes/payments-esewa'
app.use('/api/esewa', esewaRoutes);
// ...existing code...
```

Required environment variables (.env):

```env
ESEWA_MERCHANT_ID=EPAYTEST                # UAT merchant/product code
ESEWA_SECRET_KEY=8gBm/:&EnhH.1/q          # UAT secret key (replace in prod)
ESEWA_PAYMENT_URL=https://rc-epay.esewa.com.np/api/epay/main/v2/form
ESEWA_STATUS_URL=https://rc.esewa.com.np/api/epay/transaction/status/
FRONTEND_URL=http://localhost:8080        # Where success/failure pages live
```

Notes and differences vs the pasted snippet:
- Secrets moved to environment variables; UAT endpoints provided with production comments.
- Returns a JSON object with redirectUrl for SPA navigation; optionally you can `res.redirect(redirectUrl)` if serving a classic web app.
- Signature verification checks eSewa’s provided `signature` when present; status API is used as the authoritative check.
- Avoids comparing two locally computed HMACs; instead validates the actual callback payload or status response.
- Replace placeholder TODO with DB persistence for orders/payments linked to auctions and users.

[Screenshot placeholder: Terminal showing `POST /api/esewa/pay` -> 200 with redirectUrl; Network tab opening the eSewa UAT form]
