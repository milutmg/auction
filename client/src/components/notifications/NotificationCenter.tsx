import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, Check, X, Package, Gavel, Trophy, AlertCircle, CheckCircle, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { socketService } from '@/services/socketService';
import { notificationSound } from '@/utils/notificationSound';

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
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Initialize sound permission on first user interaction
  const initializeSound = useCallback(async () => {
    if (soundEnabled) {
      await notificationSound.requestAudioPermission();
    }
  }, [soundEnabled]);

  // Global notification handler for demo notifications
  useEffect(() => {
    const handleDemoNotification = async (event: CustomEvent) => {
      console.log('Demo notification received:', event.detail);
      try {
        const notification = event.detail;
        const newNotification: Notification = {
          id: `demo-${Date.now()}`,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          auction_id: notification.auction_id,
          auction_title: notification.auction_title,
          created_at: new Date().toISOString(),
          read: false
        };

        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Clear any existing animation timeout
        if (animationTimeoutRef.current) {
          clearTimeout(animationTimeoutRef.current);
        }
        
        // Trigger bell animation
        setHasNewNotification(true);
        animationTimeoutRef.current = setTimeout(() => {
          setHasNewNotification(false);
          animationTimeoutRef.current = null;
        }, 2000);
        
        // Play notification sound with user interaction check
        if (soundEnabled) {
          try {
            await initializeSound();
            notificationSound.playNotificationSound(notification.type);
          } catch (soundError) {
            console.log('Could not play notification sound:', soundError);
          }
        }
        
        // Show toast notification
        toast({
          title: notification.title,
          description: notification.message,
          duration: 5000,
        });
      } catch (error) {
        console.error('Error handling demo notification:', error);
      }
    };

    window.addEventListener('demo-notification', handleDemoNotification as EventListener);
    return () => {
      window.removeEventListener('demo-notification', handleDemoNotification as EventListener);
      // Cleanup animation timeout
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, [toast]);

  useEffect(() => {
    fetchNotifications();
    
    // Connect to socket for real-time notifications
    socketService.connect().then(() => {
      socketService.onNewNotification(handleNewNotification);
    }).catch(error => {
      console.error('Failed to connect to socket service:', error);
    });

    return () => {
      socketService.offNewNotification(handleNewNotification);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const notificationsData = await response.json();
        setNotifications(notificationsData);
        setUnreadCount(notificationsData.filter((n: Notification) => !n.read).length);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewNotification = (notification: any) => {
    // Only show notifications for the current user
    if (userId && notification.userId === userId) {
      const newNotification: Notification = {
        id: `new-${Date.now()}`,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        auction_id: notification.auction_id,
        auction_title: notification.auction_title,
        created_at: notification.created_at,
        read: false
      };

      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Trigger bell animation
      setHasNewNotification(true);
      setTimeout(() => setHasNewNotification(false), 2000);
      
      // Play notification sound based on type
      notificationSound.playNotificationSound(notification.type);

      // Show toast notification
      toast({
        title: notification.title,
        description: notification.message,
        duration: 5000,
      });
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId ? { ...n, read: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, read: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'bid_approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'bid_rejected':
        return <X className="h-5 w-5 text-red-500" />;
      case 'auction_live':
        return <Gavel className="h-5 w-5 text-blue-500" />;
      case 'outbid':
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case 'auction_won':
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 'order':
        return <Package className="h-5 w-5 text-purple-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'bid_approved':
      case 'auction_won':
        return 'border-green-200 bg-green-50';
      case 'bid_rejected':
        return 'border-red-200 bg-red-50';
      case 'auction_live':
        return 'border-blue-200 bg-blue-50';
      case 'outbid':
        return 'border-orange-200 bg-orange-50';
      case 'order':
        return 'border-purple-200 bg-purple-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="relative">
            <Bell 
              className={`h-5 w-5 transition-transform duration-300 ${
                hasNewNotification ? 'animate-bounce text-blue-500' : ''
              }`} 
            />
            {unreadCount > 0 && (
              <Badge className={`absolute -top-2 -right-2 px-1 min-w-[1.25rem] h-5 animate-pulse ${
                hasNewNotification ? 'bg-red-500' : ''
              }`}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notifications</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSoundEnabled(!soundEnabled);
                    notificationSound.setSoundEnabled(!soundEnabled);
                    if (!soundEnabled) {
                      notificationSound.testSound();
                    }
                  }}
                  className={`text-sm ${soundEnabled ? 'text-primary' : 'text-muted-foreground'}`}
                  title={soundEnabled ? 'Disable notification sounds' : 'Enable notification sounds'}
                >
                  <Volume2 className="h-4 w-4" />
                </Button>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-sm text-muted-foreground hover:text-primary"
                  >
                    Mark all read
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <Separator />
          <ScrollArea className="max-h-96">
            <CardContent className="p-0">
              {loading ? (
                <div className="p-4 text-center text-muted-foreground">
                  Loading notifications...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                        !notification.read ? 'bg-blue-50/50' : ''
                      }`}
                      onClick={() => !notification.read && markAsRead(notification.id)}
                    >
                      <div className="flex items-start space-x-3">
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-medium truncate">
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {formatDate(notification.created_at)}
                            </span>
                            {notification.auction_id && (
                              <Badge variant="secondary" className="text-xs">
                                Auction
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </ScrollArea>
        </Card>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationCenter;
