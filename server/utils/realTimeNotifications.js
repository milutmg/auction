const db = require('../config/database');

// Create notification in database and emit via socket
async function createNotification(io, userId, notificationData) {
  try {
    // Insert into database
    const result = await db.query(`
      INSERT INTO notifications (user_id, title, message, type, related_auction_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [
      userId,
      notificationData.title,
      notificationData.message,
      notificationData.type,
      notificationData.auctionId || null
    ]);

    const notification = result.rows[0];

    // Emit to specific user
    io.to(`user_${userId}`).emit('new-notification', {
      ...notification,
      userId: userId
    });

    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
  }
}

// Notify about new bid
async function notifyNewBid(io, auctionId, bidData) {
  try {
    // Get auction details and previous highest bidder
    const auctionResult = await db.query(`
      SELECT a.title, a.seller_id, a.current_bid,
             b.bidder_id as previous_bidder_id
      FROM auctions a
      LEFT JOIN bids b ON a.id = b.auction_id AND b.amount = a.current_bid
      WHERE a.id = $1
    `, [auctionId]);

    if (auctionResult.rows.length === 0) return;

    const auction = auctionResult.rows[0];

    // Notify seller
    await createNotification(io, auction.seller_id, {
      title: 'New Bid Received!',
      message: `Someone bid $${bidData.amount} on your auction "${auction.title}"`,
      type: 'bid_received',
      auctionId: auctionId
    });

    // Notify previous highest bidder (if outbid)
    if (auction.previous_bidder_id && auction.previous_bidder_id !== bidData.userId) {
      await createNotification(io, auction.previous_bidder_id, {
        title: 'You\'ve been outbid!',
        message: `Someone bid $${bidData.amount} on "${auction.title}". Your bid was $${auction.current_bid}`,
        type: 'outbid',
        auctionId: auctionId
      });
    }

    // Broadcast to auction room
    io.to(`auction_${auctionId}`).emit('bid-update', bidData);
    io.to(`auction_${auctionId}`).emit('auction-update', {
      auctionId: auctionId,
      currentBid: bidData.amount,
      lastBidder: bidData.bidderName,
      timestamp: bidData.timestamp
    });

  } catch (error) {
    console.error('Notify new bid error:', error);
  }
}

// Notify about auction end
async function notifyAuctionEnd(io, auctionId) {
  try {
    const result = await db.query(`
      SELECT a.title, a.seller_id, a.current_bid,
             b.bidder_id as winner_id, u.full_name as winner_name
      FROM auctions a
      LEFT JOIN bids b ON a.id = b.auction_id AND b.amount = a.current_bid
      LEFT JOIN users u ON b.bidder_id = u.id
      WHERE a.id = $1
    `, [auctionId]);

    if (result.rows.length === 0) return;

    const auction = result.rows[0];

    // Notify seller
    await createNotification(io, auction.seller_id, {
      title: 'Auction Ended!',
      message: `Your auction "${auction.title}" ended. Final bid: $${auction.current_bid}`,
      type: 'auction_ended',
      auctionId: auctionId
    });

    // Notify winner
    if (auction.winner_id) {
      await createNotification(io, auction.winner_id, {
        title: 'Congratulations! You won!',
        message: `You won the auction for "${auction.title}" with a bid of $${auction.current_bid}`,
        type: 'auction_won',
        auctionId: auctionId
      });
    }

  } catch (error) {
    console.error('Notify auction end error:', error);
  }
}

module.exports = {
  createNotification,
  notifyNewBid,
  notifyAuctionEnd
};