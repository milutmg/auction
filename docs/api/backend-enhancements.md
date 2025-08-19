# Backend Database and API Enhancements

## Overview
This document outlines the backend changes made to support the enhanced sign-up functionality and improved user management.

## 🗄️ Database Schema Changes

### Enhanced Users Table
New columns added to the `users` table:

```sql
-- Email verification and security
email_verified_at TIMESTAMP
email_verification_token VARCHAR(255)
password_reset_token VARCHAR(255)
password_reset_expires TIMESTAMP

-- Account security
login_attempts INTEGER DEFAULT 0
locked_until TIMESTAMP
two_factor_enabled BOOLEAN DEFAULT false
two_factor_secret VARCHAR(32)

-- User preferences and profile
profile_completion_percentage INTEGER DEFAULT 0
preferred_language VARCHAR(10) DEFAULT 'en'
timezone VARCHAR(50) DEFAULT 'UTC'
marketing_emails BOOLEAN DEFAULT true
bidding_notifications BOOLEAN DEFAULT true
outbid_notifications BOOLEAN DEFAULT true
```

### New Tables

#### `user_activities`
Tracks user actions for security and analytics:
```sql
- id (UUID, PK)
- user_id (UUID, FK to users)
- activity_type (VARCHAR) -- 'login', 'signup', 'bid', etc.
- ip_address (INET)
- user_agent (TEXT)
- location_country (VARCHAR)
- location_city (VARCHAR)
- details (JSONB)
- created_at (TIMESTAMP)
```

#### `user_preferences`
Stores user-specific preferences:
```sql
- id (UUID, PK)
- user_id (UUID, FK to users, UNIQUE)
- theme (VARCHAR) -- 'light', 'dark', 'auto'
- currency (VARCHAR) DEFAULT 'USD'
- bid_increment_preference (DECIMAL)
- auto_refresh_auctions (BOOLEAN)
- sound_notifications (BOOLEAN)
- desktop_notifications (BOOLEAN)
- created_at, updated_at (TIMESTAMP)
```

#### `email_verifications`
Manages email verification process:
```sql
- id (UUID, PK)
- user_id (UUID, FK to users)
- email (VARCHAR)
- token (VARCHAR, UNIQUE)
- expires_at (TIMESTAMP)
- verified_at (TIMESTAMP)
- created_at (TIMESTAMP)
```

### New Database Functions

#### `calculate_profile_completion(user_id UUID)`
Calculates profile completion percentage based on:
- Email (20%)
- Full name (20%)
- Avatar (15%)
- Phone (10%)
- Address (10%)
- Email verification (15%)
- Google account linked (10%)

#### `log_user_activity(...)`
Logs user activities for security monitoring and analytics.

#### `cleanup_expired_tokens()`
Cleans up expired verification and reset tokens.

## 🔒 Enhanced API Security

### Input Validation
- **Email validation**: Format, length, domain validation
- **Password strength**: 8+ chars, uppercase, lowercase, numbers
- **Name validation**: 2-100 chars, letters/spaces/hyphens only
- **Common password detection**: Prevents weak passwords

### Rate Limiting
- **Signup**: 3 attempts per 15 minutes per IP
- **Login**: 5 attempts per 15 minutes per IP

### Security Features
- **User agent validation**: Detects suspicious bot activity
- **Password strength scoring**: 5-level strength indicator
- **Activity logging**: Tracks all user actions with IP/UA
- **Transaction safety**: Database transactions for data integrity

## 📡 API Endpoints Changes

### Enhanced `POST /api/auth/signup`

#### Request Body:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "fullName": "John Doe"
}
```

#### Success Response (201):
```json
{
  "success": true,
  "message": "Account created successfully! Welcome to Antique Bidderly.",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "is_verified": true,
    "profile_completion": 60,
    "created_at": "2024-01-15T10:30:00Z"
  },
  "token": "jwt_token_here",
  "nextSteps": [
    "Verify your email address",
    "Complete your profile", 
    "Browse available auctions"
  ]
}
```

#### Error Responses:
- `400`: Validation errors with detailed field-specific messages
- `409`: Email already exists
- `429`: Rate limit exceeded
- `500`: Server error

#### Validation Errors Format:
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Please enter a valid email address"
    },
    {
      "field": "password", 
      "message": "Password must contain at least one uppercase letter"
    }
  ]
}
```

## 🚀 Migration Instructions

### 1. Apply Enhanced Schema
```bash
cd server
npm run migrate
```

### 2. Or Setup Fresh Database
```bash
cd server
npm run db:setup
```

### 3. Reset Database (Development)
```bash
cd server  
npm run db:reset
```

## 📊 New Features

### Profile Completion Tracking
- Automatic calculation based on filled fields
- Visual progress indicators in frontend
- Incentivizes users to complete profiles

### User Activity Logging
- Security monitoring
- Analytics and insights
- Audit trail for important actions

### Enhanced User Preferences
- Customizable notification settings
- Theme and UI preferences
- Bidding behavior preferences

### Email Verification System
- Token-based email verification
- Automated cleanup of expired tokens
- Security notifications

## 🔧 Configuration Changes

### Environment Variables
No new environment variables required. Existing database connection settings are used.

### Database Constraints
- Email format validation at database level
- Name length and character constraints
- Unique email constraint
- Profile completion percentage bounds (0-100)

## ⚡ Performance Improvements

### Indexes Added
- `idx_users_email_verification` - Email verification lookups
- `idx_users_password_reset` - Password reset lookups  
- `idx_users_locked` - Account lockout checks
- `idx_user_activities_user_type` - Activity queries
- `idx_email_verifications_token` - Verification lookups

### Triggers
- Auto-update `updated_at` timestamps
- Auto-calculate profile completion percentage
- Auto-update current bid amounts

## 🧪 Testing

The enhanced signup functionality includes:
- Comprehensive input validation
- Rate limiting protection
- Database transaction integrity
- Error handling for edge cases
- Security monitoring and logging

## 📈 Benefits

1. **Enhanced Security**: Better password requirements, rate limiting, activity logging
2. **Better UX**: Detailed error messages, profile completion tracking
3. **Scalability**: Proper indexing, efficient queries, transaction safety
4. **Maintainability**: Modular validation, reusable functions
5. **Analytics**: User activity tracking for insights and monitoring

## 🔄 Backward Compatibility

All existing functionality remains unchanged. New features are additive and don't break existing API contracts.
