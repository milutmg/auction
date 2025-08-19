# 🏺 Antique Bidderly - Auction Platform

A full-stack auction platform for antique items with real-time bidding capabilities.

## 📁 Clean Project Structure

```
antique-bidderly-1/
├── client/              # Frontend (React + Vite + TypeScript)
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── contexts/    # React contexts (Auth, Socket)
│   │   ├── services/    # API services
│   │   └── hooks/       # Custom React hooks
│   ├── public/          # Static assets
│   └── package.json     # Frontend dependencies
│
├── server/              # Backend (Node.js + Express + PostgreSQL)
│   ├── routes/          # API routes
│   ├── config/          # Database and auth config
│   ├── middleware/      # Express middleware
│   ├── utils/           # Utility functions
│   └── package.json     # Backend dependencies
│
├── shared/              # Shared TypeScript types
│   ├── types/           # Type definitions
│   ├── constants/       # Shared constants
│   └── utils/           # Shared utilities
│
├── docs/                # Documentation
├── logs/                # Application logs
└── debug-*.sh          # Debug and utility scripts
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- PostgreSQL
- npm

### Setup
```bash
# 1. Install backend dependencies
cd server && npm install

# 2. Install frontend dependencies  
cd ../client && npm install

# 3. Start development servers
cd .. && ./start-dev.sh
```

### Development URLs
- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3001

## 🔐 Test Credentials

| Email | Password | Role |
|-------|----------|------|
| `test@example.com` | `password123` | user |
| `admin@example.com` | `password123` | admin |
| `demo@auction.com` | `password123` | user |

## 🛠️ Development Scripts

```bash
./start-dev.sh          # Start both servers
./stop-dev.sh           # Stop all servers
./test-login.sh         # Test login system
./debug-registration.sh # Debug registration issues
```

## ✨ Features
- ✅ User authentication (signup/signin)
- ✅ Real-time bidding with WebSockets
- ✅ Auction management
- ✅ Admin dashboard
- ✅ Responsive design
- ✅ Password validation
- ✅ Dynamic CORS handling

## 📞 Support

If you encounter issues:
1. Check `logs/server.log` and `logs/client.log`
2. Run `./debug-registration.sh`
3. Ensure PostgreSQL is running
