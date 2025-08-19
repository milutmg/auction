const io = require('socket.io-client');

// Configuration
const SERVER_URL = 'http://localhost:3001';
const AUCTION_ID = process.argv[2] || 'bf9cdd9b-293e-4e62-a325-254df0b22549';
const BIDDER_NAME = process.argv[3] || 'SocketTester';

console.log(`🔌 ${BIDDER_NAME}: Testing Socket.IO Real-Time Bidding`);
console.log(`   Server: ${SERVER_URL}`);
console.log(`   Auction: ${AUCTION_ID}`);

// Connect to the server
const socket = io(SERVER_URL, {
    transports: ['websocket', 'polling'],
    timeout: 10000
});

let connected = false;
let testResults = {
    connected: false,
    joinedAuction: false,
    bidsPlaced: 0,
    bidsReceived: 0,
    notificationsReceived: 0,
    auctionUpdatesReceived: 0,
    errors: []
};

// Connection events
socket.on('connect', () => {
    console.log(`✅ ${BIDDER_NAME}: Connected! Socket ID: ${socket.id}`);
    testResults.connected = true;
    connected = true;
    
    // Join auction room
    console.log(`🏛️  ${BIDDER_NAME}: Joining auction ${AUCTION_ID}...`);
    socket.emit('join-auction', AUCTION_ID);
});

socket.on('connect_error', (error) => {
    console.log(`❌ ${BIDDER_NAME}: Connection failed: ${error.message}`);
    testResults.errors.push(`Connection error: ${error.message}`);
});

socket.on('disconnect', (reason) => {
    console.log(`🔌 ${BIDDER_NAME}: Disconnected: ${reason}`);
});

// Auction events
socket.on('auction-joined', (data) => {
    console.log(`🎯 ${BIDDER_NAME}: Successfully joined auction!`);
    console.log(`   Auction ID: ${data.auctionId}`);
    console.log(`   Message: ${data.message}`);
    console.log(`   Timestamp: ${data.timestamp}`);
    testResults.joinedAuction = true;
    
    // Place a test bid after joining
    setTimeout(() => {
        placeBid(125);
    }, 2000);
});

// Bid events
socket.on('bid-update', (bidData) => {
    testResults.bidsReceived++;
    console.log(`📈 ${BIDDER_NAME}: Bid Update #${testResults.bidsReceived}:`);
    console.log(`   Amount: $${bidData.amount}`);
    console.log(`   Bidder: ${bidData.bidderName}`);
    console.log(`   Bid ID: ${bidData.id}`);
    console.log(`   Client Time: ${bidData.timestamp}`);
    console.log(`   Server Time: ${bidData.serverTimestamp}`);
    
    // Place a counter-bid if this wasn't our bid
    if (bidData.bidderName !== BIDDER_NAME && testResults.bidsPlaced < 2) {
        setTimeout(() => {
            const counterBid = bidData.amount + Math.floor(Math.random() * 20) + 10;
            placeBid(counterBid);
        }, Math.random() * 3000 + 1000);
    }
});

socket.on('auction-update', (updateData) => {
    testResults.auctionUpdatesReceived++;
    console.log(`🏆 ${BIDDER_NAME}: Auction Update #${testResults.auctionUpdatesReceived}:`);
    console.log(`   Current Highest: $${updateData.currentBid}`);
    console.log(`   Leading Bidder: ${updateData.lastBidder}`);
    console.log(`   Timestamp: ${updateData.timestamp}`);
});

socket.on('bid-error', (errorData) => {
    console.log(`❌ ${BIDDER_NAME}: Bid Error: ${errorData.message}`);
    testResults.errors.push(`Bid error: ${errorData.message}`);
});

socket.on('new-notification', (notification) => {
    testResults.notificationsReceived++;
    console.log(`🔔 ${BIDDER_NAME}: Notification #${testResults.notificationsReceived}:`);
    console.log(`   Type: ${notification.type}`);
    console.log(`   Title: ${notification.title}`);
    console.log(`   Message: ${notification.message}`);
});

// Function to place a bid via Socket.IO
function placeBid(amount) {
    if (!testResults.joinedAuction) {
        console.log(`⚠️  ${BIDDER_NAME}: Cannot place bid - not joined to auction`);
        return;
    }
    
    testResults.bidsPlaced++;
    console.log(`🔨 ${BIDDER_NAME}: Placing bid #${testResults.bidsPlaced} of $${amount}...`);
    
    socket.emit('new-bid', {
        auctionId: AUCTION_ID,
        amount: amount,
        userId: Math.floor(Math.random() * 10000),
        bidderName: BIDDER_NAME,
        timestamp: new Date().toISOString()
    });
}

// Test completion and summary
setTimeout(() => {
    console.log(`\n📊 ${BIDDER_NAME}: Test Summary:`);
    console.log(`   ✅ Connected: ${testResults.connected ? 'Yes' : 'No'}`);
    console.log(`   ✅ Joined Auction: ${testResults.joinedAuction ? 'Yes' : 'No'}`);
    console.log(`   🔨 Bids Placed: ${testResults.bidsPlaced}`);
    console.log(`   📈 Bid Updates Received: ${testResults.bidsReceived}`);
    console.log(`   🏆 Auction Updates Received: ${testResults.auctionUpdatesReceived}`);
    console.log(`   🔔 Notifications Received: ${testResults.notificationsReceived}`);
    console.log(`   ❌ Errors: ${testResults.errors.length}`);
    
    if (testResults.errors.length > 0) {
        console.log(`   Error Details:`);
        testResults.errors.forEach((error, i) => {
            console.log(`     ${i + 1}. ${error}`);
        });
    }
    
    // Leave auction and disconnect
    if (testResults.joinedAuction) {
        console.log(`🚪 ${BIDDER_NAME}: Leaving auction...`);
        socket.emit('leave-auction', AUCTION_ID);
    }
    
    setTimeout(() => {
        console.log(`👋 ${BIDDER_NAME}: Test complete, disconnecting...`);
        socket.disconnect();
        
        // Exit with appropriate code
        const success = testResults.connected && testResults.joinedAuction && testResults.bidsPlaced > 0;
        process.exit(success ? 0 : 1);
    }, 1000);
}, 10000); // Run test for 10 seconds

// Handle interruption
process.on('SIGINT', () => {
    console.log(`\n🛑 ${BIDDER_NAME}: Test interrupted`);
    if (testResults.joinedAuction) {
        socket.emit('leave-auction', AUCTION_ID);
    }
    socket.disconnect();
    process.exit(0);
});
