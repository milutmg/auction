#!/bin/bash

# Test script to verify navbar duplication fix
echo "🧪 Testing Navbar Duplication Fix"
echo "================================="

echo "✅ Checking for duplicate Navbar imports..."

# Check if any page components still import Navbar unnecessarily
DUPLICATE_IMPORTS=$(grep -r "import.*Navbar" client/src/pages/ | grep -v ".backup" | grep -v ".broken" 2>/dev/null || true)

if [ -z "$DUPLICATE_IMPORTS" ]; then
    echo "✅ No duplicate Navbar imports found in page components"
else
    echo "❌ Found duplicate Navbar imports:"
    echo "$DUPLICATE_IMPORTS"
fi

echo ""
echo "✅ Checking for duplicate <Navbar /> usage in pages..."

# Check if any page components still use <Navbar />
DUPLICATE_USAGE=$(grep -r "<Navbar" client/src/pages/ | grep -v ".backup" | grep -v ".broken" 2>/dev/null || true)

if [ -z "$DUPLICATE_USAGE" ]; then
    echo "✅ No duplicate Navbar usage found in page components"
else
    echo "❌ Found duplicate Navbar usage:"
    echo "$DUPLICATE_USAGE"
fi

echo ""
echo "✅ Checking App.tsx for global Navbar..."

# Check if App.tsx has the navbar in the global layout
APP_NAVBAR=$(grep -n "<Navbar" client/src/App.tsx 2>/dev/null || true)

if [ -n "$APP_NAVBAR" ]; then
    echo "✅ Global Navbar found in App.tsx:"
    echo "$APP_NAVBAR"
else
    echo "❌ No global Navbar found in App.tsx"
fi

echo ""
echo "✅ Color scheme verification..."

# Check if navbar uses consistent blue colors
BLUE_COLORS=$(grep -n "text-blue-600\|bg-blue-" client/src/components/layout/Navbar.tsx | wc -l)
echo "✅ Found $BLUE_COLORS blue color references in Navbar component"

echo ""
echo "🎯 Summary:"
echo "- Navbar should only appear once (in App.tsx global layout)"
echo "- Individual pages should NOT import or use <Navbar />"
echo "- All navbar icons should use blue color scheme matching Sign In button"
echo "- Test completed!"
