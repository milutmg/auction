# eSewa Payment Gateway Integration

This document provides a comprehensive guide to the eSewa payment gateway integration in your auction website.

## 🚀 Quick Start

### 1. Test the Integration
```bash
# Run the test script
node test-esewa-integration.js

# Or test manually in browser
http://localhost:3000/test-esewa
```

### 2. Direct Test Payment
```bash
http://localhost:3002/api/esewa/test-payment?amount=100
```

## 🔧 Configuration

### Test Environment Settings
- **Merchant Code**: `EPAYTEST`
- **Secret Key**: `8gBm/:&EnhH.1/q`
- **Test Gateway**: `https://rc-epay.esewa.com.np/api/epay/main/v2/form`
- **Verification URL**: `https://rc-epay.esewa.com.np/api/epay/transrec`

### Production Environment (when ready)
- **Merchant Code**: Your production merchant code
- **Secret Key**: Your production secret key
- **Gateway**: `https://esewa.com.np/epay/main`
- **Verification**: `https://esewa.com.np/epay/transrec`

## 📁 File Structure

```
server/
├── config/
│   └── esewa.js              # eSewa configuration
├── services/
│   └── esewaPayment.js       # Payment service logic
├── routes/
│   ├── esewa.js              # Test and custom payment routes
│   └── auctions.js           # Auction payment integration
└── server.js                 # Main server with routes

client/
├── src/
│   ├── pages/
│   │   └── TestEsewa.tsx    # Test page component
│   ├── components/
│   │   └── payment/
│   │       └── EsewaPaymentButton.tsx  # Payment button
│   └── services/
│       └── api.ts           # API service calls
```

## 🔐 Test Credentials

Use these credentials for testing:

- **Username**: `test@esewa.com.np`
- **Password**: `test123`
- **OTP**: `123456`

## 🧪 Testing

### 1. Frontend Test Page
Navigate to `/test-esewa` in your browser to:
- Test payment initiation
- Verify API endpoints
- Check callback handling
- View integration details

### 2. Backend Test Endpoints
- `GET /api/esewa/test-payment?amount=100` - Test payment page
- `GET /api/esewa/custom-pay?amount=100` - Custom payment form
- `POST /api/auctions/payment/esewa/success` - Success callback
- `POST /api/auctions/payment/esewa/failure` - Failure callback

### 3. Auction Payment Integration
- `POST /api/auctions/order/:orderId/payment/esewa/initiate` - Initiate auction payment

## 💳 Payment Flow

### 1. Payment Initiation
```javascript
// Frontend initiates payment
const response = await api.initiateEsewaPayment(orderId);

// Backend generates payment data
const paymentData = EsewaPaymentService.initiatePayment(orderData);

// Returns form data for eSewa
{
  amount: "100.00",
  tax_amount: "0.00",
  total_amount: "100.00",
  transaction_uuid: "TXN_1234567890_abc123",
  product_code: "EPAYTEST",
  success_url: "http://localhost:3002/api/auctions/payment/esewa/success?orderId=123",
  failure_url: "http://localhost:3002/api/auctions/payment/esewa/failure?orderId=123",
  signature: "generated_hmac_signature"
}
```

### 2. eSewa Processing
- User is redirected to eSewa payment gateway
- User completes payment with test credentials
- eSewa redirects to success/failure URL

### 3. Callback Handling
```javascript
// Success callback
POST /api/auctions/payment/esewa/success?orderId=123
{
  oid: "product_code",
  amt: "100.00",
  refId: "ESEWA_REFERENCE_ID"
}

// Failure callback
POST /api/auctions/payment/esewa/failure?orderId=123
```

### 4. Payment Verification
```javascript
// Backend verifies payment with eSewa
const verificationResult = await EsewaPaymentService.verifyPayment(callbackData);

// Updates order status
UPDATE orders SET status = 'paid' WHERE id = orderId;
```

## 🔒 Security Features

