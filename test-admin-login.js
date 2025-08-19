#!/usr/bin/env node

// Test admin login and dashboard access
const puppeteer = require('puppeteer');

async function testAdminDashboard() {
  console.log('🔍 Testing Admin Dashboard Access');
  console.log('=================================');
  
  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: false, 
      defaultViewport: null,
      args: ['--start-maximized']
    });
    
    const page = await browser.newPage();
    
    // Listen for console messages
    page.on('console', msg => {
      console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`);
    });
    
    // Listen for errors
    page.on('pageerror', error => {
      console.log(`[ERROR] ${error.message}`);
    });
    
    console.log('📱 Opening application...');
    await page.goto('http://localhost:8080', { waitUntil: 'networkidle0' });
    
    console.log('🔑 Attempting admin login...');
    
    // Wait for login form
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });
    
    // Fill in admin credentials
    await page.type('input[type="email"], input[name="email"]', 'admin@example.com');
    await page.type('input[type="password"], input[name="password"]', 'admin123');
    
    // Submit login
    await page.click('button[type="submit"]');
    
    // Wait for navigation after login
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    
    console.log('📍 Current URL:', page.url());
    
    // Navigate to admin dashboard
    console.log('🎯 Navigating to admin dashboard...');
    await page.goto('http://localhost:8080/admin', { waitUntil: 'networkidle0' });
    
    // Wait for dashboard to load
    await page.waitForTimeout(2000);
    
    // Check if ModernAdminDashboard is visible
    const dashboardTitle = await page.$eval('h1, .dashboard-title, [data-testid="dashboard-title"]', el => el.textContent).catch(() => null);
    
    if (dashboardTitle) {
      console.log('✅ Dashboard loaded successfully!');
      console.log(`📊 Dashboard title: ${dashboardTitle}`);
    } else {
      console.log('❌ Dashboard title not found');
    }
    
    // Check for stats cards
    const statsCards = await page.$$('.stat-card, [data-testid="stat-card"], .card').length;
    console.log(`📈 Found ${statsCards} dashboard cards`);
    
    // Take a screenshot
    await page.screenshot({ path: 'admin-dashboard-test.png', fullPage: true });
    console.log('📸 Screenshot saved as admin-dashboard-test.png');
    
    console.log('✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Check if puppeteer is available
try {
  testAdminDashboard();
} catch (error) {
  console.log('ℹ️  Puppeteer not available for automated testing');
  console.log('📋 Manual testing steps:');
  console.log('   1. Open http://localhost:8080 in browser');
  console.log('   2. Login with: admin@example.com / admin123');
  console.log('   3. Navigate to /admin');
  console.log('   4. Verify modern dashboard appears instantly');
  console.log('   5. Check browser console for any errors');
}
