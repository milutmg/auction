import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { useToast } from '@/hooks/use-toast';
import { 
  MessageCircle, 
  Send, 
  Gavel, 
  Trophy, 
  DollarSign, 
  Users, 
  Crown,
  Heart,
  Zap,
  AlertCircle,
  TrendingUp,
  History,
  Eye
} from 'lucide-react';

interface ChatMessage {
  id: string;
  type: 'message' | 'bid' | 'system';
  user: {
    id: string;
    name: string;
    avatar?: string;
    role?: string;
  };
  content: string;
  amount?: number;
  timestamp: string;
  auction_id: string;
}

interface LiveBiddingChatProps {
  auctionId: string;
  auctionTitle: string;
  currentBid?: number;
  onBidPlaced?: (amount: number) => void;
}

const LiveBiddingChat: React.FC<LiveBiddingChatProps> = ({
  auctionId,
  auctionTitle,
  currentBid = 0,
  onBidPlaced
}) => {
  const { user } = useAuth();
  const { isConnected } = useSocket();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [activeUsers, setActiveUsers] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mock real-time functionality - In real app, this would connect to WebSocket
  useEffect(() => {
    // Simulate some initial messages
    const initialMessages: ChatMessage[] = [
      {
        id: '1',
        type: 'system',
        user: { id: 'system', name: 'System' },
        content: `Welcome to the live auction for "${auctionTitle}"!`,
        timestamp: new Date(Date.now() - 300000).toISOString(),
        auction_id: auctionId
      },
      {
        id: '2',
        type: 'bid',
        user: { id: '2', name: 'ArtCollector92', role: 'premium' },
        content: 'placed a bid',
        amount: 150,
        timestamp: new Date(Date.now() - 240000).toISOString(),
        auction_id: auctionId
      },
      {
        id: '3',
        type: 'message',
        user: { id: '3', name: 'VintageExpert' },
        content: 'This piece has amazing craftsmanship! The detail work is extraordinary.',
        timestamp: new Date(Date.now() - 180000).toISOString(),
        auction_id: auctionId
      },
      {
        id: '4',
        type: 'bid',
        user: { id: '4', name: 'AntiqueHunter', role: 'premium' },
        content: 'placed a bid',
        amount: 175,
        timestamp: new Date(Date.now() - 120000).toISOString(),
        auction_id: auctionId
      },
      {
        id: '5',
        type: 'message',
        user: { id: '5', name: 'MuseumCurator' },
        content: 'The provenance documentation looks authentic. Great find!',
        timestamp: new Date(Date.now() - 60000).toISOString(),
        auction_id: auctionId
      }
    ];

    setMessages(initialMessages);
    setActiveUsers(Math.floor(Math.random() * 15) + 5); // Random 5-20 users

    // Simulate real-time messages
    const interval = setInterval(() => {
      if (Math.random() > 0.7) { // 30% chance every 5 seconds
        const randomMessages = [
          'Beautiful piece!',
          'What\'s the estimated age?',
          'This would look perfect in my collection',
          'The bidding is getting intense!',
          'Anyone know the artist?',
          'Incredible detail work',
          'This is going higher than I expected',
          'Worth every penny!',
          'The condition looks pristine'
        ];

        const randomUsers = [
          { id: 'u1', name: 'CollectorPro', role: 'premium' },
          { id: 'u2', name: 'ArtLover23' },
          { id: 'u3', name: 'VintageSeeker' },
          { id: 'u4', name: 'HistoryBuff', role: 'premium' },
          { id: 'u5', name: 'CuriosityShop' }
        ];

        const randomUser = randomUsers[Math.floor(Math.random() * randomUsers.length)];
        const randomMessage = randomMessages[Math.floor(Math.random() * randomMessages.length)];

        const newMsg: ChatMessage = {
          id: `random-${Date.now()}`,
          type: 'message',
          user: randomUser,
          content: randomMessage,
          timestamp: new Date().toISOString(),
          auction_id: auctionId
        };

        setMessages(prev => [...prev, newMsg]);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [auctionId, auctionTitle]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      type: 'message',
      user: {
        id: user.id,
        name: user.full_name || 'Anonymous',
        role: user.role
      },
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
      auction_id: auctionId
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // In real app, send to WebSocket server
    toast({
      title: "Message sent",
      description: "Your message has been posted to the chat",
      duration: 2000,
    });
  };

  const handlePlaceBid = async () => {
    const amount = parseFloat(bidAmount);
    const minimumBid = currentBid + 1;

    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to place a bid",
        variant: "destructive"
      });
      return;
    }

    if (isNaN(amount) || amount < minimumBid) {
      toast({
        title: "Invalid bid amount",
        description: `Bid must be at least $${minimumBid}`,
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create bid message
      const bidMessage: ChatMessage = {
        id: `bid-${Date.now()}`,
        type: 'bid',
        user: {
          id: user.id,
          name: user.full_name || 'Anonymous',
          role: user.role
        },
        content: 'placed a bid',
        amount: amount,
        timestamp: new Date().toISOString(),
        auction_id: auctionId
      };

      setMessages(prev => [...prev, bidMessage]);
      setBidAmount('');
      
      // Call parent callback
      if (onBidPlaced) {
        onBidPlaced(amount);
      }

      toast({
        title: "Bid placed successfully!",
        description: `Your bid of $${amount} has been submitted`,
        duration: 3000,
      });

    } catch (error) {
      toast({
        title: "Failed to place bid",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'bid':
        return <Gavel className="h-4 w-4 text-amber-500" />;
      case 'system':
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <MessageCircle className="h-4 w-4 text-slate-500" />;
    }
  };

  const getUserBadge = (role?: string) => {
    if (role === 'premium') {
      return <Crown className="h-3 w-3 text-amber-500 ml-1" />;
    }
    if (role === 'admin') {
      return <Badge className="ml-1 text-xs px-1 py-0 bg-red-100 text-red-700">Admin</Badge>;
    }
    return null;
  };

  // Get bidding history and stats
  const bids = messages.filter(m => m.type === 'bid').sort((a, b) => (b.amount || 0) - (a.amount || 0));
  const highestBid = bids[0]?.amount || currentBid;
  const totalBids = bids.length;
  const uniqueBidders = new Set(bids.map(bid => bid.user.id)).size;

  return (
    <Card className="h-full max-h-[700px] border-amber-200 shadow-lg bg-gradient-to-br from-white/95 to-amber-50/30 backdrop-blur-sm">
      <CardHeader className="pb-2 border-b border-amber-100">
        <CardTitle className="text-lg text-amber-800 mb-2">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="h-5 w-5 text-amber-600" />
            <span className="truncate">{auctionTitle}</span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center p-2 bg-amber-50 rounded-lg border border-amber-200">
              <div className="text-amber-700 font-semibold">${highestBid}</div>
              <div className="text-xs text-amber-600">Current Bid</div>
            </div>
            <div className="text-center p-2 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-blue-700 font-semibold">{totalBids}</div>
              <div className="text-xs text-blue-600">Total Bids</div>
            </div>
            <div className="text-center p-2 bg-green-50 rounded-lg border border-green-200">
              <div className="text-green-700 font-semibold">{activeUsers}</div>
              <div className="text-xs text-green-600">Watching</div>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0 flex flex-col h-full">
        {/* Messages Area */}
        <ScrollArea ref={chatContainerRef} className="flex-1 max-h-[400px] p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {getMessageIcon(message.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-sm font-medium ${
                      message.type === 'system' ? 'text-blue-600' : 
                      message.type === 'bid' ? 'text-amber-700' : 'text-slate-700'
                    }`}>
                      {message.user.name}
                    </span>
                    {getUserBadge(message.user.role)}
                    <span className="text-xs text-slate-400 ml-auto">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                  
                  <div className={`text-sm rounded-lg px-3 py-2 ${
                    message.type === 'system' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                    message.type === 'bid' ? 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-800 border border-amber-200' :
                    message.user.id === user?.id ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-800 border border-blue-200 ml-8' :
                    'bg-slate-50 text-slate-700 border border-slate-200'
                  }`}>
                    {message.type === 'bid' ? (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        <span className="font-semibold">${message.amount}</span>
                        <span>- {message.content}</span>
                        {message.amount === Math.max(...messages.filter(m => m.type === 'bid').map(m => m.amount || 0)) && (
                          <Trophy className="h-4 w-4 text-yellow-500 ml-1" />
                        )}
                      </div>
                    ) : (
                      <span>{message.content}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Areas */}
        {user && (
          <div className="border-t border-amber-100 p-4 bg-gradient-to-r from-amber-50/50 to-orange-50/30 space-y-3">
            {/* Bid Input */}
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  type="number"
                  placeholder={`Min: $${currentBid + 1}`}
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  className="border-amber-200 focus:border-amber-400 focus:ring-amber-400/20"
                  min={currentBid + 1}
                />
              </div>
              <Button 
                onClick={handlePlaceBid}
                disabled={isLoading || !bidAmount.trim()}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-md"
              >
                <Gavel className="h-4 w-4 mr-2" />
                {isLoading ? 'Bidding...' : 'Bid'}
              </Button>
            </div>

            {/* Message Input */}
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="border-amber-200 focus:border-amber-400 focus:ring-amber-400/20"
                />
              </div>
              <Button 
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                variant="outline"
                className="border-amber-300 text-amber-700 hover:bg-amber-50"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {!user && (
          <div className="border-t border-amber-100 p-4 bg-gradient-to-r from-amber-50/50 to-orange-50/30">
            <div className="text-center text-slate-600">
              <p className="text-sm mb-2">Sign in to participate in the chat and place bids</p>
              <Button 
                variant="outline"
                className="border-amber-300 text-amber-700 hover:bg-amber-50"
                onClick={() => window.location.href = '/auth'}
              >
                Sign In
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LiveBiddingChat;
