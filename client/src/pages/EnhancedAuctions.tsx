import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { 
  Filter, 
  Search, 
  Plus, 
  Grid, 
  List, 
  Heart, 
  HeartOff, 
  Eye, 
  Clock, 
  DollarSign,
  MapPin,
  Star,
  Award,
  TrendingUp,
  Bookmark
} from 'lucide-react';
import { GlassmorphicCard } from '@/components/ui/GlassmorphicCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import AdvancedSearchFilters from '@/components/search/AdvancedSearchFilters';
import apiService from '@/services/api';

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
  seller_rating: number;
  seller_level: string;
  seller_total_ratings: number;
  status: string;
  approval_status: string;
  end_time: string;
  bid_count: number;
  watchers_count: number;
  seller_id: string;
  condition?: string;
  location?: string;
  authenticity_certificate?: boolean;
  shipping_included?: boolean;
  featured?: boolean;
  views_count?: number;
  keywords?: string[];
  materials?: string[];
}

interface Category {
  id: string;
  name: string;
  description: string;
}

interface SearchFilters {
  q?: string;
  category?: string;
  condition?: string;
  min_price?: number;
  max_price?: number;
  location?: string;
  featured?: boolean;
  authenticity_certificate?: boolean;
  shipping_included?: boolean;
  auction_type?: string;
  seller_rating?: number;
  keywords?: string;
  materials?: string;
  date_range?: string;
  end_time_range?: string;
  sort?: string;
}

interface AuctionResponse {
  auctions: Auction[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
    has_next: boolean;
    has_prev: boolean;
  };
  filters_applied: SearchFilters;
}

