# 🔧 Admin Panel Testing Checklist

## 📍 **Access the Admin Panel**

1. **Open Browser**: Go to http://localhost:8080
2. **Login as Admin**:
   - Email: `admin@example.com`
   - Password: `admin123`
3. **Look for Admin Button**: Should appear in top-right navbar (red button with shield icon)
4. **Click "Admin"**: Should redirect to `/admin` route

---

## 🎯 **Admin Features to Test**

### **📊 Dashboard Overview**
- [ ] **System Stats Cards**: Total Users, Active Auctions, Pending Auctions, Total Bids, Revenue
- [ ] **Numbers should be populated** (not all zeros)

### **🏷️ Tab 1: Products (Auction Approval)**
- [ ] **View pending auctions** waiting for approval
- [ ] **Approve auction** - click green "Approve" button
- [ ] **Reject auction** - click red "Reject" button (opens dialog for reason)
- [ ] **See auction details**: Title, seller, starting bid, end time

### **👥 Tab 2: Users**
- [ ] **View all users** in the system
- [ ] **See user details**: Name, email, role, status, join date
- [ ] **Suspend/Activate users** - toggle user status
- [ ] **Admin users cannot be suspended**

### **📈 Tab 3: Bids**
- [ ] **View recent bidding activity**
- [ ] **See bid details**: Auction, bidder, amount, time
- [ ] **Review/Flag suspicious bids**

### **⚠️ Tab 4: Reports**
- [ ] **View user reports** (may be empty if no reports)
- [ ] **Change report status**: Investigating, Resolved, Dismissed

### **⚙️ Tab 5: Rules**
- [ ] **Modify bidding rules**:
  - Minimum bid increment
  - Auto-extend time
  - Payment deadline
- [ ] **Update settings** button works

### **📢 Tab 6: Messages**
- [ ] **Send system-wide messages**
- [ ] **Broadcast to all users**
- [ ] **Message input and send button**

### **📊 Tab 7: Monitor**
- [ ] **System health status**
- [ ] **Recent activity log**
- [ ] **Server status indicators**

---

## 🚨 **If Admin Panel Not Visible**

### **Check These:**
1. **Admin Button Missing?**
   - Make sure you logged in as `admin@example.com`
   - Check browser console for errors (F12)
   - Verify user role is 'admin' in database

2. **Admin Page Won't Load?**
   - Check if you can access: http://localhost:8080/admin directly
   - Look for authentication errors in browser console

3. **Empty Data?**
   - Run the demo setup script: `cd server && node setup-demo.js`
   - This creates test auctions and users

---

## 🔧 **Quick Debug Commands**

```bash
# Check if admin user exists with correct role
cd server
psql -d antique_auction -c "SELECT email, role FROM users WHERE role = 'admin';"

# Check if test auctions exist
psql -d antique_auction -c "SELECT count(*) FROM auctions WHERE approval_status = 'pending';"

# Reset admin password
node update-admin-password.js

# Create demo data
node setup-demo.js
```

---

## ✅ **Expected Results**

**Admin should see:**
- All 7 tabs with full functionality
- Pending auctions ready for approval
- User management tools
- System statistics
- Bidding controls
- Message broadcasting
- System monitoring

**Regular users should NOT see:**
- Admin button in navbar
- Cannot access /admin route
- Gets redirected if they try

---

**🎯 Test each feature and let me know which specific ones you cannot see or are not working!**
