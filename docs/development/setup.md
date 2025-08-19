# Development Setup

## Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- Git

## Environment Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd antique-bidderly-1
```

### 2. Install Dependencies
```bash
# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

### 3. Database Setup
```bash
# Create PostgreSQL database
createdb antique_bidderly

# Run schema
psql -d antique_bidderly -f server/database/schema.sql
```

### 4. Environment Variables

#### Client (.env)
```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

#### Server (.env)
```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://username:password@localhost:5432/antique_bidderly
JWT_SECRET=your-super-secret-jwt-key
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-secret
SESSION_SECRET=your-session-secret
```

### 5. Run Development Servers
```bash
# Terminal 1 - Server
cd server
npm run dev

# Terminal 2 - Client  
cd client
npm run dev
```

## Project Structure
```
├── client/          # React frontend
├── server/          # Node.js backend
├── shared/          # Shared types and utilities
├── docs/            # Documentation
└── supabase/        # Database migrations (if using Supabase)
```

## Available Scripts

### Client
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Server
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm test` - Run tests
```
