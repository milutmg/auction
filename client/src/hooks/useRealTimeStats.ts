import { useState, useEffect } from 'react';
import { useSocket } from '@/contexts/SocketContext';

interface RealTimeStats {
  totalUsers: number;
  activeAuctions: number;
  totalBids: number;
  revenue: number;
}

export const useRealTimeStats = () => {
  const [stats, setStats] = useState<RealTimeStats>({
    totalUsers: 0,
    activeAuctions: 0,
    totalBids: 0,
    revenue: 0
  });

  const { isConnected } = useSocket();

  useEffect(() => {
    if (!isConnected) return;

    // Listen for real-time stat updates
    const socket = window.io?.();
    if (socket) {
      socket.on('stats-update', (newStats: RealTimeStats) => {
        setStats(newStats);
      });

      socket.on('new-bid', () => {
        setStats(prev => ({
          ...prev,
          totalBids: prev.totalBids + 1
        }));
      });

      socket.on('new-user', () => {
        setStats(prev => ({
          ...prev,
          totalUsers: prev.totalUsers + 1
        }));
      });

      socket.on('auction-created', () => {
        setStats(prev => ({
          ...prev,
          activeAuctions: prev.activeAuctions + 1
        }));
      });

      return () => {
        socket.off('stats-update');
        socket.off('new-bid');
        socket.off('new-user');
        socket.off('auction-created');
      };
    }
  }, [isConnected]);

  return stats;
};