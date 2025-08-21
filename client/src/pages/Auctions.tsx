import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { Filter, SlidersHorizontal, Search, Plus, ChevronDown, ArrowUpDown, Grid, List } from 'lucide-react';
import { GlassmorphicCard } from '@/components/ui/GlassmorphicCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

interface AuctionResponse {
  auctions: Auction[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
  };
  filters: any;
}

const formatBidAmount = (currentBid: string | null, startingBid: string): string => {
  const current = currentBid ? parseFloat(currentBid) : null;
  const starting = parseFloat(startingBid || '0');
  const displayBid = current || starting;
  return isNaN(displayBid) ? '0.00' : displayBid.toFixed(2);
};

const Auctions = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const initialSearch = urlParams.get('search') || '';
  const [auctionData, setAuctionData] = useState<AuctionResponse | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    search: initialSearch,
    sort: 'created_at',
    order: 'DESC',
    page: 1,
    limit: 12,
    min_price: '',
    max_price: ''
  });

  const fetchAuctions = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const auctionsResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/auctions?${queryParams.toString()}`,
        {
          headers: {
            'Content-Type': 'application/json',
            ...(user && { 'Authorization': `Bearer ${localStorage.getItem('token')}` })
          }
        }
      );

      if (auctionsResponse.ok) {
        const data = await auctionsResponse.json();
        setAuctionData(data);
      } else {
        throw new Error('Failed to fetch auctions');
      }
    } catch (error) {
      console.error('Error fetching auctions:', error);
      toast({
        title: "Error",
        description: "Failed to load auctions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const categoriesResponse = await fetch(`${import.meta.env.VITE_API_URL}/categories`);
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchAuctions();
  }, [filters, user]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const s = params.get('search') || '';
    setFilters(prev => prev.search === s ? prev : { ...prev, search: s, page:1 });
  }, [location.search]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const getStatusBadge = (status: string, approvalStatus?: string) => {
    if (approvalStatus === 'pending') {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">PENDING</Badge>;
    }
    if (approvalStatus === 'rejected') {
      return <Badge className="bg-red-100 text-red-800 border-red-300">REJECTED</Badge>;
    }
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 border-green-300">ACTIVE</Badge>;
      case 'ended':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-300">ENDED</Badge>;
      case 'pending':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-300">PENDING</Badge>;
      default:
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">{status.toUpperCase()}</Badge>;
    }
  };

  if (loading && !auctionData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-lg">Loading auctions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-4xl font-bold font-display text-foreground mb-2">
                Current Auctions
              </h1>
              <p className="text-muted-foreground max-w-2xl">
                Browse our curated selection of authenticated antiques currently available for bidding.
              </p>
            </div>
            {user && (
              <Link to="/create-auction">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Auction
                </Button>
              </Link>
            )}
          </div>

          {/* Search and Sort Bar */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search auctions..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={filters.sort} onValueChange={(value) => handleFilterChange('sort', value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Newest</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="current_bid">Price</SelectItem>
                  <SelectItem value="end_time">Ending Soon</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleFilterChange('order', filters.order === 'ASC' ? 'DESC' : 'ASC')}
              >
                <ArrowUpDown className="h-4 w-4" />
                {filters.order}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="w-full lg:w-64 shrink-0">
            <GlassmorphicCard variant="subtle" shadow="sm" className="p-5 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-semibold flex items-center gap-2">
                  <Filter className="h-4 w-4" /> Filters
                </h2>
                <button 
                  onClick={() => setFilters(prev => ({ ...prev, category: '', status: '', min_price: '', max_price: '' }))}
                  className="text-sm text-amber-600 hover:underline"
                >
                  Reset
                </button>
              </div>
              
              {/* Categories */}
              <div className="mb-6">
                <label className="text-sm font-medium mb-3 block">Category</label>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="category-all"
                      name="category"
                      className="h-4 w-4 text-amber-600"
                      checked={filters.category === ''}
                      onChange={() => handleFilterChange('category', '')}
                    />
                    <label htmlFor="category-all" className="ml-2 text-sm">
                      All Categories
                    </label>
                  </div>
                  {categories.map((category) => (
                    <div key={category.id} className="flex items-center">
                      <input
                        type="radio"
                        id={`category-${category.id}`}
                        name="category"
                        className="h-4 w-4 text-amber-600"
                        checked={filters.category === category.name}
                        onChange={() => handleFilterChange('category', category.name)}
                      />
                      <label htmlFor={`category-${category.id}`} className="ml-2 text-sm">
                        {category.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Filter */}
              <div className="mb-6">
                <label className="text-sm font-medium mb-3 block">Status</label>
                <div className="space-y-2">
                  {[
                    { value: '', label: 'All Status' },
                    { value: 'active', label: 'Active' },
                    { value: 'pending', label: 'Pending' },
                    { value: 'ended', label: 'Ended' }
                  ].map((status) => (
                    <div key={status.value} className="flex items-center">
                      <input
                        type="radio"
                        id={`status-${status.value}`}
                        name="status"
                        className="h-4 w-4 text-amber-600"
                        checked={filters.status === status.value}
                        onChange={() => handleFilterChange('status', status.value)}
                      />
                      <label htmlFor={`status-${status.value}`} className="ml-2 text-sm">
                        {status.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <label className="text-sm font-medium mb-3 block">Price Range</label>
                <div className="space-y-3">
                  <Input
                    type="number"
                    placeholder="Min price"
                    value={filters.min_price}
                    onChange={(e) => handleFilterChange('min_price', e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder="Max price"
                    value={filters.max_price}
                    onChange={(e) => handleFilterChange('max_price', e.target.value)}
                  />
                </div>
              </div>
            </GlassmorphicCard>
          </div>

          {/* Auction Items Grid */}
          <div className="flex-grow">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 rounded-lg h-64 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : auctionData?.auctions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No auctions found.</p>
                {user && (
                  <Link to="/create-auction">
                    <Button>Create Your First Auction</Button>
                  </Link>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                  {auctionData?.auctions
                    // Client-side defensive visibility filter
                    .filter(auction => {
                      if (auction.approval_status === 'rejected') {
                        return user?.role === 'admin' || user?.id === auction.seller_id; // only admin or owner
                      }
                      if (auction.approval_status === 'pending') {
                        return user?.role === 'admin' || user?.id === auction.seller_id; // only admin or owner
                      }
                      // approved
                      return true;
                    })
                    .map((auction, index) => (
                    <GlassmorphicCard
                      key={auction.id}
                      variant="default"
                      hover="lift"
                      shadow="sm"
                      className="overflow-hidden animate-fade-in"
                      style={{ animationDelay: `${0.1 * (index % 3)}s` }}
                    >
                      <Link to={`/auctions/${auction.id}`} className="block">
                        <div className="relative">
                          <div className="aspect-[4/3] overflow-hidden">
                            <img
                              src={auction.image_url ? 
                                `${import.meta.env.VITE_BASE_URL}${auction.image_url}` : 
                                'https://images.unsplash.com/photo-1566312581307-d6bb3f6b2311?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
                              }
                              alt={auction.title}
                              className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                              onError={(e) => {
                                e.currentTarget.src = 'https://images.unsplash.com/photo-1566312581307-d6bb3f6b2311?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
                              }}
                            />
                          </div>
                          <div className="absolute top-3 left-3">
                            {getStatusBadge(auction.status, auction.approval_status)}
                          </div>
                          <div className="absolute top-3 right-3">
                            <Badge variant="outline" className="bg-white/80 backdrop-blur-sm">
                              {auction.category_name}
                            </Badge>
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-lg mb-2 line-clamp-2">{auction.title}</h3>
                          <div className="space-y-2 text-sm text-muted-foreground">
                            <div className="flex justify-between">
                              <span>Current Bid</span>
                              <span className="font-semibold text-amber-600">
                                ${formatBidAmount(auction.current_bid, auction.starting_bid)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Seller</span>
                              <span>{auction.seller_name}</span>
                            </div>
                            {auction.bid_count > 0 && (
                              <div className="flex justify-between">
                                <span>Bids</span>
                                <span>{auction.bid_count}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                      <div className="px-4 pb-4">
                        <Link to={`/auctions/${auction.id}`}>
                          <Button className="w-full bg-amber-600 hover:bg-amber-700">
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </GlassmorphicCard>
                  ))}
                </div>

                {/* Pagination */}
                {auctionData && auctionData.pagination.total_pages > 1 && (
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      disabled={auctionData.pagination.current_page === 1}
                      onClick={() => handlePageChange(auctionData.pagination.current_page - 1)}
                    >
                      Previous
                    </Button>
                    
                    <div className="flex gap-1">
                      {[...Array(auctionData.pagination.total_pages)].map((_, i) => {
                        const page = i + 1;
                        if (
                          page === 1 ||
                          page === auctionData.pagination.total_pages ||
                          Math.abs(page - auctionData.pagination.current_page) <= 2
                        ) {
                          return (
                            <Button
                              key={page}
                              variant={page === auctionData.pagination.current_page ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageChange(page)}
                            >
                              {page}
                            </Button>
                          );
                        } else if (Math.abs(page - auctionData.pagination.current_page) === 3) {
                          return <span key={page} className="px-2">...</span>;
                        }
                        return null;
                      })}
                    </div>

                    <Button
                      variant="outline"
                      disabled={auctionData.pagination.current_page === auctionData.pagination.total_pages}
                      onClick={() => handlePageChange(auctionData.pagination.current_page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}

                {/* Results Summary */}
                {auctionData && (
                  <div className="text-center mt-4 text-sm text-muted-foreground">
                    Showing {((auctionData.pagination.current_page - 1) * auctionData.pagination.items_per_page) + 1} to{' '}
                    {Math.min(auctionData.pagination.current_page * auctionData.pagination.items_per_page, auctionData.pagination.total_items)} of{' '}
                    {auctionData.pagination.total_items} auctions
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

export default Auctions;
