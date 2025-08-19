#!/bin/bash

# Quick eSewa Demo Setup
echo "🚀 QUICK ESEWA DEMO SETUP"
echo "========================"

echo "✅ Server Status:"
if ps aux | grep -q "node server.js"; then
    echo "   🟢 Backend running on port 3001"
else
    echo "   🔴 Backend not running - Start with: cd server && npm run dev"
fi

if ps aux | grep -q "vite"; then
    echo "   🟢 Frontend running on port 8080"
else
    echo "   🔴 Frontend not running - Start with: cd client && npm run dev"
fi

echo ""
echo "🎯 DEMO INSTRUCTIONS (No API Testing):"
echo "======================================"
echo ""
echo "1. 🌐 Open Browser:"
echo "   http://localhost:8080"
echo ""
echo "2. 🔐 Login/Register:"
echo "   • Try: test@example.com / password123"
echo "   • Or register new account if needed"
echo ""
echo "3. 👤 Admin Access (if needed):"
echo "   • Email: admin@example.com"
echo "   • Password: admin123"
echo ""
echo "4. 💰 Test eSewa Payment:"
echo "   • Browse auctions"
echo "   • Bid and win an auction"
echo "   • Go to dashboard"
echo "   • Click 'Pay Now'"
echo "   • Use eSewa payment button"
echo ""
echo "🎯 READY! Start here: http://localhost:8080"
echo ""
echo "📝 Note: If servers aren't running:"
echo "   Backend:  cd server && npm run dev"
echo "   Frontend: cd client && npm run dev"
