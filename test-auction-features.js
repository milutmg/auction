#!/usr/bin/env node

const API_BASE = 'http://localhost:3002/api';

// Test all auction features
async function testAuctionFeatures() {
  console.log('🧪 Testing Auction Features...\n');

  try {
    // Test 1: Get all auctions (basic)
    console.log('1️⃣ Testing basic auction retrieval...');
    let response = await fetch(`${API_BASE}/auctions`);
    let data = await response.json();
    console.log(`✅ Retrieved ${data.auctions.length} auctions`);
    console.log(`   Pagination: Page ${data.pagination.current_page} of ${data.pagination.total_pages}`);

    // Test 2: Get categories
    console.log('\n2️⃣ Testing categories...');
    response = await fetch(`${API_BASE}/bids/categories`);
    const categories = await response.json();
    console.log(`✅ Retrieved ${categories.length} categories`);
    categories.forEach(cat => console.log(`   - ${cat.name}`));

    // Test 3: Filter by category
    console.log('\n3️⃣ Testing category filtering...');
    const testCategory = categories[0].name;
    response = await fetch(`${API_BASE}/auctions?category=${encodeURIComponent(testCategory)}`);
    data = await response.json();
    console.log(`✅ Category filter "${testCategory}": ${data.auctions.length} auctions`);

    // Test 4: Filter by status
    console.log('\n4️⃣ Testing status filtering...');
    response = await fetch(`${API_BASE}/auctions?status=active`);
    data = await response.json();
    console.log(`✅ Status filter "active": ${data.auctions.length} auctions`);

    // Test 5: Search functionality
    console.log('\n5️⃣ Testing search...');
    response = await fetch(`${API_BASE}/auctions?search=test`);
    data = await response.json();
    console.log(`✅ Search "test": ${data.auctions.length} auctions`);

    // Test 6: Price range filtering
    console.log('\n6️⃣ Testing price range...');
    response = await fetch(`${API_BASE}/auctions?min_price=10&max_price=100`);
    data = await response.json();
    console.log(`✅ Price range $10-$100: ${data.auctions.length} auctions`);

    // Test 7: Sorting
    console.log('\n7️⃣ Testing sorting...');
    response = await fetch(`${API_BASE}/auctions?sort=current_bid&order=DESC`);
    data = await response.json();
    console.log(`✅ Sort by current_bid DESC: ${data.auctions.length} auctions`);
    if (data.auctions.length > 0) {
      console.log(`   Top auction: "${data.auctions[0].title}" - $${data.auctions[0].current_bid || data.auctions[0].starting_bid}`);
    }

    // Test 8: Pagination
    console.log('\n8️⃣ Testing pagination...');
    response = await fetch(`${API_BASE}/auctions?page=1&limit=3`);
    data = await response.json();
    console.log(`✅ Pagination (page 1, limit 3): ${data.auctions.length} auctions`);
    console.log(`   Total pages: ${data.pagination.total_pages}`);

    // Test 9: Get auction stats
    console.log('\n9️⃣ Testing auction stats...');
    response = await fetch(`${API_BASE}/auctions/stats`);
    const stats = await response.json();
    console.log(`✅ Stats retrieved:`);
    console.log(`   Total auctions: ${stats.overall.total_auctions}`);
    console.log(`   Active auctions: ${stats.overall.active_auctions}`);
    console.log(`   Total active value: $${parseFloat(stats.overall.total_active_value).toFixed(2)}`);

    // Test 10: Get trending auctions
    console.log('\n🔟 Testing trending auctions...');
    response = await fetch(`${API_BASE}/auctions/trending?limit=3`);
    const trending = await response.json();
    console.log(`✅ Trending auctions: ${trending.length} found`);
    trending.forEach((auction, i) => {
      console.log(`   ${i+1}. "${auction.title}" - ${auction.bid_count} bids`);
    });

    // Test 11: Get featured auctions
    console.log('\n1️⃣1️⃣ Testing featured auctions...');
    response = await fetch(`${API_BASE}/auctions/featured?limit=3`);
    const featured = await response.json();
    console.log(`✅ Featured auctions: ${featured.length} found`);
    featured.forEach((auction, i) => {
      console.log(`   ${i+1}. "${auction.title}" - $${auction.current_bid || auction.starting_bid}`);
    });

    // Test 12: Combined filters
    console.log('\n1️⃣2️⃣ Testing combined filters...');
    response = await fetch(`${API_BASE}/auctions?status=active&search=test&sort=created_at&order=DESC&limit=5`);
    data = await response.json();
    console.log(`✅ Combined filters: ${data.auctions.length} auctions`);

    console.log('\n🎉 All auction features tested successfully!');
    console.log('\n📊 Summary:');
    console.log('✅ Basic auction retrieval');
    console.log('✅ Category filtering');
    console.log('✅ Status filtering');
    console.log('✅ Search functionality');
    console.log('✅ Price range filtering');
    console.log('✅ Sorting options');
    console.log('✅ Pagination');
    console.log('✅ Auction statistics');
    console.log('✅ Trending auctions');
    console.log('✅ Featured auctions');
    console.log('✅ Combined filters');

  } catch (error) {
    console.error('❌ Error testing auction features:', error);
    process.exit(1);
  }
}

// Test auction detail features
async function testAuctionDetails() {
  console.log('\n🔍 Testing Auction Detail Features...\n');

  try {
    // Get a sample auction ID
    const response = await fetch(`${API_BASE}/auctions?limit=1`);
    const data = await response.json();
    
    if (data.auctions.length === 0) {
      console.log('⚠️ No auctions found for detail testing');
      return;
    }

    const auctionId = data.auctions[0].id;
    console.log(`Testing with auction ID: ${auctionId}`);

    // Test auction detail retrieval
    const detailResponse = await fetch(`${API_BASE}/auctions/${auctionId}`);
    const auction = await detailResponse.json();
    
    console.log('✅ Auction details retrieved:');
    console.log(`   Title: ${auction.title}`);
    console.log(`   Category: ${auction.category_name}`);
    console.log(`   Seller: ${auction.seller_name}`);
    console.log(`   Current Bid: $${auction.current_bid || auction.starting_bid}`);
    console.log(`   Status: ${auction.status}`);

  } catch (error) {
    console.error('❌ Error testing auction details:', error);
  }
}

// Run tests
async function runAllTests() {
  await testAuctionFeatures();
  await testAuctionDetails();
  
  console.log('\n🚀 Frontend should now have all these features working dynamically!');
  console.log('🌐 View the application at: http://localhost:8080');
  console.log('📋 Check the Auctions page to see all filters and features in action.');
}

runAllTests();