### 1. HMAC-SHA256 Signature
```javascript
const message = `total_amount=${totalAmount},transaction_uuid=${transactionId},product_code=${merchantCode}`;
const signature = crypto.createHmac('sha256', secretKey).update(message).digest('base64');
```

### 2. Transaction UUID Generation
- Unique transaction identifier for each payment
- Prevents replay attacks
- Enables payment tracking

### 3. Payment Verification
- Verifies payment with eSewa API
- Validates callback data integrity
- Updates order status only after verification

## 🚨 Error Handling

### Common Issues and Solutions

#### 1. Callback URL Not Accessible
```bash
# Check if server is running
curl http://localhost:3002/api/health

# Verify callback endpoints
curl http://localhost:3002/api/auctions/payment/esewa/success?orderId=test
```

#### 2. Signature Verification Failed
- Ensure secret key matches configuration
- Check message format for signature generation
- Verify all required fields are present

#### 3. Payment Not Redirecting
- Check eSewa gateway URL
- Verify form data format
- Ensure all required fields are populated

## 📊 Monitoring and Logging

### Server Logs
Monitor these log entries:
```javascript
console.log('eSewa payment initiation error:', error);
console.log('eSewa success callback:', { orderId, callbackData });
console.log('eSewa payment successful for order:', result);
```

### Database Updates
Check order status changes:
```sql
SELECT * FROM orders WHERE payment_method = 'esewa' ORDER BY updated_at DESC;
```

## 🔄 Production Deployment

### 1. Update Configuration
```javascript
// server/config/esewa.js
const ESEWA_CONFIG = {
  MERCHANT_CODE: process.env.ESEWA_MERCHANT_CODE,
  PAYMENT_URL: 'https://esewa.com.np/epay/main',
  VERIFICATION_URL: 'https://esewa.com.np/epay/transrec',
  // ... other production settings
};
```

### 2. Environment Variables
```bash
ESEWA_MERCHANT_CODE=your_production_merchant_code
ESEWA_SECRET_KEY=your_production_secret_key
ESEWA_SUCCESS_URL=https://yourdomain.com/api/auctions/payment/esewa/success
ESEWA_FAILURE_URL=https://yourdomain.com/api/auctions/payment/esewa/failure
```

### 3. SSL Certificate
- Ensure HTTPS is enabled
- Valid SSL certificate required
- Callback URLs must use HTTPS

## 📱 Frontend Integration

### Payment Button Component
```tsx
<EsewaPaymentButton
  orderId="order-123"
  amount={100.00}
  auctionTitle="Vintage Watch"
  onPaymentSuccess={(result) => console.log('Payment successful:', result)}
  onPaymentFailure={(error) => console.log('Payment failed:', error)}
/>
```

### API Service
```typescript
// Initiate eSewa payment
const response = await api.initiateEsewaPayment(orderId);

// Handle response
if (response.success) {
  const { paymentUrl, formData } = response.payment;
  // Submit form to eSewa
}
```

## 🧪 Testing Checklist

- [ ] Test payment initiation
- [ ] Verify eSewa redirect
- [ ] Test with test credentials
- [ ] Verify success callback
- [ ] Verify failure callback
- [ ] Check payment verification
- [ ] Verify order status update
- [ ] Test error handling
- [ ] Verify signature generation
- [ ] Check database updates

## 🆘 Support

### Debug Mode
Enable detailed logging:
```javascript
// server/config/esewa.js
const DEBUG_MODE = process.env.NODE_ENV === 'development';
```

### Common Debug Commands
```bash
# Test endpoints
curl -X GET "http://localhost:3002/api/esewa/test-payment?amount=100"

# Check server status
curl "http://localhost:3002/api/health"

# Test callback endpoints
curl -X POST "http://localhost:3002/api/auctions/payment/esewa/success?orderId=test"
```

## 📚 Additional Resources

- [eSewa Developer Documentation](https://esewa.com.np/developer)
- [eSewa Test Environment](https://rc-epay.esewa.com.np)
- [Payment Gateway Best Practices](https://example.com)

---

**Note**: This integration is configured for testing. For production use, update credentials, URLs, and security settings accordingly.
