const { createNotification } = require('../routes/notifications');

class NotificationService {
  constructor() {
    this.io = null;
  }

  setSocketIO(io) {
    this.io = io;
  }

  async sendBidApprovalNotification(userId, itemTitle, auctionId) {
    try {
      // Create database notification
      await createNotification(
        userId,
        'bid_approved',
        'Your item has been approved!',
        `Your item "${itemTitle}" has been approved and is now live for bidding!`,
        auctionId
      );

      // Send real-time notification
      if (this.io) {
        this.io.emit('new-notification', {
          userId: userId,
          type: 'bid_approved',
          title: 'Your item has been approved!',
          message: `Your item "${itemTitle}" has been approved and is now live for bidding!`,
          auction_id: auctionId,
          auction_title: itemTitle,
          created_at: new Date().toISOString(),
          read: false
        });
      }
    } catch (error) {
      console.error('Failed to send bid approval notification:', error);
    }
  }

  async sendBidRejectionNotification(userId, itemTitle, reason) {
    try {
      // Create database notification
      await createNotification(
        userId,
        'bid_rejected',
        'Your item submission was not approved',
        `Your item "${itemTitle}" was not approved. Reason: ${reason || 'No reason provided'}`,
        null
      );

      // Send real-time notification
      if (this.io) {
        this.io.emit('new-notification', {
          userId: userId,
          type: 'bid_rejected',
          title: 'Your item submission was not approved',
          message: `Your item "${itemTitle}" was not approved. Reason: ${reason || 'No reason provided'}`,
          auction_id: null,
          auction_title: itemTitle,
          created_at: new Date().toISOString(),
          read: false
        });
      }
    } catch (error) {
      console.error('Failed to send bid rejection notification:', error);
    }
  }

  async sendAuctionLiveNotification(userId, itemTitle, auctionId) {
    try {
      // Create database notification
      await createNotification(
        userId,
        'auction_live',
        'Your auction is now live!',
        `Your item "${itemTitle}" is now live and accepting bids!`,
        auctionId
      );

      // Send real-time notification
      if (this.io) {
        this.io.emit('new-notification', {
          userId: userId,
          type: 'auction_live',
          title: 'Your auction is now live!',
          message: `Your item "${itemTitle}" is now live and accepting bids!`,
          auction_id: auctionId,
          auction_title: itemTitle,
          created_at: new Date().toISOString(),
          read: false
        });
      }
    } catch (error) {
      console.error('Failed to send auction live notification:', error);
    }
  }

  async sendOutbidNotification(userId, bidderName, amount, auctionTitle, auctionId) {
    try {
      // Create database notification
      await createNotification(
        userId,
        'outbid',
        'You have been outbid!',
        `${bidderName} placed a higher bid of $${amount} on "${auctionTitle}"`,
        auctionId
      );

      // Send real-time notification
      if (this.io) {
        this.io.emit('new-notification', {
          userId: userId,
          type: 'outbid',
          title: 'You have been outbid!',
          message: `${bidderName} placed a higher bid of $${amount} on "${auctionTitle}"`,
          auction_id: auctionId,
          auction_title: auctionTitle,
          created_at: new Date().toISOString(),
          read: false
        });
      }
    } catch (error) {
      console.error('Failed to send outbid notification:', error);
    }
  }

  async sendAuctionWonNotification(userId, auctionTitle, finalAmount, auctionId) {
    try {
      // Create database notification
      await createNotification(
        userId,
        'auction_won',
        'Congratulations! You won an auction!',
        `You won "${auctionTitle}" with a final bid of $${finalAmount}!`,
        auctionId
      );

      // Send real-time notification
      if (this.io) {
        this.io.emit('new-notification', {
          userId: userId,
          type: 'auction_won',
          title: 'Congratulations! You won an auction!',
          message: `You won "${auctionTitle}" with a final bid of $${finalAmount}!`,
          auction_id: auctionId,
          auction_title: auctionTitle,
          created_at: new Date().toISOString(),
          read: false
        });
      }
    } catch (error) {
      console.error('Failed to send auction won notification:', error);
    }
  }
}

const notificationService = new NotificationService();
module.exports = notificationService;
