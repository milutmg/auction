#!/usr/bin/env node

const fetch = require('node-fetch');

async function testApplication() {
    console.log('🔧 Testing Fixed Port Configuration');
    console.log('===================================');
    
    // Test 1: Backend API health
    console.log('\n1. Testing Backend API (port 3002)...');
    try {
        const response = await fetch('http://localhost:3002/api/auth/health');
        if (response.ok) {
            console.log('   ✅ Backend API responding on port 3002');
        } else {
            console.log('   ❌ Backend API error:', response.status);
        }
    } catch (error) {
        console.log('   ❌ Backend API connection failed:', error.message);
    }
    
    // Test 2: Frontend server
    console.log('\n2. Testing Frontend Server (port 8080)...');
    try {
        const response = await fetch('http://localhost:8080');
        if (response.ok) {
            console.log('   ✅ Frontend server responding on port 8080');
        } else {
            console.log('   ❌ Frontend server error:', response.status);
        }
    } catch (error) {
        console.log('   ❌ Frontend server connection failed:', error.message);
    }
    
    // Test 3: WebSocket server
    console.log('\n3. Testing WebSocket Server (port 3002)...');
    try {
        const response = await fetch('http://localhost:3002/socket.io/');
        console.log('   ✅ WebSocket server responding on port 3002');
    } catch (error) {
        console.log('   ❌ WebSocket server connection failed:', error.message);
    }
    
    // Test 4: Test user registration endpoint
    console.log('\n4. Testing User Registration Endpoint...');
    try {
        const response = await fetch('http://localhost:3002/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'test-' + Date.now() + '@example.com',
                password: 'testpassword',
                full_name: 'Test User',
                phone_number: '1234567890'
            })
        });
        
        if (response.ok) {
            console.log('   ✅ Registration endpoint working');
        } else {
            const error = await response.text();
            console.log('   ⚠️  Registration endpoint responding (expected error):', response.status);
        }
    } catch (error) {
        console.log('   ❌ Registration endpoint connection failed:', error.message);
    }
    
    console.log('\n✅ Port Configuration Test Complete!');
    console.log('\n📋 Summary:');
    console.log('   - Backend API: http://localhost:3002/api');
    console.log('   - Frontend UI: http://localhost:8080');
    console.log('   - WebSocket: ws://localhost:3002');
    console.log('\n🌐 Open http://localhost:8080 in your browser to test the application');
}

testApplication().catch(console.error);
