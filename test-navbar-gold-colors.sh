#!/bin/bash

echo "🔍 Testing Navbar Gold Color Implementation..."
echo "========================================"

# Check if blue color references have been replaced with gold
echo "1. Checking for remaining blue color references in navbar..."
BLUE_REFS=$(grep -n "text-blue\|bg-blue\|border-blue\|ring-blue" client/src/components/layout/Navbar.tsx | wc -l)
if [ $BLUE_REFS -eq 0 ]; then
    echo "✅ No blue color references found in navbar"
else
    echo "❌ Found $BLUE_REFS blue color references:"
    grep -n "text-blue\|bg-blue\|border-blue\|ring-blue" client/src/components/layout/Navbar.tsx
fi

echo ""
echo "2. Checking for gold color implementations..."
GOLD_REFS=$(grep -n "text-gold\|bg-gold\|border-gold\|ring-gold" client/src/components/layout/Navbar.tsx | wc -l)
if [ $GOLD_REFS -gt 0 ]; then
    echo "✅ Found $GOLD_REFS gold color references"
    echo "Gold color usages:"
    grep -n "text-gold\|bg-gold\|border-gold\|ring-gold" client/src/components/layout/Navbar.tsx | head -10
else
    echo "❌ No gold color references found"
fi

echo ""
echo "3. Checking navbar logo color..."
LOGO_GOLD=$(grep -n "text-gold.*Antique Bidderly" client/src/components/layout/Navbar.tsx | wc -l)
if [ $LOGO_GOLD -eq 1 ]; then
    echo "✅ Logo uses gold color"
else
    echo "❌ Logo does not use gold color"
fi

echo ""
echo "4. Checking profile avatar background..."
AVATAR_GOLD=$(grep -n "background=c5a028" client/src/components/layout/Navbar.tsx | wc -l)
if [ $AVATAR_GOLD -eq 2 ]; then
    echo "✅ Avatar backgrounds use gold color"
else
    echo "❌ Avatar backgrounds do not use gold color"
fi

echo ""
echo "5. Checking Sign In button color..."
SIGNIN_GOLD=$(grep -n "bg-gold.*Sign In" client/src/components/layout/Navbar.tsx | wc -l)
if [ $SIGNIN_GOLD -eq 1 ]; then
    echo "✅ Sign In button uses gold color"
else
    echo "❌ Sign In button does not use gold color"
fi

echo ""
echo "6. Testing application startup..."
if curl -s http://localhost:8080 > /dev/null; then
    echo "✅ Application is running on localhost:8080"
else
    echo "❌ Application is not accessible"
fi

echo ""
echo "🎯 Gold Color Navbar Test Complete!"
echo "Visit http://localhost:8080 to verify the gold navbar visually"
