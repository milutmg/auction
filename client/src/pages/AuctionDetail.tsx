
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { GlassmorphicCard } from '@/components/ui/GlassmorphicCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Clock, Activity, DollarSign, Gavel, CreditCard, RefreshCw, Timer } from 'lucide-react';

const AuctionDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [auction, setAuction] = useState<any>(null);
  const [bids, setBids] = useState<any[]>([]);
  const [bidAmount, setBidAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [bidError, setBidError] = useState('');

  // Update timeLeft when auction data changes
  useEffect(() => {
    if (auction?.end_time) {
      const remaining = new Date(auction.end_time).getTime() - Date.now();
      setTimeLeft(Math.max(0, remaining));
    }
  }, [auction]);

  useEffect(() => {
    if (!id) return;
    const fetchAuction = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/auctions/${id}`);
        if (response.ok) {
          const auctionData = await response.json();
          setAuction(auctionData);
        } else {
          toast({
            title: "Error",
            description: "Auction not found",
            variant: "destructive",
          });
          navigate('/auctions');
        }
      } catch (error) {
        console.error('Error fetching auction:', error);
        toast({
          title: "Error",
          description: "Failed to load auction details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    const fetchBids = async () => {
      try {
        // Fetch all bids (approved, pending, rejected) for full transparency
        const response = await fetch(`${import.meta.env.VITE_API_URL}/auctions/${id}/bids/all`, {
          headers: {
            ...(user && { 'Authorization': `Bearer ${localStorage.getItem('token')}` })
          }
        });
        if (response.ok) {
          const bidsData = await response.json();
          setBids(bidsData.map(bid => ({
            ...bid,
            profiles: { full_name: bid.bidder_name }
          })));
        } else {
          // Fallback to approved bids only
          const fallbackResponse = await fetch(`${import.meta.env.VITE_API_URL}/auctions/${id}/bids`);
          if (fallbackResponse.ok) {
            const bidsData = await fallbackResponse.json();
            setBids(bidsData.map(bid => ({
              ...bid,
              profiles: { full_name: bid.bidder_name },
              status: 'approved'
            })));
          }
        }
      } catch (error) {
        console.error('Error fetching bids:', error);
      }
    };

    fetchAuction();
    fetchBids();
    
    // Refresh data every 10 seconds for faster updates
    const interval = setInterval(() => {
      fetchAuction();
      fetchBids();
    }, 10000);
    
    // Update timer every second
    const timerInterval = setInterval(() => {
      if (auction?.end_time) {
        const remaining = new Date(auction.end_time).getTime() - Date.now();
        setTimeLeft(Math.max(0, remaining));
      }
    }, 1000);
    
    return () => {
      clearInterval(interval);
      clearInterval(timerInterval);
    };
  }, [id, navigate, toast]);

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchAuction(), fetchBids()]);
      toast({
        title: "Data Refreshed",
        description: "Latest auction data loaded",
        duration: 3000,
      });
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const formatTimeLeft = (milliseconds: number) => {
    if (milliseconds <= 0) return 'Auction Ended';
    
    const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24));
    const hours = Math.floor((milliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else {
      return `${minutes}m ${seconds}s`;
    }
  };

  const handleBid = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      navigate('/auth');
      return;
    }

    const amount = parseFloat(bidAmount);
    const currentHighest = auction.current_bid || auction.starting_bid;
    
    const currentHighestNum = parseFloat(currentHighest);
    console.log('Bid validation:', { amount, currentHighest, currentHighestNum, bidAmount });
    
    setBidError('');
    
    if (isNaN(amount) || amount <= 0) {
      setBidError('Please enter a valid bid amount greater than $0');
      return;
    }
    
    if (amount <= currentHighestNum) {
      setBidError(`Your bid must be higher than the current bid of $${currentHighestNum.toFixed(2)}. Please enter at least $${(currentHighestNum + 0.01).toFixed(2)}`);
      return;
    }
    
    console.log('Validation passed, proceeding with bid');

    setSubmitting(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auctions/${auction.id}/bid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ amount })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Bid placement successful:', result);
        
        // Clear the bid amount and any errors immediately
        setBidAmount('');
        setBidError('');
        
        // Add pending bid to local state immediately for instant feedback
        const pendingBid = {
          id: result.bid.id,
          amount: amount,
          auction_id: auction.id,
          bidder_id: user.id,
          created_at: new Date().toISOString(),
          profiles: { full_name: user.full_name || user.email },
          status: 'pending',
          bidder_name: user.full_name || user.email
        };
        
        setBids(prev => [pendingBid, ...prev]);
        
        // Show success toast immediately
        toast({
          title: "✅ Bid Submitted Successfully!",
          description: `Your bid of $${amount.toLocaleString()} has been submitted and is pending admin approval. You'll be notified once it's reviewed.`,
          duration: 8000,
        });
        
        // Refresh data from database after 2 seconds to sync with server
        setTimeout(async () => {
          await fetchBids();
          await fetchAuction();
        }, 2000);
      } else {
        const error = await response.json();
        console.error('Bid placement failed:', error);
        setBidError(error.error || "Failed to place bid. Please try again.");
      }
    } catch (error) {
      console.error('Bid placement error:', error);
      setBidError("Failed to place bid. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!auction) {
    return null;
  }

  const isActive = auction.status === 'active' && timeLeft > 0;
  const isEnded = auction.status === 'ended' || timeLeft <= 0;
  const isWinner = isEnded && bids.length > 0 && bids[0]?.bidder_id === user?.id;

  // Debug logging
  console.log('AuctionDetail Debug:', {
    user: user ? { id: user.id, email: user.email, full_name: user.full_name } : null,
    auction: auction ? { id: auction.id, seller_id: auction.seller_id, seller_name: auction.seller_name } : null,
    isSeller: user && auction ? user.id === auction.seller_id : false,
    isActive,
    isEnded
  });

  const handlePayment = () => {
    window.location.href = `/api/payments/pay?auction_id=${auction.id}`;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24 pb-20">
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Image */}
              <div className="aspect-square overflow-hidden rounded-lg">
                <img
                  src={auction.image_url ? 
                    `${import.meta.env.VITE_BASE_URL}${auction.image_url}` : 
                    'https://images.unsplash.com/photo-1566312581307-d6bb3f6b2311?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
                  }
                  alt={auction.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1566312581307-d6bb3f6b2311?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
                  }}
                />
              </div>

              {/* Details */}
              <div className="space-y-6">
                <div>
                  <div className="flex items-center text-sm text-muted-foreground mb-2">
                    <span className="bg-gold/20 text-gold px-2 py-1 rounded-sm text-xs font-medium">
                      {auction.category_name || 'Uncategorized'}
                    </span>
                  </div>
                  <h1 className="text-3xl font-display font-bold mb-4">
                    {auction.title}
                  </h1>
                  <p className="text-muted-foreground">
                    {auction.description}
                  </p>
                </div>

                <GlassmorphicCard variant="default" shadow="sm" className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Current Bid</span>
                      <span className="text-2xl font-bold text-gold">
                        ${(auction.current_bid ? parseFloat(auction.current_bid) : parseFloat(auction.starting_bid)).toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Starting Bid</span>
                      <span className="text-sm">${parseFloat(auction.starting_bid).toLocaleString()}</span>
                    </div>

                    {auction.estimated_value_min && auction.estimated_value_max && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Estimated Value</span>
                        <span className="text-sm">
                          ${auction.estimated_value_min.toLocaleString()} - ${auction.estimated_value_max.toLocaleString()}
                        </span>
                      </div>
                    )}

                    {/* Countdown Timer */}
                    <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                      <div className="flex items-center">
                        <Timer className="h-5 w-5 mr-2 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium text-blue-800">Time Remaining</p>
                          <p className={`text-lg font-bold ${
                            timeLeft > 86400000 ? 'text-green-600' : 
                            timeLeft > 3600000 ? 'text-yellow-600' : 
                            timeLeft > 0 ? 'text-red-600' : 'text-gray-500'
                          }`}>
                            {formatTimeLeft(timeLeft)}
                          </p>
                        </div>
                      </div>
                      {isActive && (
                        <div className="animate-pulse">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Activity className="h-4 w-4 mr-1" />
                        {bids.length} bids
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={refreshData}
                          disabled={refreshing}
                          className="h-7 px-2"
                        >
                          <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
                        </Button>
                        {isActive && (
                          <div className="flex items-center text-sm">
                            <Clock className="h-4 w-4 mr-1 text-green-500" />
                            <span className="text-green-500">Active</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </GlassmorphicCard>

                {/* Pending Bid Notification */}
                {(() => {
                  const pendingBid = bids.find(bid => bid.bidder_id === user?.id && bid.status === 'pending');
                  return pendingBid && (
                    <GlassmorphicCard variant="default" shadow="sm" className="p-4 bg-yellow-50 border-yellow-200 animate-fade-in">
                      <div className="flex items-center gap-3">
                        <div className="animate-pulse">
                          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        </div>
                        <div>
                          <p className="font-medium text-yellow-800">⏳ Bid Pending Approval</p>
                          <p className="text-sm text-yellow-600">
                            Your bid of ${parseFloat(pendingBid.amount).toLocaleString()} is awaiting admin approval.
                          </p>
                          <p className="text-xs text-yellow-500 mt-1">
                            Submitted {new Date(pendingBid.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </GlassmorphicCard>
                  );
                })()}

                {/* Owner Notice */}
                {user && auction.seller_id === user.id && (
                  <GlassmorphicCard variant="default" shadow="sm" className="p-6 bg-blue-50 border-blue-200">
                    <h3 className="font-semibold mb-2 flex items-center text-blue-800">
                      <Gavel className="h-5 w-5 mr-2" />
                      Your Auction
                    </h3>
                    <p className="text-sm text-blue-700">
                      You cannot bid on your own auction. You can monitor the bidding activity and manage your auction from your dashboard.
                    </p>
                  </GlassmorphicCard>
                )}

                {isActive && user && auction.seller_id !== user.id && (
                  <GlassmorphicCard variant="default" shadow="sm" className="p-6">
                    <h3 className="font-semibold mb-4 flex items-center">
                      <Gavel className="h-5 w-5 mr-2" />
                      Place a Bid
                    </h3>
                    <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-700">
                        ℹ️ <strong>Note:</strong> All bids require admin approval before updating the auction price. You'll be notified once your bid is reviewed.
                      </p>
                    </div>
                    <form onSubmit={handleBid} className="space-y-4">
                      {bidError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-700 flex items-center">
                            <span className="mr-2">❌</span>
                            {bidError}
                          </p>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <div className="relative flex-grow">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            step="0.01"
                            value={bidAmount}
                            onChange={(e) => {
                              setBidAmount(e.target.value);
                              if (bidError) setBidError('');
                            }}
                            placeholder="Enter bid amount"
                            className={`pl-10 ${bidError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                            min={(auction.current_bid || auction.starting_bid) + 0.01}
                            required
                          />
                        </div>
                        <Button type="submit" disabled={submitting}>
                          {submitting ? 'Placing...' : 'Place Bid'}
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        ⏳ Bids are subject to admin approval and may take some time to reflect in the auction price.
                      </p>
                    </form>
                  </GlassmorphicCard>
                )}

                {isActive && !user && (
                  <GlassmorphicCard variant="default" shadow="sm" className="p-6">
                    <h3 className="font-semibold mb-4 flex items-center">
                      <Gavel className="h-5 w-5 mr-2" />
                      Place a Bid
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      <button
                        type="button"
                        onClick={() => navigate('/auth')}
                        className="text-gold hover:underline font-medium"
                      >
                        Sign in
                      </button>
                      {' '}to place a bid on this auction
                    </p>
                  </GlassmorphicCard>
                )}

                {isWinner && (
                  <GlassmorphicCard variant="default" shadow="sm" className="p-6">
                    <h3 className="font-semibold mb-4 flex items-center text-green-600">
                      <Gavel className="h-5 w-5 mr-2" />
                      Congratulations! You Won!
                    </h3>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        You are the winning bidder for this auction. Complete your payment to secure your item.
                      </p>
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <span className="font-medium">Final Amount:</span>
                        <span className="text-xl font-bold text-green-600">
                          ${bids[0]?.amount.toLocaleString()}
                        </span>
                      </div>
                      <Button 
                        onClick={handlePayment}
                        className="w-full bg-green-600 hover:bg-green-700"
                        size="lg"
                      >
                        <CreditCard className="h-5 w-5 mr-2" />
                        Pay with eSewa
                      </Button>
                    </div>
                  </GlassmorphicCard>
                )}

                {isEnded && !isWinner && bids.length > 0 && (
                  <GlassmorphicCard variant="default" shadow="sm" className="p-6">
                    <h3 className="font-semibold mb-4 text-gray-600">
                      Auction Ended
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      This auction has ended. The winning bid was ${bids[0]?.amount.toLocaleString()} by {bids[0]?.profiles?.full_name}.
                    </p>
                  </GlassmorphicCard>
                )}

                {/* Bid History */}
                {bids.length > 0 && (
                  <GlassmorphicCard variant="default" shadow="sm" className="p-6">
                    <h3 className="font-semibold mb-4">Bid History</h3>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {bids.map((bid, index) => (
                        <div key={bid.id} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                          <div>
                            <p className="font-medium">${bid.amount.toLocaleString()}</p>
                            <p className="text-sm text-muted-foreground">
                              by {bid.profiles?.full_name || 'Anonymous'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">
                              {new Date(bid.created_at).toLocaleDateString()}
                            </p>
                            {bid.status === 'pending' && (
                              <span className="text-xs bg-yellow-500/20 text-yellow-600 px-2 py-1 rounded">
                                ⏳ Pending
                              </span>
                            )}
                            {bid.status === 'approved' && index === 0 && (
                              <span className="text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded">
                                ✅ Leading
                              </span>
                            )}
                            {bid.status === 'rejected' && (
                              <span className="text-xs bg-red-500/20 text-red-500 px-2 py-1 rounded">
                                ❌ Rejected
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </GlassmorphicCard>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AuctionDetail;
