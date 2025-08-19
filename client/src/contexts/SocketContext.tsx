import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { socketService, BidData, AuctionUpdate } from '@/services/socketService';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

interface NotificationData {
  userId: string;
  type: string;
  title: string;
  message: string;
  auction_id: string;
  auction_title: string;
  created_at: string;
  read: boolean;
}

interface SocketContextType {
  isConnected: boolean;
  joinAuction: (auctionId: string) => void;
  leaveAuction: (auctionId: string) => void;
  placeBid: (auctionId: string, amount: number) => void;
  currentAuction: string | null;
  recentBids: Record<string, BidData[]>;
  auctionUpdates: Record<string, AuctionUpdate>;
  onNewNotification: (callback: (notification: NotificationData) => void) => void;
  offNewNotification: (callback?: (notification: NotificationData) => void) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [currentAuction, setCurrentAuction] = useState<string | null>(null);
  const [recentBids, setRecentBids] = useState<Record<string, BidData[]>>({});
  const [auctionUpdates, setAuctionUpdates] = useState<Record<string, AuctionUpdate>>({});
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;
    let errorToastShown = false; // prevent spam
    let reconnectAttempts = 0;

    const initializeSocket = async () => {
      try {
        // Re-enabled socket connection
        await socketService.connect();
        if (mounted) {
          setIsConnected(true);
          setupSocketListeners();
        }
      } catch (error) {
        console.error('Failed to connect to socket server:', error);
        if (mounted && !errorToastShown) {
          errorToastShown = true;
          toast({
            title: 'Connection Error',
            description: 'Failed to connect to live bidding server',
            variant: 'destructive'
          });
        }
      }
    };

    const setupSocketListeners = () => {
      // Listen for bid updates
      socketService.onBidUpdate((bidData: BidData) => {
        console.log('Received bid update:', bidData);
        
        setRecentBids(prev => ({
          ...prev,
          [bidData.auctionId]: [
            bidData,
            ...(prev[bidData.auctionId] || []).slice(0, 9) // Keep last 10 bids
          ]
        }));

        // Show toast notification for new bids
        if (bidData.userId !== user?.id) {
          toast({
            title: "New Bid!",
            description: `${bidData.bidderName} bid $${bidData.amount}`,
            duration: 3000,
          });
        }
      });

      // Listen for auction updates
      socketService.onAuctionUpdate((updateData: AuctionUpdate) => {
        console.log('Received auction update:', updateData);
        
        setAuctionUpdates(prev => ({
          ...prev,
          [updateData.auctionId]: updateData
        }));
      });

      // Listen for real-time notifications
      socketService.onNewNotification((notificationData: NotificationData) => {
        console.log('Received new notification:', notificationData);
        
        // Only show notifications for the current user
        if (notificationData.userId === user?.id) {
          toast({
            title: notificationData.title,
            description: notificationData.message,
            duration: 5000,
          });
          
          // Trigger a refresh of notifications in the navbar
          window.dispatchEvent(new CustomEvent('newNotification', { detail: notificationData }));
        }
      });

      // Handle socket connection events
      const socket = socketService.getSocket();
      if (socket) {
        socket.on('connect', () => {
          setIsConnected(true);
          reconnectAttempts = 0;
          errorToastShown = false; // allow future error toast after recovery
          console.log('Socket connected');
        });

        socket.on('disconnect', () => {
          setIsConnected(false);
          console.log('Socket disconnected');
        });

        socket.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
          setIsConnected(false);
          reconnectAttempts += 1;
          if (!errorToastShown) {
            errorToastShown = true;
            toast({
              title: 'Live Updates Unavailable',
              description: 'Real-time bidding temporarily unavailable. Retrying...',
              variant: 'destructive'
            });
          }
        });
      }
    };

    initializeSocket();

    return () => {
      mounted = false;
      socketService.offBidUpdate();
      socketService.offAuctionUpdate();
      socketService.offNewNotification();
      socketService.disconnect();
      setIsConnected(false);
    };
  }, [user, toast]);

  const joinAuction = (auctionId: string) => {
    if (currentAuction && currentAuction !== auctionId) {
      socketService.leaveAuction(currentAuction);
    }
    
    socketService.joinAuction(auctionId);
    setCurrentAuction(auctionId);
    
    // Initialize bids array for this auction if it doesn't exist
    if (!recentBids[auctionId]) {
      setRecentBids(prev => ({
        ...prev,
        [auctionId]: []
      }));
    }
  };

  const leaveAuction = (auctionId: string) => {
    socketService.leaveAuction(auctionId);
    if (currentAuction === auctionId) {
      setCurrentAuction(null);
    }
  };

  const placeBid = (auctionId: string, amount: number) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to place a bid",
        variant: "destructive"
      });
      return;
    }

    if (!isConnected) {
      toast({
        title: "Connection Error",
        description: "Not connected to live bidding server",
        variant: "destructive"
      });
      return;
    }

    const bidData: BidData = {
      auctionId,
      userId: user.id,
      amount,
      bidderName: user.full_name || user.email || 'Anonymous',
      timestamp: new Date().toISOString()
    };

    socketService.placeBid(bidData);

    // Optimistically update local state
    setRecentBids(prev => ({
      ...prev,
      [auctionId]: [
        bidData,
        ...(prev[auctionId] || []).slice(0, 9)
      ]
    }));

    toast({
      title: "Bid Placed!",
      description: `Your bid of $${amount} has been submitted`,
    });
  };

  const onNewNotification = (callback: (notification: NotificationData) => void) => {
    socketService.onNewNotification(callback);
  };

  const offNewNotification = (callback?: (notification: NotificationData) => void) => {
    socketService.offNewNotification(callback);
  };

  const contextValue: SocketContextType = {
    isConnected,
    joinAuction,
    leaveAuction,
    placeBid,
    currentAuction,
    recentBids,
    auctionUpdates,
    onNewNotification,
    offNewNotification,
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
