import { io, Socket } from 'socket.io-client';

export interface BidData {
  auctionId: string;
  userId: string;
  amount: number;
  bidderName: string;
  timestamp: string;
}

export interface AuctionUpdate {
  auctionId: string;
  currentBid: number;
  bidCount: number;
  lastBidder: string;
  timestamp: string;
}

export interface NotificationData {
  userId: string;
  type: string;
  title: string;
  message: string;
  auction_id: string;
  auction_title: string;
  created_at: string;
  read: boolean;
}

export interface AuctionActivityEvent {
  auctionId: string;
  sellerId?: string;
  title?: string;
  startingBid?: number;
  approval_status?: string;
  created_at?: string;
  timestamp?: string;
}

export interface BidModerationEvent {
  bidId: string;
  auctionId: string;
  amount: number;
  bidderId: string;
  bidderName?: string;
  timestamp: string;
}

class SocketService {
  private socket: Socket | null = null;
  private serverUrl: string;
  private reconnectCallbacks: Array<() => void> = [];
  private connectingPromise: Promise<Socket> | null = null;

  constructor() {
    this.serverUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
  }

  onReconnect(cb: () => void) { this.reconnectCallbacks.push(cb); }

  connect(): Promise<Socket> {
    // If already connected, resolve immediately
    if (this.socket?.connected) {
      return Promise.resolve(this.socket);
    }
    // If a connection is in progress, return the same promise
    if (this.connectingPromise) {
      return this.connectingPromise;
    }

    // If socket exists but not connected, reuse it; otherwise create
    if (!this.socket) {
      this.socket = io(this.serverUrl, {
        transports: ['websocket', 'polling'],
        timeout: 5000,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 500,
        reconnectionDelayMax: 5000,
      });
    }

    this.connectingPromise = new Promise((resolve, reject) => {
      const onConnect = () => {
        console.log('Connected to server:', this.socket?.id);
        this.socket?.off('connect_error', onError);
        this.connectingPromise = null;
        resolve(this.socket!);
      };
      const onError = (error: any) => {
        console.error('Connection error:', error);
        this.socket?.off('connect', onConnect);
        this.connectingPromise = null;
        reject(error);
      };

      // Ensure listeners are attached only once per attempt
      this.socket!.once('connect', onConnect);
      this.socket!.once('connect_error', onError);
    });

    return this.connectingPromise;
  }

  async fetchPendingPaymentEvents(userId: string) {
    try {
      const resp = await fetch(`/api/payments/events/pending/${userId}`);
      if (!resp.ok) return [];
      return await resp.json();
    } catch { return []; }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connectingPromise = null;
    }
  }

  joinAuction(auctionId: string) {
    if (this.socket?.connected) {
      this.socket.emit('join-auction', auctionId);
      console.log(`Joined auction room: ${auctionId}`);
    }
  }

  leaveAuction(auctionId: string) {
    if (this.socket?.connected) {
      this.socket.emit('leave-auction', auctionId);
      console.log(`Left auction room: ${auctionId}`);
    }
  }

  placeBid(bidData: BidData) {
    if (this.socket?.connected) {
      this.socket.emit('new-bid', bidData);
      console.log('Bid placed:', bidData);
    }
  }

  onBidUpdate(callback: (data: BidData) => void) {
    if (this.socket) {
      this.socket.on('bid-update', callback);
    }
  }

  onAuctionUpdate(callback: (data: AuctionUpdate) => void) {
    if (this.socket) {
      this.socket.on('auction-update', callback);
    }
  }

  onNewNotification(callback: (data: NotificationData) => void) {
    if (this.socket) {
      this.socket.on('new-notification', callback);
    }
  }

  onAuctionCreated(cb: (data: AuctionActivityEvent) => void) { this.socket?.on('auction-created', cb); }
  offAuctionCreated(cb?: (data: AuctionActivityEvent) => void) { this.socket?.off('auction-created', cb); }
  onAuctionDeleted(cb: (data: AuctionActivityEvent) => void) { this.socket?.on('auction-deleted', cb); }
  offAuctionDeleted(cb?: (data: AuctionActivityEvent) => void) { this.socket?.off('auction-deleted', cb); }
  onBidApproved(cb: (data: BidModerationEvent) => void) { this.socket?.on('bid-approved', cb); }
  offBidApproved(cb?: (data: BidModerationEvent) => void) { this.socket?.off('bid-approved', cb); }
  onBidRejected(cb: (data: BidModerationEvent) => void) { this.socket?.on('bid-rejected', cb); }
  offBidRejected(cb?: (data: BidModerationEvent) => void) { this.socket?.off('bid-rejected', cb); }
  onPaymentRequired(cb: (data: any) => void) { this.socket?.on('payment-required', cb); }
  offPaymentRequired(cb?: (data: any) => void) { this.socket?.off('payment-required', cb); }
  onPaymentCompleted(cb: (data: any) => void) { this.socket?.on('payment-completed', cb); }
  offPaymentCompleted(cb?: (data: any) => void) { this.socket?.off('payment-completed', cb); }

  offBidUpdate(callback?: (data: BidData) => void) {
    if (this.socket) {
      this.socket.off('bid-update', callback);
    }
  }

  offAuctionUpdate(callback?: (data: AuctionUpdate) => void) {
    if (this.socket) {
      this.socket.off('auction-update', callback);
    }
  }

  offNewNotification(callback?: (data: NotificationData) => void) {
    if (this.socket) {
      this.socket.off('new-notification', callback);
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

export const socketService = new SocketService();
