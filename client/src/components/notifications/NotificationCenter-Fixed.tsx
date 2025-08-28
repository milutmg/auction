import React, { useState, useEffect } from 'react';
import { Bell, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  auction_id?: string;
  auction_title?: string;
  created_at: string;
  read: boolean;
}

interface NotificationCenterProps {
  userId?: string;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ userId }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const socket = useSocket();

  // Load notifications on component mount
  useEffect(() => {
    loadNotifications();
  }, [userId]);

  // Listen for real-time notifications via Socket.IO
  useEffect(() => {
    if (!socket.isConnected) return;

    const handleNewNotification = (notificationData: any) => {
      console.log('Real-time notification received:', notificationData);
      
      // Only process notifications for the current user
      if (notificationData.userId === user?.id) {
        const newNotification: Notification = {
          id: `realtime-${Date.now()}`,
          type: notificationData.type,
          title: notificationData.title,
          message: notificationData.message,
          auction_id: notificationData.auction_id,
          auction_title: notificationData.auction_title,
          created_at: new Date().toISOString(),
          read: false
        };

        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Trigger bell animation
        setHasNewNotification(true);
        setTimeout(() => setHasNewNotification(false), 2000);
        
        // Show toast notification
        toast({
          title: notificationData.title,
          description: notificationData.message,
          duration: 5000,
        });
      }
    };

    // Listen for socket notifications
    socket.onNewNotification(handleNewNotification);

    return () => {
      socket.offNewNotification(handleNewNotification);
    };
  }, [socket.isConnected, user?.id, toast]);

  const loadNotifications = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No auth token found');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
        setUnreadCount(data.filter((n: Notification) => !n.read).length);
      } else {
        console.error('Failed to load notifications:', response.status);
        // For demo purposes, create some mock notifications
        const mockNotifications: Notification[] = [
          {
            id: '1',
            type: 'outbid',
            title: 'You have been outbid!',
            message: 'Someone placed a higher bid on "Vintage Watch"',
            auction_id: '123',
            auction_title: 'Vintage Watch',
            created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
            read: false
          },
          {
            id: '2',
            type: 'auction_ending',
            title: 'Auction ending soon',
            message: 'The auction for "Antique Vase" ends in 1 hour',
            auction_id: '456',
            auction_title: 'Antique Vase',
            created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            read: true
          }
        ];
        setNotifications(mockNotifications);
        setUnreadCount(mockNotifications.filter(n => !n.read).length);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      // Fallback to demo notifications for development
      const demoNotifications: Notification[] = [
        {
          id: 'demo-1',
          type: 'welcome',
          title: 'Welcome to AntiquaBid!',
          message: 'Start bidding on amazing antique items',
          created_at: new Date().toISOString(),
          read: false
        }
      ];
      setNotifications(demoNotifications);
      setUnreadCount(1);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
      
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await fetch(`${API_BASE_URL}/notifications/mark-all-read`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'outbid':
        return '🔥';
      case 'auction_ending':
        return '⏰';
      case 'win':
        return '🏆';
      case 'new_auction':
        return '🏺';
      default:
        return '🔔';
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={`relative transition-all duration-200 ${
            hasNewNotification ? 'animate-bounce' : ''
          }`}
        >
          <Bell className={`h-5 w-5 ${hasNewNotification ? 'text-orange-500' : ''}`} />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs bg-red-500 text-white border-2 border-background animate-pulse"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notifications</CardTitle>
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={markAllAsRead}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Mark all read
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-80">
              {loading ? (
                <div className="flex items-center justify-center h-20">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-20 text-muted-foreground">
                  <Bell className="h-8 w-8 mb-2" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 hover:bg-accent/50 transition-colors cursor-pointer border-l-4 ${
                        notification.read 
                          ? 'border-l-transparent bg-muted/30' 
                          : 'border-l-primary bg-primary/5'
                      }`}
                      onClick={() => !notification.read && markAsRead(notification.id)}
                    >
                      <div className="flex items-start space-x-3">
                        <span className="text-lg flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${
                            notification.read ? 'text-muted-foreground' : 'text-foreground'
                          }`}>
                            {notification.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-muted-foreground">
                              {getTimeAgo(notification.created_at)}
                            </span>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-primary rounded-full"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationCenter;
