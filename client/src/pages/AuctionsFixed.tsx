import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { 
  Filter, 
  Search, 
  Plus, 
  Grid, 
  List, 
  Heart, 
  Eye, 
  Clock, 
  DollarSign,
  MapPin,
  Star,
  Award,
  TrendingUp
} from 'lucide-react';
import { GlassmorphicCard } from '@/components/ui/GlassmorphicCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';

interface Auction {
  id: string;
  title: string;
  description: string;
  starting_bid: string;
  current_bid: string | null;
  image_url: string;
  category_id: string;
  category_name: string;
  seller_name: string;
  status: string;
  approval_status: string;
  end_time: string;
  bid_count: number;
  seller_id: string;
}

interface Category {
  id: string;
  name: string;
  description: string;
}

const AuctionsFixed: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const location = useLocation();

  // State
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 12;

  // Load data on component mount
  useEffect(() => {
    loadCategories();
    loadAuctions();
  }, []);

  // Reload auctions when filters change
  useEffect(() => {
    loadAuctions();
  }, [searchQuery, selectedCategory, sortBy, currentPage]);

  const makeApiCall = async (endpoint: string, options = {}) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3002/api${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        ...options
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  };

  const loadCategories = async () => {
    try {
      const data = await makeApiCall('/categories');
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
      toast({
        title: "Error",
        description: "Failed to load categories. Please try again.",
        variant: "destructive",
      });
    }
  };

  const loadAuctions = async () => {
    try {
      setSearchLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedCategory) params.append('category', selectedCategory);
      params.append('sort', sortBy);
      params.append('page', currentPage.toString());
      params.append('limit', itemsPerPage.toString());

      const data = await makeApiCall(`/auctions?${params.toString()}`);
      
      setAuctions(data.auctions || []);
      setTotalPages(data.pagination?.total_pages || 1);
      setTotalItems(data.pagination?.total_items || 0);

    } catch (error) {
      console.error('Failed to load auctions:', error);
      toast({
        title: "Error",
        description: "Failed to load auctions. Please try again.",
        variant: "destructive",
      });
      setAuctions([]);
    } finally {
      setSearchLoading(false);
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadAuctions();
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category === 'all' ? '' : category);
    setCurrentPage(1);
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
    setCurrentPage(1);
  };

  const formatTimeRemaining = (endTime: string): string => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatBidAmount = (currentBid: string | null, startingBid: string): string => {
    const current = currentBid ? parseFloat(currentBid) : null;
    const starting = parseFloat(startingBid || '0');
    const displayBid = current || starting;
    return isNaN(displayBid) ? '0.00' : displayBid.toFixed(2);
  };

  const AuctionCard = ({ auction }: { auction: Auction }) => {
    const timeRemaining = formatTimeRemaining(auction.end_time);
    const bidAmount = formatBidAmount(auction.current_bid, auction.starting_bid);
    const isEnding = timeRemaining.includes('h') || timeRemaining.includes('m');

    return (
      <GlassmorphicCard 
        variant="default" 
        className={`group hover:shadow-lg transition-all duration-300 ${viewMode === 'list' ? 'flex' : ''}`}
      >
        <div className={`relative ${viewMode === 'list' ? 'w-48 flex-shrink-0' : 'aspect-square'} overflow-hidden rounded-lg`}>
          <img
            src={auction.image_url || '/placeholder.svg'}
            alt={auction.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.currentTarget.src = '/placeholder.svg';
            }}
          />
          
          {/* Status badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {isEnding && timeRemaining !== 'Ended' && (
              <Badge className="bg-red-600 text-white animate-pulse">
                <Clock className="h-3 w-3 mr-1" />
                Ending Soon
              </Badge>
            )}
          </div>

          {/* View count */}
          <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {Math.floor(Math.random() * 100)}
          </div>
        </div>

        <div className={`p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-gold transition-colors">
                {auction.title}
              </h3>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {auction.description}
              </p>
            </div>
          </div>

          {/* Auction metadata */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Filter className="h-3 w-3" />
                {auction.category_name}
              </div>
            </div>

            {/* Seller info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">by</span>
                <span className="font-medium">{auction.seller_name}</span>
                <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                  Seller
                </Badge>
              </div>
            </div>
          </div>

          {/* Bidding info */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-xl font-bold text-gold">${bidAmount}</span>
                <span className="text-sm text-muted-foreground">
                  {auction.current_bid ? 'Current Bid' : 'Starting Bid'}
                </span>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  {auction.bid_count} bids
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <div className={`text-sm ${timeRemaining === 'Ended' ? 'text-red-600' : isEnding ? 'text-orange-600 font-medium' : 'text-muted-foreground'}`}>
                <Clock className="h-3 w-3 inline mr-1" />
                {timeRemaining === 'Ended' ? 'Auction Ended' : `${timeRemaining} left`}
              </div>
              <Link 
                to={`/auctions/${auction.id}`}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-gold text-white hover:bg-gold-dark h-9 px-4 py-2 transition-colors"
              >
                View Details
              </Link>
            </div>
          </div>
        </div>
      </GlassmorphicCard>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading auctions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">Auction Marketplace</h1>
              <p className="text-muted-foreground">
                Discover and bid on authenticated antiques from trusted sellers worldwide
              </p>
            </div>
            {user && (
              <Link to="/auctions/create">
                <Button className="bg-gold hover:bg-gold-dark">
                  <Plus className="h-4 w-4 mr-2" />
                  List Item
                </Button>
              </Link>
            )}
          </div>

          {/* Results summary */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Showing {auctions.length} of {totalItems} auctions
              {searchQuery && ` for "${searchQuery}"`}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <GlassmorphicCard variant="default" className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Search & Filters
              </h3>

              {/* Search */}
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search auctions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-10"
                  />
                </div>

                {/* Category Filter */}
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Select value={selectedCategory || 'all'} onValueChange={handleCategoryChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort */}
                <div>
                  <label className="text-sm font-medium">Sort by</label>
                  <Select value={sortBy} onValueChange={handleSortChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created_at">Newest First</SelectItem>
                      <SelectItem value="end_time">Ending Soon</SelectItem>
                      <SelectItem value="starting_bid">Price: Low to High</SelectItem>
                      <SelectItem value="starting_bid_desc">Price: High to Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleSearch} className="w-full">
                  Search Auctions
                </Button>
              </div>
            </GlassmorphicCard>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {searchLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Searching...</p>
              </div>
            ) : auctions.length === 0 ? (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No auctions found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search criteria or filters
                </p>
                <Button 
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('');
                    setCurrentPage(1);
                    loadAuctions();
                  }}
                  variant="outline"
                >
                  Clear All Filters
                </Button>
              </div>
            ) : (
              <>
                {/* Auction Grid/List */}
                <div className={`grid gap-6 ${
                  viewMode === 'grid' 
                    ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' 
                    : 'grid-cols-1'
                }`}>
                  {auctions.map((auction) => (
                    <AuctionCard key={auction.id} auction={auction} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = i + 1;
                        return (
                          <Button
                            key={page}
                            variant={page === currentPage ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </Button>
                        );
                      })}
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionsFixed;
