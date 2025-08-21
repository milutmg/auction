import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { 
  Search, 
  Plus, 
  Clock, 
  DollarSign,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

interface Auction {
  id: string;
  title: string;
  description: string;
  starting_bid: string;
  current_bid: string | null;
  image_url: string;
  category_name: string;
  seller_name: string;
  status: string;
  end_time: string;
  bid_count: number;
}

const SimpleAuctions: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadAuctions();
  }, []);

  const loadAuctions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3002/api/auctions', {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setAuctions(data.auctions || []);
    } catch (error) {
      console.error('Failed to load auctions:', error);
      toast({
        title: "Error",
        description: "Failed to load auctions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredAuctions = auctions.filter(auction =>
    auction.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    auction.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTimeRemaining = (endTime: string): string => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;
    return 'Ending soon';
  };

  const formatBidAmount = (currentBid: string | null, startingBid: string): string => {
    const current = currentBid ? parseFloat(currentBid) : null;
    const starting = parseFloat(startingBid || '0');
    const displayBid = current || starting;
    return isNaN(displayBid) ? '0.00' : displayBid.toFixed(2);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading auctions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Auction Marketplace</h1>
              <p className="text-gray-600">
                Discover and bid on authenticated antiques from trusted sellers worldwide
              </p>
            </div>
            {user && (
              <Link to="/auctions/create">
                <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  List Item
                </Button>
              </Link>
            )}
          </div>

          {/* Search */}
          <div className="max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search auctions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredAuctions.length} of {auctions.length} auctions
          </div>
        </div>

        {/* Auctions Grid */}
        {filteredAuctions.length === 0 ? (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No auctions found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery ? 'Try adjusting your search terms' : 'No auctions are currently available'}
            </p>
            {searchQuery && (
              <Button 
                onClick={() => setSearchQuery('')}
                variant="outline"
              >
                Clear Search
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAuctions.map((auction) => {
              const timeRemaining = formatTimeRemaining(auction.end_time);
              const bidAmount = formatBidAmount(auction.current_bid, auction.starting_bid);
              
              return (
                <Card key={auction.id} className="group hover:shadow-lg transition-all duration-300">
                  <div className="relative aspect-square overflow-hidden rounded-t-lg">
                    <img
                      src={auction.image_url || '/placeholder.svg'}
                      alt={auction.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                    
                    {/* View count */}
                    <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {Math.floor(Math.random() * 100)}
                    </div>
                  </div>

                  <CardContent className="p-4">
                    <div className="mb-2">
                      <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-amber-600 transition-colors">
                        {auction.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {auction.description}
                      </p>
                    </div>

                    {/* Category and Seller */}
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                      <span>{auction.category_name}</span>
                      <span>by {auction.seller_name}</span>
                    </div>

                    {/* Bidding info */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-gray-500" />
                          <span className="text-xl font-bold text-amber-600">${bidAmount}</span>
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          {auction.bid_count || 0} bids
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className={`text-sm flex items-center gap-1 ${
                          timeRemaining === 'Ended' ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          <Clock className="h-3 w-3" />
                          {timeRemaining === 'Ended' ? 'Auction Ended' : `${timeRemaining} left`}
                        </div>
                        <Link 
                          to={`/auctions/${auction.id}`}
                          className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-amber-600 text-white hover:bg-amber-700 h-8 px-3 transition-colors"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleAuctions;
