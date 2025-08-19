import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { Filter, SlidersHorizontal, Search, ArrowUpDown, ArrowLeft, Home, ChevronRight } from 'lucide-react';
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
  auction_count?: string;
  active_auction_count?: string;
  pending_auction_count?: string;
  avg_price?: string;
  min_price?: string;
  max_price?: string;
  featured?: boolean;
}

interface CategoryStats {
  total_auctions: string;
  active_auctions: string;
  pending_auctions: string;
  ended_auctions: string;
  avg_price: string;
  min_price: string;
  max_price: string;
}

interface CategoryResponse {
  category: Category;
  auctions: Auction[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
  };
  stats: CategoryStats;
  filters: any;
}

// Format bid amounts safely
const formatBidAmount = (currentBid: string | null, startingBid: string): string => {
  const current = currentBid ? parseFloat(currentBid) : null;
  const starting = parseFloat(startingBid || '0');
  const displayBid = current || starting;
  return isNaN(displayBid) ? '0.00' : displayBid.toFixed(2);
};

const CategoryDetail = () => {
  const { categoryName } = useParams<{ categoryName: string }>();
  const { toast } = useToast();
  const { user } = useAuth();
  const [categoryData, setCategoryData] = useState<CategoryResponse | null>(null);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    sort: 'created_at',
    order: 'DESC',
    page: 1,
    limit: 12,
    min_price: '',
    max_price: ''
  });

  const fetchAllCategories = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/categories`);
      if (response.ok) {
        const data = await response.json();
        setAllCategories(data);
      }
    } catch (error) {
      console.error('Error fetching all categories:', error);
    }
  };

  const fetchCategoryData = async () => {
    if (!categoryName) return;
    
    try {
      setLoading(true);
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/categories/${encodeURIComponent(categoryName)}?${queryParams.toString()}`,
        {
          headers: {
            'Content-Type': 'application/json',
            ...(user && { 'Authorization': `Bearer ${localStorage.getItem('token')}` })
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCategoryData(data);
      } else {
        throw new Error('Failed to fetch category data');
      }
    } catch (error) {
      console.error('Error fetching category data:', error);
      toast({
        title: "Error",
        description: "Failed to load category data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategoryData();
    fetchAllCategories();
  }, [categoryName, filters, user]);

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

  // Add breadcrumb component
  const Breadcrumb = ({ categoryName }: { categoryName: string }) => (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
      <Link to="/" className="hover:text-foreground transition-colors">
        <Home className="h-4 w-4" />
      </Link>
      <ChevronRight className="h-4 w-4" />
      <Link to="/categories" className="hover:text-foreground transition-colors">
        Categories
      </Link>
      <ChevronRight className="h-4 w-4" />
      <span className="text-foreground font-medium">{categoryName}</span>
    </nav>
  );

  // Add empty state component
  const EmptyState = ({ categoryName }: { categoryName: string }) => (
    <div className="text-center py-16">
      <div className="mb-6">
        <div className="w-24 h-24 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
          <Search className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No auctions found</h3>
        <p className="text-muted-foreground mb-6">
          There are currently no auctions in the "{categoryName}" category that match your filters.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link to="/categories">
          <Button variant="outline">Browse Other Categories</Button>
        </Link>
        <Link to="/auctions">
          <Button>View All Auctions</Button>
        </Link>
      </div>
    </div>
  );

  // Add auction card component
  const AuctionCard = ({ auction, index }: { auction: Auction; index: number }) => (
    <GlassmorphicCard
      key={auction.id}
      variant="default"
      hover="lift"
      shadow="sm"
      className="overflow-hidden animate-fade-in group"
      style={{ animationDelay: `${0.1 * (index % 3)}s` }}
    >
      <Link to={`/auctions/${auction.id}`} className="block">
        <div className="relative">
          <div className="aspect-[4/3] overflow-hidden">
            {auction.image_url ? (
              <img
                src={`${import.meta.env.VITE_BASE_URL}${auction.image_url}`}
                alt={auction.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1566312581307-d6bb3f6b2311?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
                }}
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500 text-sm">No Image</span>
              </div>
            )}
          </div>
          <div className="absolute top-3 left-3">
            {getStatusBadge(auction.status, auction.approval_status)}
          </div>
          {auction.end_time && new Date(auction.end_time) < new Date(Date.now() + 24 * 60 * 60 * 1000) && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-red-100 text-red-800 border-red-300">
                Ending Soon
              </Badge>
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-amber-600 transition-colors">
            {auction.title}
          </h3>
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {auction.description}
          </p>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>Current Bid</span>
              <span className="font-semibold text-amber-600">
                ${formatBidAmount(auction.current_bid, auction.starting_bid)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Seller</span>
              <span className="font-medium">{auction.seller_name}</span>
            </div>
            {auction.bid_count > 0 && (
              <div className="flex justify-between">
                <span>Bids</span>
                <span className="font-medium">{auction.bid_count}</span>
              </div>
            )}
            {auction.end_time && (
              <div className="flex justify-between text-xs">
                <span>Ends</span>
                <span className="font-medium">
                  {new Date(auction.end_time).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </Link>
      <div className="px-4 pb-4">
        <Link to={`/auctions/${auction.id}`}>
          <Button className="w-full bg-amber-600 hover:bg-amber-700 transition-colors">
            View Details
          </Button>
        </Link>
      </div>
    </GlassmorphicCard>
  );

  // Add loading skeleton component
  const AuctionCardSkeleton = ({ index }: { index: number }) => (
    <div 
      className="animate-pulse"
      style={{ animationDelay: `${0.1 * (index % 3)}s` }}
    >
      <div className="bg-gray-200 rounded-lg aspect-[4/3] mb-4"></div>
      <div className="px-4 pb-4">
        <div className="h-6 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded mb-3 w-3/4"></div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <div className="h-4 bg-gray-200 rounded w-20"></div>
            <div className="h-4 bg-gray-200 rounded w-16"></div>
          </div>
          <div className="flex justify-between">
            <div className="h-4 bg-gray-200 rounded w-16"></div>
            <div className="h-4 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
        <div className="h-10 bg-gray-200 rounded mt-4"></div>
      </div>
    </div>
  );

  // Add category navigation component
  const CategoryNavigation = ({ 
    currentCategoryName, 
    allCategories 
  }: { 
    currentCategoryName: string; 
    allCategories: Category[] 
  }) => {
    // Safety check for allCategories
    if (!allCategories || allCategories.length === 0) {
      return null;
    }

    const otherCategories = allCategories
      .filter(cat => cat.name !== currentCategoryName)
      .slice(0, 6); // Show top 6 other categories

    if (otherCategories.length === 0) {
      return null;
    }

    return (
      <GlassmorphicCard variant="subtle" shadow="sm" className="p-5 sticky top-24">
        <h3 className="font-display font-semibold mb-4">Browse Other Categories</h3>
        <div className="space-y-3">
          {otherCategories.map((category) => (
            <Link
              key={category.id}
              to={`/categories/${encodeURIComponent(category.name)}`}
              className="block p-3 rounded-lg hover:bg-muted/50 transition-colors group"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium text-sm group-hover:text-amber-600 transition-colors">
                    {category.name}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {category.auction_count || '0'} items
                  </p>
                </div>
                <img
                  src={getCategoryImage(category.name)}
                  alt={category.name}
                  className="w-10 h-10 rounded object-cover"
                />
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t">
          <Link to="/categories">
            <Button variant="outline" size="sm" className="w-full">
              View All Categories
            </Button>
          </Link>
        </div>
      </GlassmorphicCard>
    );
  };

  // Add getCategoryImage function to CategoryDetail (reuse from Categories component)
  const getCategoryImage = (categoryName: string): string => {
    const imageMap: { [key: string]: string } = {
      'Furniture': 'https://images.unsplash.com/photo-1537182534312-f945134cce34?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'Fine Art': 'https://images.unsplash.com/photo-1582561424557-058a57e27069?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'Art': 'https://images.unsplash.com/photo-1582561424557-058a57e27069?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'Jewelry': 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'Ceramics & Porcelain': 'https://images.unsplash.com/photo-1530039251581-c38ce8a8a346?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'Ceramics': 'https://images.unsplash.com/photo-1530039251581-c38ce8a8a346?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'Antique Vases': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'Silver': 'https://images.unsplash.com/photo-1548483531-7edb5d09c597?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'Collectibles': 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'Textiles': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'Furniture & Clocks': 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    };
    
    return imageMap[categoryName] || 'https://images.unsplash.com/photo-1566312581307-d6bb3f6b2311?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
  };

  if (loading && !categoryData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-lg">Loading category...</p>
        </div>
      </div>
    );
  }

  if (!categoryData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Category Not Found</h1>
          <Link to="/categories">
            <Button>Back to Categories</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <div className="container max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Breadcrumb categoryName={categoryData.category.name} />
          
          <div className="flex items-center gap-4 mb-6">
            <Link to="/categories">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Categories
              </Button>
            </Link>
          </div>
          
          <div className="mb-6">
            <h1 className="text-4xl font-bold font-display text-foreground mb-2">
              {categoryData.category.name}
            </h1>
            <p className="text-muted-foreground max-w-2xl mb-4">
              {categoryData.category.description}
            </p>
            
            {/* Category Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <h3 className="text-sm font-medium text-gray-600">Total Items</h3>
                <p className="text-2xl font-bold text-blue-600">{categoryData.stats.total_auctions}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <h3 className="text-sm font-medium text-gray-600">Active Auctions</h3>
                <p className="text-2xl font-bold text-green-600">{categoryData.stats.active_auctions}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <h3 className="text-sm font-medium text-gray-600">Avg Price</h3>
                <p className="text-2xl font-bold text-purple-600">${categoryData.stats.avg_price}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <h3 className="text-sm font-medium text-gray-600">Price Range</h3>
                <p className="text-sm text-gray-600">${categoryData.stats.min_price} - ${categoryData.stats.max_price}</p>
              </div>
            </div>
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
            
            {/* Quick Filters */}
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={filters.status === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFilterChange('status', filters.status === 'active' ? '' : 'active')}
              >
                Active Only
              </Button>
              <Button
                variant={filters.sort === 'end_time' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFilterChange('sort', filters.sort === 'end_time' ? 'created_at' : 'end_time')}
              >
                Ending Soon
              </Button>
              <Button
                variant={filters.sort === 'current_bid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFilterChange('sort', filters.sort === 'current_bid' ? 'created_at' : 'current_bid')}
              >
                By Price
              </Button>
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
          <div className="w-full lg:w-64 shrink-0 space-y-6">
            <GlassmorphicCard variant="subtle" shadow="sm" className="p-5 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-semibold flex items-center gap-2">
                  <Filter className="h-4 w-4" /> Filters
                </h2>
                <button 
                  onClick={() => setFilters(prev => ({ ...prev, status: '', min_price: '', max_price: '' }))}
                  className="text-sm text-amber-600 hover:underline"
                >
                  Reset
                </button>
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
            
            {/* Category Navigation */}
            {allCategories && allCategories.length > 0 && categoryData && (
              <CategoryNavigation 
                currentCategoryName={categoryData.category.name}
                allCategories={allCategories}
              />
            )}
          </div>

          {/* Auction Items Grid */}
          <div className="flex-grow">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <AuctionCardSkeleton key={i} index={i} />
                ))}
              </div>
            ) : categoryData?.auctions.length === 0 ? (
              <EmptyState categoryName={categoryData.category.name} />
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                  {categoryData?.auctions
                    .filter(a => {
                      // hide pending unless owner/admin
                      if (a.approval_status === 'pending') {
                        return user?.role === 'admin' || user?.id === a.seller_id;
                      }
                      // hide rejected unless owner/admin
                      if (a.approval_status === 'rejected') {
                        return user?.role === 'admin' || user?.id === a.seller_id;
                      }
                      // approved visible
                      return true;
                    })
                    .map((auction, index) => (
                      <AuctionCard key={auction.id} auction={auction} index={index} />
                    ))}
                </div>

                {/* Pagination */}
                {categoryData && categoryData.pagination.total_pages > 1 && (
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      disabled={categoryData.pagination.current_page === 1}
                      onClick={() => handlePageChange(categoryData.pagination.current_page - 1)}
                    >
                      Previous
                    </Button>
                    
                    <div className="flex gap-1">
                      {[...Array(categoryData.pagination.total_pages)].map((_, i) => {
                        const page = i + 1;
                        if (
                          page === 1 ||
                          page === categoryData.pagination.total_pages ||
                          Math.abs(page - categoryData.pagination.current_page) <= 2
                        ) {
                          return (
                            <Button
                              key={page}
                              variant={page === categoryData.pagination.current_page ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageChange(page)}
                            >
                              {page}
                            </Button>
                          );
                        } else if (Math.abs(page - categoryData.pagination.current_page) === 3) {
                          return <span key={page} className="px-2">...</span>;
                        }
                        return null;
                      })}
                    </div>

                    <Button
                      variant="outline"
                      disabled={categoryData.pagination.current_page === categoryData.pagination.total_pages}
                      onClick={() => handlePageChange(categoryData.pagination.current_page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}

                {/* Results Summary */}
                {categoryData && (
                  <div className="text-center mt-4 text-sm text-muted-foreground">
                    Showing {((categoryData.pagination.current_page - 1) * categoryData.pagination.items_per_page) + 1} to{' '}
                    {Math.min(categoryData.pagination.current_page * categoryData.pagination.items_per_page, categoryData.pagination.total_items)} of{' '}
                    {categoryData.pagination.total_items} auctions
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

export default CategoryDetail;
