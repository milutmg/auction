#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Admin Dashboard Routing Configuration');
console.log('================================================');

// Check App.tsx routing
const appTsxPath = path.join(__dirname, 'client/src/App.tsx');
if (fs.existsSync(appTsxPath)) {
  const appContent = fs.readFileSync(appTsxPath, 'utf8');
  
  console.log('\n✅ App.tsx exists');
  
  // Check for admin route
  if (appContent.includes('path="/admin"')) {
    console.log('✅ Admin route (/admin) is defined');
  } else {
    console.log('❌ Admin route (/admin) NOT found');
  }
  
  // Check for ModernAdminDashboard import
  if (appContent.includes('ModernAdminDashboard')) {
    console.log('✅ ModernAdminDashboard is imported');
  } else {
    console.log('❌ ModernAdminDashboard import NOT found');
  }
  
  // Check for ProtectedRoute
  if (appContent.includes('ProtectedRoute')) {
    console.log('✅ ProtectedRoute is used');
  } else {
    console.log('❌ ProtectedRoute NOT found');
  }
  
} else {
  console.log('❌ App.tsx not found');
}

// Check ModernAdminDashboard.tsx
const dashboardPath = path.join(__dirname, 'client/src/pages/ModernAdminDashboard.tsx');
if (fs.existsSync(dashboardPath)) {
  const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
  
  console.log('\n✅ ModernAdminDashboard.tsx exists');
  
  // Check for key components
  if (dashboardContent.includes('const ModernAdminDashboard')) {
    console.log('✅ ModernAdminDashboard component is defined');
  } else {
    console.log('❌ ModernAdminDashboard component NOT found');
  }
  
  // Check for export
  if (dashboardContent.includes('export default ModernAdminDashboard')) {
    console.log('✅ ModernAdminDashboard is exported');
  } else {
    console.log('❌ ModernAdminDashboard export NOT found');
  }
  
  // Check for loading state management
  if (dashboardContent.includes('setLoading(false)')) {
    console.log('✅ Loading state is managed');
  } else {
    console.log('❌ Loading state management NOT found');
  }
  
} else {
  console.log('❌ ModernAdminDashboard.tsx not found');
}

// Check for other admin dashboard files that might interfere
const adminDashboardPath = path.join(__dirname, 'client/src/pages/AdminDashboard.tsx');
const enhancedDashboardPath = path.join(__dirname, 'client/src/pages/EnhancedAdminDashboard.tsx');

console.log('\n🔄 Checking for potential conflicts:');
if (fs.existsSync(adminDashboardPath)) {
  console.log('⚠️  AdminDashboard.tsx exists (legacy file)');
}
if (fs.existsSync(enhancedDashboardPath)) {
  console.log('⚠️  EnhancedAdminDashboard.tsx exists (alternative file)');
}

console.log('\n🌐 Application should be available at:');
console.log('   Frontend: http://localhost:8080');
console.log('   Backend:  http://localhost:3001');
console.log('\n📋 Next steps:');
console.log('   1. Open http://localhost:8080 in browser');
console.log('   2. Login as admin');
console.log('   3. Navigate to /admin');
console.log('   4. Verify the modern dashboard loads instantly');