const EnhancedAuctions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  // State
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    items_per_page: 12,
    has_next: false,
    has_prev: false
  });
  const [filters, setFilters] = useState<SearchFilters>({
    sort: 'relevance',
    auction_type: 'active'
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());
  const [trendingData, setTrendingData] = useState({
    trending_categories: [],
    trending_keywords: [],
    trending_locations: []
  });

  // Load initial data
  useEffect(() => {
    loadCategories();
    loadTrending();
  }, []);

  // Parse URL params on component mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlFilters: SearchFilters = {};
    
    params.forEach((value, key) => {
      if (key === 'featured' || key === 'authenticity_certificate' || key === 'shipping_included') {
        urlFilters[key] = value === 'true';
      } else if (key === 'min_price' || key === 'max_price' || key === 'seller_rating') {
        urlFilters[key] = parseFloat(value);
      } else {
        urlFilters[key] = value;
      }
    });

    if (Object.keys(urlFilters).length > 0) {
      setFilters(prevFilters => ({ ...prevFilters, ...urlFilters }));
    }
  }, [location.search]);

  // Load auctions when filters change
  useEffect(() => {
    loadAuctions();
  }, [filters]);

  // Load user watchlist
  useEffect(() => {
    if (user) {
      loadWatchlist();
    }
  }, [user]);

  const loadCategories = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3002/api'}/categories`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadTrending = async () => {
    try {
      const response = await apiService.get('/search/trending');
      setTrendingData(response);
    } catch (error) {
      console.error('Failed to load trending data:', error);
    }
  };

  const loadWatchlist = async () => {
    try {
      const response = await apiService.get('/users/watchlist');
      const watchlistIds = new Set(response.watchlist.map(item => item.auction_id));
      setWatchlist(watchlistIds);
    } catch (error) {
      console.error('Failed to load watchlist:', error);
    }
  };

  const loadAuctions = async () => {
    setSearchLoading(true);
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
          queryParams.append(key, value.toString());
        }
      });

      const response = await apiService.get(`/search?${queryParams.toString()}`);
      setAuctions(response.auctions);
      setPagination(response.pagination);

      // Update URL without triggering navigation
      const newUrl = `${window.location.pathname}?${queryParams.toString()}`;
      window.history.replaceState({}, '', newUrl);

    } catch (error) {
      console.error('Failed to load auctions:', error);
      toast({
        title: "Error",
        description: "Failed to load auctions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSearchLoading(false);
      setLoading(false);
    }
  };

  const handleFiltersChange = (newFilters: SearchFilters) => {
    setFilters({ ...newFilters, sort: newFilters.sort || 'relevance' });
  };

  const handleSearch = () => {
    loadAuctions();
  };

  const toggleWatchlist = async (auctionId: string) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to add items to your watchlist.",
        variant: "destructive",
      });
      return;
    }

    try {
      const isWatched = watchlist.has(auctionId);
      
      if (isWatched) {
        await apiService.delete(`/users/watchlist/${auctionId}`);
        setWatchlist(prev => {
          const newSet = new Set(prev);
          newSet.delete(auctionId);
          return newSet;
        });
        toast({
          title: "Removed from watchlist",
          description: "Item removed from your watchlist.",
        });
      } else {
        await apiService.post('/users/watchlist', { auction_id: auctionId });
        setWatchlist(prev => new Set(prev).add(auctionId));
        toast({
          title: "Added to watchlist",
          description: "Item added to your watchlist.",
        });
      }
    } catch (error) {
      console.error('Failed to toggle watchlist:', error);
      toast({
        title: "Error",
        description: "Failed to update watchlist. Please try again.",
        variant: "destructive",
      });
    }
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

  const getSellerBadge = (level: string) => {
    const badges = {
      bronze: { label: 'Bronze', className: 'bg-amber-100 text-amber-800' },
      silver: { label: 'Silver', className: 'bg-gray-100 text-gray-800' },
      gold: { label: 'Gold', className: 'bg-yellow-100 text-yellow-800' },
      platinum: { label: 'Platinum', className: 'bg-purple-100 text-purple-800' }
    };
    return badges[level] || badges.bronze;
  };

  const AuctionCard = ({ auction }: { auction: Auction }) => {
    const timeRemaining = formatTimeRemaining(auction.end_time);
    const bidAmount = formatBidAmount(auction.current_bid, auction.starting_bid);
    const isEnding = timeRemaining.includes('h') || timeRemaining.includes('m');
    const isWatched = watchlist.has(auction.id);
    const sellerBadge = getSellerBadge(auction.seller_level);

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
          
          {/* Overlay badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {auction.featured && (
              <Badge className="bg-gold text-white">
                <Award className="h-3 w-3 mr-1" />
                Featured
              </Badge>
            )}
            {auction.authenticity_certificate && (
              <Badge className="bg-green-600 text-white">
                <Award className="h-3 w-3 mr-1" />
                Certified
              </Badge>
            )}
            {isEnding && timeRemaining !== 'Ended' && (
              <Badge className="bg-red-600 text-white animate-pulse">
                <Clock className="h-3 w-3 mr-1" />
                Ending Soon
              </Badge>
            )}
          </div>

          {/* Watchlist button */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 bg-white/80 hover:bg-white"
            onClick={(e) => {
              e.preventDefault();
              toggleWatchlist(auction.id);
            }}
          >
            {isWatched ? (
              <Heart className="h-4 w-4 fill-red-500 text-red-500" />
            ) : (
              <Heart className="h-4 w-4" />
            )}
          </Button>

          {/* View count */}
          <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {auction.views_count || 0}
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
              {auction.condition && (
                <div className="flex items-center gap-1">
                  <Award className="h-3 w-3" />
                  {auction.condition}
                </div>
              )}
              {auction.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {auction.location}
                </div>
              )}
            </div>

            {/* Seller info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">by</span>
                <span className="font-medium">{auction.seller_name}</span>
                <Badge variant="secondary" className={sellerBadge.className}>
                  {sellerBadge.label}
                </Badge>
                {auction.seller_rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm">{auction.seller_rating.toFixed(1)}</span>
                    <span className="text-xs text-muted-foreground">({auction.seller_total_ratings})</span>
                  </div>
                )}
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
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Bookmark className="h-3 w-3" />
                  {auction.watchers_count} watching
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
              Showing {auctions.length} of {pagination.total_items} auctions
              {filters.q && ` for "${filters.q}"`}
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
            <AdvancedSearchFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onSearch={handleSearch}
              categories={categories}
              loading={searchLoading}
            />

            {/* Trending Section */}
            {trendingData.trending_keywords.length > 0 && (
              <div className="mt-6">
                <GlassmorphicCard variant="default" className="p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Trending Keywords
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {trendingData.trending_keywords.slice(0, 10).map((keyword: any) => (
                      <Button
                        key={keyword.keyword}
                        variant="outline"
                        size="sm"
                        onClick={() => handleFiltersChange({ ...filters, keywords: keyword.keyword })}
                      >
                        {keyword.keyword}
                      </Button>
                    ))}
                  </div>
                </GlassmorphicCard>
              </div>
            )}
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
                  onClick={() => handleFiltersChange({})}
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
                {pagination.total_pages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleFiltersChange({ ...filters, page: pagination.current_page - 1 })}
                      disabled={!pagination.has_prev}
                    >
                      Previous
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                        const page = i + 1;
                        return (
                          <Button
                            key={page}
                            variant={page === pagination.current_page ? "default" : "ghost"}
                            size="sm"
                            onClick={() => handleFiltersChange({ ...filters, page })}
                          >
                            {page}
                          </Button>
                        );
                      })}
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => handleFiltersChange({ ...filters, page: pagination.current_page + 1 })}
                      disabled={!pagination.has_next}
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

export default EnhancedAuctions;
