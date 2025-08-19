const puppeteer = require('puppeteer');

async function testAdminLoginModern() {
  console.log('🚀 Testing Modern Admin Dashboard Login Flow...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false, 
    devtools: true,
    slowMo: 100 
  });
  
  try {
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      console.log(`BROWSER CONSOLE [${msg.type()}]:`, msg.text());
    });
    
    page.on('pageerror', err => {
      console.log('PAGE ERROR:', err.message);
    });
    
    // Go to the app
    console.log('1. Navigating to application...');
    await page.goto('http://localhost:8080', { waitUntil: 'networkidle0' });
    
    // Click login
    console.log('2. Going to login page...');
    await page.click('a[href="/auth"]');
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    
    // Login as admin
    console.log('3. Entering admin credentials...');
    await page.type('input[type="email"]', 'admin@admin.com');
    await page.type('input[type="password"]', 'admin123');
    
    console.log('4. Clicking login button...');
    await page.click('button[type="submit"]');
    
    // Wait for login and redirect
    console.log('5. Waiting for login and navigation...');
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    console.log('Current URL after login:', currentUrl);
    
    // Try to navigate to admin dashboard
    console.log('6. Navigating to /admin...');
    await page.goto('http://localhost:8080/admin', { waitUntil: 'networkidle0' });
    
    await page.waitForTimeout(2000);
    
    // Check what's actually rendered
    const pageContent = await page.evaluate(() => {
      return {
        title: document.title,
        url: window.location.href,
        body: document.body.innerText.substring(0, 500),
        adminDashboardExists: !!document.querySelector('[data-testid="modern-admin-dashboard"]') || 
                            document.body.innerText.includes('Admin Dashboard') ||
                            document.body.innerText.includes('Analytics Overview'),
        hasLoadingSpinner: !!document.querySelector('.animate-spin'),
        hasNavbar: !!document.querySelector('nav'),
        authUser: localStorage.getItem('user'),
        authToken: !!localStorage.getItem('token')
      };
    });
    
    console.log('\n📊 Page Analysis:');
    console.log('URL:', pageContent.url);
    console.log('Title:', pageContent.title);
    console.log('Has Admin Dashboard:', pageContent.adminDashboardExists);
    console.log('Has Loading Spinner:', pageContent.hasLoadingSpinner);
    console.log('Has Navbar:', pageContent.hasNavbar);
    console.log('Auth Token:', pageContent.authToken);
    console.log('Auth User:', pageContent.authUser ? JSON.parse(pageContent.authUser).email : 'None');
    console.log('\nPage Content (first 500 chars):');
    console.log(pageContent.body);
    
    // Take a screenshot
    await page.screenshot({ path: '/home/milan/fyp/antique-bidderly-1/admin-dashboard-screenshot.png' });
    console.log('\n📸 Screenshot saved as admin-dashboard-screenshot.png');
    
    // Wait a bit longer to inspect
    console.log('\n⏰ Waiting 10 seconds for manual inspection...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

testAdminLoginModern();
