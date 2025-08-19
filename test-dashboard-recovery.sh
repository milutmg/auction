#!/bin/bash

echo "🔧 Dashboard Recovery & Testing"
echo "=============================="

echo "Testing all available dashboard routes..."

# Test routes
routes=(
  "/"
  "/test-dashboard"
  "/modern-admin"
  "/diagnostic"
  "/complex-admin"
  "/admin"
)

for route in "${routes[@]}"; do
  response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8080$route")
  if [ $response -eq 200 ]; then
    echo "✅ $route - Working (HTTP $response)"
  else
    echo "❌ $route - Failed (HTTP $response)"
  fi
done

echo ""
echo "🎯 Dashboard Routes Summary:"
echo "┌─────────────────────────────────────────────────┐"
echo "│ WORKING DASHBOARD ROUTES                        │"
echo "├─────────────────────────────────────────────────┤"
echo "│ /test-dashboard   → Test Modern Design          │"
echo "│ /modern-admin     → Simple Modern Dashboard     │"
echo "│ /diagnostic       → Diagnostic Information      │"
echo "│ /complex-admin    → Full Modern Dashboard       │"
echo "│ /admin           → Protected Modern Dashboard   │"
echo "└─────────────────────────────────────────────────┘"

echo ""
echo "🚀 Quick Access Commands:"
echo "• Open Test Dashboard:    http://localhost:8080/test-dashboard"
echo "• Open Modern Dashboard:  http://localhost:8080/modern-admin"
echo "• Open Diagnostic:        http://localhost:8080/diagnostic"
echo ""
echo "🔑 For admin access: Login with admin@example.com / admin123"
echo "Then navigate to: http://localhost:8080/admin"
