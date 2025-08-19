import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import NotificationCenter from '@/components/notifications/NotificationCenter';
import UserProfile from '@/components/user/UserProfileSimple';
import { Bell, User, Zap, Volume2 } from 'lucide-react';

const Debug: React.FC = () => {
  const { user } = useAuth();

  const triggerDemoNotification = () => {
    const notifications = [
      {
        type: 'bid_approved',
        title: 'Bid Approved!',
        message: 'Your bid of $250 for "Vintage Clock" has been approved.',
        auction_id: '1',
        auction_title: 'Vintage Clock'
      },
      {
        type: 'outbid',
        title: 'You\'ve been outbid!',
        message: 'Someone placed a higher bid on "Antique Vase". Current bid: $180',
        auction_id: '2',
        auction_title: 'Antique Vase'
      },
      {
        type: 'auction_won',
        title: 'Congratulations!',
        message: 'You won the auction for "Gold Pocket Watch" with a bid of $450!',
        auction_id: '3',
        auction_title: 'Gold Pocket Watch'
      }
    ];

    const randomNotification = notifications[Math.floor(Math.random() * notifications.length)];
    
    // Dispatch custom event for demo notification
    const event = new CustomEvent('demo-notification', {
      detail: randomNotification
    });
    window.dispatchEvent(event);
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                Debug & Testing Page
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* User Info Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Current User</h3>
                <div className="p-4 bg-muted rounded-lg">
                  {user ? (
                    <div className="space-y-2">
                      <p><strong>Name:</strong> {user.full_name || 'N/A'}</p>
                      <p><strong>Email:</strong> {user.email}</p>
                      <p><strong>Role:</strong> {user.role || 'user'}</p>
                      <p><strong>ID:</strong> {user.id}</p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Not logged in</p>
                  )}
                </div>
              </div>

              {/* Notification Testing */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Testing
                </h3>
                
                <div className="space-y-4 p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-4 flex-wrap">
                    <Button onClick={triggerDemoNotification} className="flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      Trigger Demo Notification
                    </Button>
                    
                    <Button 
                      onClick={() => {
                        // Test sound directly
                        import('@/utils/notificationSound').then(({ notificationSound }) => {
                          notificationSound.testSound();
                        });
                      }} 
                      variant="outline" 
                      className="flex items-center gap-2"
                    >
                      <Volume2 className="h-4 w-4" />
                      Test Sound
                    </Button>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Notification Center:</span>
                      <NotificationCenter userId={user?.id} />
                    </div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    <p>💡 Tips:</p>
                    <ul className="ml-4 space-y-1">
                      <li>• Click the volume icon in the notification center to toggle sound</li>
                      <li>• Bell icon will bounce and show red badge count for new notifications</li>
                      <li>• Test Sound button helps check if your browser allows audio</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* User Profile Testing */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <User className="h-5 w-5" />
                  User Profile Testing
                </h3>
                
                <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                  <span className="text-sm text-muted-foreground">User Profile Dropdown:</span>
                  <UserProfile />
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Instructions</h3>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                  <p className="text-sm text-blue-800">
                    <strong>To test notifications:</strong>
                  </p>
                  <ul className="text-sm text-blue-700 space-y-1 ml-4">
                    <li>• Click "Trigger Demo Notification" to create a test notification</li>
                    <li>• Watch for the bell icon animation and sound</li>
                    <li>• Click the notification center bell icon to view notifications</li>
                  </ul>
                </div>
                
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-2">
                  <p className="text-sm text-green-800">
                    <strong>To test user profile:</strong>
                  </p>
                  <ul className="text-sm text-green-700 space-y-1 ml-4">
                    <li>• Make sure you're logged in (check user info above)</li>
                    <li>• Click the user profile avatar to open the dropdown</li>
                    <li>• Try the "Sign Out" option</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Debug;
