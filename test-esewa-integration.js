#!/usr/bin/env node

/**
 * eSewa Integration Test Script
 * Tests the eSewa payment gateway integration
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const API_BASE = 'http://localhost:3002/api';

console.log('🧪 Testing eSewa Payment Gateway Integration...\n');

async function testEsewaEndpoints() {
  const tests = [
    {
      name: 'Test Payment Page',
      url: '/esewa/test-payment?amount=100',
      method: 'GET',
      expectedStatus: 200
    },
    {
      name: 'Custom Payment Form',
      url: '/esewa/custom-pay?amount=150',
      method: 'GET',
      expectedStatus: 200
    },
    {
      name: 'Success Callback Endpoint',
      url: '/auctions/payment/esewa/success?orderId=test-123',
      method: 'POST',
      expectedStatus: 200
    },
    {
      name: 'Failure Callback Endpoint',
      url: '/auctions/payment/esewa/failure?orderId=test-123',
      method: 'POST',
      expectedStatus: 200
    }
  ];

  for (const test of tests) {
    console.log(`🔍 Testing: ${test.name}`);
    
    try {
      const response = await fetch(`${API_BASE}${test.url}`, {
        method: test.method,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.status === test.expectedStatus) {
        console.log(`✅ ${test.name}: PASSED (Status: ${response.status})`);
      } else {
        console.log(`❌ ${test.name}: FAILED (Expected: ${test.expectedStatus}, Got: ${response.status})`);
      }

      // Check if response contains expected content
      if (test.name.includes('Payment Page') || test.name.includes('Custom Payment')) {
        const text = await response.text();
        if (text.includes('eSewa') || text.includes('EPAYTEST')) {
          console.log(`   📄 Response contains eSewa content`);
        } else {
          console.log(`   ⚠️  Response may not contain expected eSewa content`);
        }
      }

    } catch (error) {
      console.log(`❌ ${test.name}: ERROR - ${error.message}`);
    }
    
    console.log('');
  }
}

async function testEsewaConfiguration() {
  console.log('🔧 Testing eSewa Configuration...\n');

  const config = {
    merchantCode: 'EPAYTEST',
    testEnvironment: 'rc-epay.esewa.com.np',
    successUrl: 'http://localhost:3002/api/auctions/payment/esewa/success',
    failureUrl: 'http://localhost:3002/api/auctions/payment/esewa/failure'
  };

  console.log('📋 Current Configuration:');
  console.log(`   Merchant Code: ${config.merchantCode}`);
  console.log(`   Test Environment: ${config.testEnvironment}`);
  console.log(`   Success URL: ${config.successUrl}`);
  console.log(`   Failure URL: ${config.failureUrl}`);
  console.log('');

  // Test if URLs are accessible
  try {
    const successResponse = await fetch(config.successUrl);
    const failureResponse = await fetch(config.failureUrl);
    
    console.log(`✅ Success URL accessible: ${successResponse.status === 200 ? 'Yes' : 'No'}`);
    console.log(`✅ Failure URL accessible: ${failureResponse.status === 200 ? 'Yes' : 'No'}`);
  } catch (error) {
    console.log(`❌ Error testing callback URLs: ${error.message}`);
  }
}

async function generateTestInstructions() {
  console.log('\n📚 How to Test eSewa Integration:\n');
  
  console.log('1. 🚀 Start your server:');
  console.log('   cd server && npm start');
  console.log('');
  
  console.log('2. 🌐 Open test page in browser:');
  console.log('   http://localhost:3000/test-esewa');
  console.log('');
  
  console.log('3. 💳 Test direct eSewa payment:');
  console.log('   http://localhost:3002/api/esewa/test-payment?amount=100');
  console.log('');
  
  console.log('4. 🔑 Use test credentials:');
  console.log('   Username: test@esewa.com.np');
  console.log('   Password: test123');
  console.log('   OTP: 123456');
  console.log('');
  
  console.log('5. 📱 Test payment flow:');
  console.log('   - Click "Start eSewa Test"');
  console.log('   - Verify test results');
  console.log('   - Check callback handling');
  console.log('');
  
  console.log('6. 🔍 Monitor server logs for:');
  console.log('   - Payment initiation');
  console.log('   - Callback processing');
  console.log('   - Payment verification');
  console.log('');
}

async function runTests() {
  try {
    await testEsewaEndpoints();
    await testEsewaConfiguration();
    await generateTestInstructions();
    
    console.log('🎉 eSewa Integration Test Complete!');
    console.log('\n💡 Next Steps:');
    console.log('   • Test the payment flow in your browser');
    console.log('   • Verify callback handling works correctly');
    console.log('   • Check payment verification with eSewa API');
    console.log('   • Test with different amounts and scenarios');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
runTests();
