import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { notificationSound } from '@/utils/notificationSound';
import { 
  Bell, 
  Send, 
  Gavel, 
  Trophy, 
  AlertCircle, 
  CheckCircle, 
  X, 
  Package,
  MessageSquare 
} from 'lucide-react';

interface DemoNotification {
  type: string;
  title: string;
  message: string;
  auction_id?: string;
  auction_title?: string;
}

const NotificationDemo = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notificationType, setNotificationType] = useState('bid_approved');
  const [customTitle, setCustomTitle] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [auctionTitle, setAuctionTitle] = useState('Vintage Ming Dynasty Vase');

  const notificationTypes = [
    { 
      value: 'bid_approved', 
      label: 'Bid Approved', 
      icon: CheckCircle, 
      color: 'text-green-600',
      defaultTitle: 'Bid Approved!',
      defaultMessage: 'Your bid has been approved and you are now participating in the auction.'
    },
    { 
      value: 'bid_rejected', 
      label: 'Bid Rejected', 
      icon: X, 
      color: 'text-red-600',
      defaultTitle: 'Bid Rejected',
      defaultMessage: 'Unfortunately, your bid could not be processed at this time.'
    },
    { 
      value: 'auction_live', 
      label: 'Auction Live', 
      icon: Gavel, 
      color: 'text-blue-600',
      defaultTitle: 'Auction Now Live!',
      defaultMessage: 'The auction you\'re watching has just started. Place your bids now!'
    },
    { 
      value: 'outbid', 
      label: 'Outbid Warning', 
      icon: AlertCircle, 
      color: 'text-orange-600',
      defaultTitle: 'You\'ve Been Outbid!',
      defaultMessage: 'Another bidder has placed a higher bid. Bid again to stay in the lead!'
    },
    { 
      value: 'auction_won', 
      label: 'Auction Won', 
      icon: Trophy, 
      color: 'text-yellow-600',
      defaultTitle: 'Congratulations! You Won!',
      defaultMessage: 'You have successfully won the auction! Proceed to payment.'
    },
    { 
      value: 'order', 
      label: 'Order Update', 
      icon: Package, 
      color: 'text-purple-600',
      defaultTitle: 'Order Update',
      defaultMessage: 'Your order status has been updated. Check your orders page for details.'
    },
    { 
      value: 'admin_message', 
      label: 'Admin Message', 
      icon: MessageSquare, 
      color: 'text-amber-600',
      defaultTitle: 'Message from Admin',
      defaultMessage: 'You have received an important message from the administration.'
    }
  ];

  const getCurrentNotification = () => {
    return notificationTypes.find(type => type.value === notificationType);
  };

  const handleSendNotification = () => {
    const currentType = getCurrentNotification();
    const notification: DemoNotification = {
      type: notificationType,
      title: customTitle || currentType?.defaultTitle || 'Demo Notification',
      message: customMessage || currentType?.defaultMessage || 'This is a demo notification.',
      auction_id: notificationType.includes('auction') ? 'demo-123' : undefined,
      auction_title: notificationType.includes('auction') ? auctionTitle : undefined
    };

    // Trigger the notification system via custom event
    const event = new CustomEvent('demo-notification', { detail: notification });
    window.dispatchEvent(event);

    // Also show toast notification
    toast({
      title: notification.title,
      description: notification.message,
      duration: 5000,
    });

    console.log('Demo Notification Sent:', notification);

    // Reset form
    setCustomTitle('');
    setCustomMessage('');
  };

  const handleTestAllSounds = () => {
    notificationTypes.forEach((type, index) => {
      setTimeout(() => {
        notificationSound.playNotificationSound(type.value);
        toast({
          title: `${type.label} Sound`,
          description: `Testing ${type.label.toLowerCase()} notification sound`,
          duration: 2000,
        });
      }, index * 1500); // Stagger the sounds
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50/30 to-orange-50/20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Bell className="h-10 w-10 text-amber-600" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-700 to-orange-600 bg-clip-text text-transparent">
                Notification Demo
              </h1>
            </div>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Test the real-time notification system with different types of alerts, sounds, and messages.
              Perfect for demonstrating bid alerts, auction updates, and admin messages.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Demo Controls */}
            <Card className="border-amber-200 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="border-b border-amber-100">
                <CardTitle className="flex items-center gap-2 text-amber-800">
                  <Send className="h-5 w-5" />
                  Send Demo Notification
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {/* Notification Type Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Notification Type
                  </label>
                  <Select value={notificationType} onValueChange={setNotificationType}>
                    <SelectTrigger className="border-amber-200 focus:border-amber-400 focus:ring-amber-400/20">
                      <SelectValue placeholder="Select notification type" />
                    </SelectTrigger>
                    <SelectContent>
                      {notificationTypes.map((type) => {
                        const Icon = type.icon;
                        return (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <Icon className={`h-4 w-4 ${type.color}`} />
                              <span>{type.label}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Custom Title */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Custom Title (optional)
                  </label>
                  <Input
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder={getCurrentNotification()?.defaultTitle}
                    className="border-amber-200 focus:border-amber-400 focus:ring-amber-400/20"
                  />
                </div>

                {/* Custom Message */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Custom Message (optional)
                  </label>
                  <Textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder={getCurrentNotification()?.defaultMessage}
                    rows={3}
                    className="border-amber-200 focus:border-amber-400 focus:ring-amber-400/20 resize-none"
                  />
                </div>

                {/* Auction Title (for auction-related notifications) */}
                {notificationType.includes('auction') && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">
                      Auction Title
                    </label>
                    <Input
                      value={auctionTitle}
                      onChange={(e) => setAuctionTitle(e.target.value)}
                      placeholder="Enter auction title"
                      className="border-amber-200 focus:border-amber-400 focus:ring-amber-400/20"
                    />
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button 
                    onClick={handleSendNotification} 
                    className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    Send Notification
                  </Button>
                  <Button 
                    onClick={handleTestAllSounds}
                    variant="outline"
                    className="border-amber-300 text-amber-700 hover:bg-amber-50"
                  >
                    Test All Sounds
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Preview & Info */}
            <div className="space-y-6">
              {/* Notification Preview */}
              <Card className="border-amber-200 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader className="border-b border-amber-100">
                  <CardTitle className="text-amber-800">
                    Preview
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="p-4 rounded-lg border border-amber-200 bg-amber-50/50">
                    <div className="flex items-start gap-3">
                      {getCurrentNotification() && (
                        React.createElement(getCurrentNotification()!.icon, { 
                          className: `h-5 w-5 mt-0.5 ${getCurrentNotification()?.color}` 
                        })
                      )}
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-800 mb-1">
                          {customTitle || getCurrentNotification()?.defaultTitle}
                        </h4>
                        <p className="text-sm text-slate-600">
                          {customMessage || getCurrentNotification()?.defaultMessage}
                        </p>
                        {notificationType.includes('auction') && (
                          <div className="mt-2">
                            <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800">
                              {auctionTitle}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="border-amber-200 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader className="border-b border-amber-100">
                  <CardTitle className="text-amber-800">
                    Quick Demo Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid gap-3">
                    <Button
                      onClick={() => {
                        setNotificationType('bid_approved');
                        setCustomTitle('Welcome to AntiquaBid!');
                        setCustomMessage('Your account has been verified. You can now start bidding on exclusive antique items.');
                        handleSendNotification();
                      }}
                      variant="outline"
                      className="justify-start border-green-200 text-green-700 hover:bg-green-50"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Welcome Message
                    </Button>
                    
                    <Button
                      onClick={() => {
                        setNotificationType('outbid');
                        setCustomTitle('Quick! You\'ve Been Outbid!');
                        setCustomMessage('Someone just placed a higher bid on your watched item. Act fast!');
                        setAuctionTitle('Rare Victorian Pocket Watch');
                        handleSendNotification();
                      }}
                      variant="outline"
                      className="justify-start border-orange-200 text-orange-700 hover:bg-orange-50"
                    >
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Bidding Alert
                    </Button>
                    
                    <Button
                      onClick={() => {
                        setNotificationType('admin_message');
                        setCustomTitle('System Maintenance Notice');
                        setCustomMessage('The platform will undergo maintenance tonight from 2-4 AM EST. All auctions will be paused during this time.');
                        handleSendNotification();
                      }}
                      variant="outline"
                      className="justify-start border-purple-200 text-purple-700 hover:bg-purple-50"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Admin Alert
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Instructions */}
          <Card className="mt-8 border-blue-200 shadow-lg bg-blue-50/30 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="font-semibold text-blue-800 mb-2">How to Test</h3>
                <p className="text-blue-700 text-sm">
                  1. Select a notification type • 2. Customize title/message (optional) • 3. Click "Send Notification" • 4. Watch for the animated bell icon and listen for sounds • 5. Check the notification dropdown in the top navigation
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NotificationDemo;
