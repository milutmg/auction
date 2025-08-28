import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { useToast } from '@/hooks/use-toast';
import { Clock, Gavel, Users, Wifi, WifiOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import LiveBiddingChat from '@/components/bidding/LiveBiddingChat';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface Auction {
  id: string;
  title: string;
  image_url: string;
  starting_bid: number;
  current_bid: number;
  end_time: string;
  status: string;
  seller_id: string;
  profiles: {
    full_name: string;
  };
}

interface Bid {
  id: string;
  amount: number;
  created_at: string;
  auction_id: string;
  profiles: {
    full_name: string;
  };
}

const LiveBidding = () => {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [bidAmounts, setBidAmounts] = useState<Record<string, string>>({});
  const [selectedAuctionId, setSelectedAuctionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { isConnected, joinAuction, leaveAuction, placeBid, recentBids, auctionUpdates } = useSocket();
  const { toast } = useToast();

  useEffect(() => {
    fetchActiveAuctions();
  }, []);

  // Auto-join auctions when they load
  useEffect(() => {
    auctions.forEach(auction => {
      joinAuction(auction.id);
    });

    return () => {
      auctions.forEach(auction => {
        leaveAuction(auction.id);
      });
    };
  }, [auctions, joinAuction, leaveAuction]);

  // Update auction current bids from socket updates
  useEffect(() => {
    setAuctions(prev => 
      prev.map(auction => {
        const update = auctionUpdates[auction.id];
        if (update) {
          return { ...auction, current_bid: update.currentBid };
        }
        // Also check recent bids for current bid updates
        const latestBid = recentBids[auction.id]?.[0];
        if (latestBid && latestBid.amount > auction.current_bid) {
          return { ...auction, current_bid: latestBid.amount };
        }
        return auction;
      })
    );
  }, [auctionUpdates, recentBids]);
  const fetchActiveAuctions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auctions?status=active`, {
        headers: {
          'Content-Type': 'application/json',
          // Include auth header if user is logged in
          ...(user && { 'Authorization': `Bearer ${localStorage.getItem('token')}` })
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const activeAuctions = await response.json();
      
      // Transform the data to match the expected interface
      const transformedAuctions = activeAuctions.map((auction: any) => ({
        id: auction.id,
        title: auction.title,
        image_url: auction.image_url,
        starting_bid: parseFloat(auction.starting_bid),
        current_bid: parseFloat(auction.current_bid || auction.starting_bid),
        end_time: auction.end_time,
        status: auction.status,
        seller_id: auction.seller_id || 'unknown',
        profiles: { 
          full_name: auction.seller_name || 'Unknown Seller'
        }
      }));

      setAuctions(transformedAuctions);

    } catch (error) {
      console.error('Error fetching auctions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch live auctions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceBid = async (auctionId: string) => {
    const bidAmount = parseFloat(bidAmounts[auctionId]);
    const auction = auctions.find(a => a.id === auctionId);
    
    if (!auction) return;

    const minimumBid = auction.current_bid ? auction.current_bid + 1 : auction.starting_bid;

    if (isNaN(bidAmount) || bidAmount < minimumBid) {
      toast({
        title: "Invalid Bid",
        description: `Bid must be at least $${minimumBid}`,
        variant: "destructive"
      });
      return;
    }

    try {
      // Place bid via backend API
      const response = await fetch(`${API_BASE_URL}/bids`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          auctionId,
          amount: bidAmount
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to place bid');
      }

      const result = await response.json();
      
      // Clear the bid input
      setBidAmounts(prev => ({ ...prev, [auctionId]: '' }));
      
      // Also emit via socket for real-time updates to other users
      placeBid(auctionId, bidAmount);
      
      // Update local auction state immediately
      setAuctions(prev => 
        prev.map(a => 
          a.id === auctionId 
            ? { ...a, current_bid: bidAmount }
            : a
        )
      );

      toast({
        title: "Success",
        description: "Bid placed successfully!",
        variant: "default"
      });

    } catch (error) {
      console.error('Error placing bid:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to place bid",
        variant: "destructive"
      });
    }
  };

  const getTimeRemaining = (endTime: string) => {
    if (!endTime) return 'No end time set';
    
    const now = new Date();
    const end = new Date(endTime);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ended';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center">Loading live auctions...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Live Bidding
          </h1>
          <p className="text-muted-foreground mt-2">
            Watch auctions unfold in real-time and place your bids
          </p>
        </div>

        {auctions.length === 0 ? (
          <div className="text-center py-12">
            <Gavel className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Active Auctions</h3>
            <p className="text-muted-foreground">
              There are currently no live auctions. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Auction Cards */}
            <div className="lg:col-span-2 grid gap-6 md:grid-cols-2">
              {auctions.map((auction) => (
                <Card key={auction.id} className="overflow-hidden border-0 bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                  <div className="aspect-video relative overflow-hidden">
                    <img
                      src={auction.image_url || '/placeholder.svg'}
                      alt={auction.title}
                      className="w-full h-full object-cover"
                    />
                    <Badge className="absolute top-2 right-2 bg-green-500">
                      LIVE
                    </Badge>
                  </div>
                  
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">
                      <Link to={`/auction/${auction.id}`} className="hover:text-primary transition-colors">
                        {auction.title}
                      </Link>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Seller: {auction.profiles?.full_name || 'Unknown'}
                    </p>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Starting:</span>
                        <p className="font-semibold">${auction.starting_bid}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Current:</span>
                        <p className="font-semibold text-primary">
                          ${auction.current_bid || auction.starting_bid}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {getTimeRemaining(auction.end_time)}
                    </div>

                    {user && (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            placeholder="Enter bid amount"
                            value={bidAmounts[auction.id] || ''}
                            onChange={(e) => setBidAmounts(prev => ({ ...prev, [auction.id]: e.target.value }))}
                            min={auction.current_bid ? auction.current_bid + 1 : auction.starting_bid}
                          />
                          <Button onClick={() => handlePlaceBid(auction.id)} size="sm">
                            Bid
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Min bid: ${auction.current_bid ? auction.current_bid + 1 : auction.starting_bid}
                        </p>
                      </div>
                    )}

                    {recentBids[auction.id] && recentBids[auction.id].length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Users className="h-4 w-4" />
                          Recent Bids
                          {isConnected ? (
                            <Wifi className="h-3 w-3 text-green-500" />
                          ) : (
                            <WifiOff className="h-3 w-3 text-red-500" />
                          )}
                        </div>
                        <div className="space-y-1 max-h-20 overflow-y-auto">
                          {recentBids[auction.id].slice(0, 3).map((bid, index) => (
                            <div key={`${bid.auctionId}-${bid.timestamp}-${index}`} className="flex justify-between text-xs">
                              <span>{bid.bidderName || 'Anonymous'}</span>
                              <span className="font-semibold">${bid.amount}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Live Chat Sidebar */}
            {auctions.length > 0 && (
              <div className="lg:col-span-1">
                <div className="sticky top-24">
                  <LiveBiddingChat
                    auctionId={auctions[0].id}
                    auctionTitle={auctions[0].title}
                    currentBid={auctions[0].current_bid || auctions[0].starting_bid}
                    onBidPlaced={(amount) => {
                      // Update the auction's current bid when a bid is placed through chat
                      setAuctions(prev => 
                        prev.map(a => 
                          a.id === auctions[0].id 
                            ? { ...a, current_bid: amount }
                            : a
                        )
                      );
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveBidding;