# eSewa Payment Integration Demo Guide

## 🎯 Demo Objective
Test the complete eSewa payment flow from auction creation to payment completion using the test user credentials.

## 📋 Prerequisites
- ✅ Backend server running on port 3001
- ✅ Frontend server running on port 8080
- ✅ Test user exists: test@example.com / password123
- ✅ Admin user exists: admin@example.com / password123
- ✅ eSewa integration fully implemented

## 🚀 Complete Demo Flow

### Step 1: Access the Application
1. Open browser and navigate to: http://localhost:8080
2. You should see the Antique Bidderly homepage

### Step 2: Login as Test User
1. Click "Login" or navigate to: http://localhost:8080/auth
2. Enter credentials:
   - Email: `test@example.com`
   - Password: `password123`
3. Click "Login"
4. You should be redirected to the user dashboard

### Step 3: Browse/Create Auctions
**Option A: Join an existing auction**
1. Navigate to "Browse Auctions" or the auctions page
2. Find an active auction with bids
3. Place a bid higher than the current highest bid
4. Win the auction (wait for timer or place winning bid)

**Option B: Create a test auction (if you have admin access)**
1. Login as admin (admin@example.com / password123)
2. Create a new auction with a short duration (1-2 minutes)
3. Logout and login as test user
4. Bid on and win the auction

### Step 4: Access Won Auction for Payment
1. After winning an auction, navigate to your dashboard
2. Look for "Won Auctions" or "Orders" section
3. Find the auction you won
4. Click "Pay Now" or "Complete Payment"

### Step 5: Initiate eSewa Payment
1. On the order/payment page, you should see auction details
2. Look for the "Pay with eSewa" button
3. Click the eSewa payment button
4. You should be redirected to eSewa's sandbox/test environment

### Step 6: Complete eSewa Payment (Test Mode)
**Note: This uses eSewa's test environment**
1. On eSewa test page, use test credentials:
   - Service Code: `EPAYTEST`
   - Success URL: Your app's success callback
   - Failure URL: Your app's failure callback
2. Complete the mock payment process
3. You should be redirected back to the application

### Step 7: Verify Payment Success
1. After eSewa redirects back, you should land on:
   - Success page: `/payment-success`
   - Or failure page: `/payment-failure`
2. Check that payment status is updated in the database
3. Verify the order status has changed to "paid"

## 🔧 Troubleshooting

### If Login Fails
- Check browser console for errors (F12)
- Verify server is running: `curl http://localhost:3001/api/health`
- Check user exists in database

### If eSewa Button Not Visible
- Check browser console for JavaScript errors
- Verify eSewa service is configured correctly
- Check network tab for API call failures

### If Payment Redirect Fails
- Check eSewa configuration in `/server/config/esewa.js`
- Verify callback URLs are correct
- Check server logs for errors

### If Payment Status Not Updated
- Check server logs during payment callback
- Verify database connection
- Check payment verification endpoint

## 🛠️ Technical Details

### eSewa Configuration
- Environment: Test/Sandbox
- Merchant Code: `EPAYTEST`
- Success URL: `http://localhost:8080/payment-success`
- Failure URL: `http://localhost:8080/payment-failure`

### API Endpoints
- Payment Initiation: `POST /api/auctions/:id/payment/initiate`
- Payment Verification: `POST /api/auctions/payment/verify`
- Order Status: `GET /api/auctions/:id/order`

### Frontend Components
- Payment Button: `EsewaPaymentButton.tsx`
- Success Page: `PaymentSuccess.tsx`
- Failure Page: `PaymentFailure.tsx`

## 📝 Demo Checklist
- [ ] Application loads successfully
- [ ] Test user can login
- [ ] Can browse/create auctions
- [ ] Can win an auction
- [ ] Payment button appears on order page
- [ ] eSewa redirect works
- [ ] Payment process completes
- [ ] Success/failure page displays
- [ ] Payment status updates in database
- [ ] Order status changes appropriately

## 🎯 Expected Results
✅ Complete end-to-end payment flow working
✅ User can successfully pay for won auctions via eSewa
✅ Payment status properly tracked and updated
✅ Smooth user experience throughout the flow
