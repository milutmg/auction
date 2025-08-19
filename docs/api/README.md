# Antique Bidderly API Documentation

## Overview
This document describes the REST API endpoints for the Antique Bidderly auction platform.

## Base URL
- Development: `http://localhost:5000/api`
- Production: `https://your-domain.com/api`

## Authentication
Most endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/logout` - Logout user
- `GET /auth/profile` - Get current user profile
- `GET /auth/google` - Google OAuth login

### Auctions
- `GET /auctions` - Get all auctions (with filtering)
- `GET /auctions/:id` - Get auction by ID
- `POST /auctions` - Create new auction (auth required)
- `PUT /auctions/:id` - Update auction (auth required, owner only)
- `DELETE /auctions/:id` - Delete auction (auth required, owner only)

### Bids
- `GET /auctions/:id/bids` - Get bids for auction
- `POST /auctions/:id/bids` - Place bid (auth required)

### Admin
- `GET /admin/users` - Get all users (admin only)
- `GET /admin/auctions` - Get all auctions with admin details
- `PUT /admin/users/:id/role` - Update user role (admin only)

## WebSocket Events

### Client to Server
- `join_auction` - Join auction room
- `leave_auction` - Leave auction room
- `place_bid` - Place a bid

### Server to Client
- `bid_update` - New bid placed
- `auction_update` - Auction status updated
- `error` - Error message
