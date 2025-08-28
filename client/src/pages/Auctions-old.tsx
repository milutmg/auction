import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { Filter, SlidersHorizontal, Search, Plus, ChevronDown, ArrowUpDown } from 'lucide-react';
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
  starting_bid: number;
  current_bid: number;
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

const Auctions = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [auctionData, setAuctionData] = useState<AuctionResponse | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    search: '',
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
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/auctions?${queryParams.toString()}`,
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
      const categoriesResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/bids/categories`);
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
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow pb-20">
        <section className="py-12 md:py-16 relative overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-muted/30 to-background" />
          <div className="absolute top-1/3 right-0 w-80 h-80 bg-gold/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-60 h-60 bg-gold/10 rounded-full blur-3xl" />
          
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h1 className="text-3xl md:text-4xl font-display font-bold mb-4">
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

            <div className="flex flex-col lg:flex-row gap-8 mb-8">
              {/* Filters Sidebar */}
              <div className="w-full lg:w-64 shrink-0">
                <GlassmorphicCard
                  variant="subtle"
                  shadow="sm"
                  className="p-5 sticky top-24"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display font-semibold flex items-center gap-2">
                      <Filter className="h-4 w-4" /> Filters
                    </h2>
                    <button 
                      onClick={() => setSelectedCategory('')}
                      className="text-sm text-gold hover:underline"
                    >
                      Reset
                    </button>
                  </div>
                  
                  {/* Categories */}
                  <div className="mb-6">
                    <label className="text-sm font-medium mb-1.5 block">Category</label>
                    <div className="space-y-1.5">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="category-all"
                          name="category"
                          className="h-4 w-4 text-gold"
                          checked={selectedCategory === ''}
                          onChange={() => setSelectedCategory('')}
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
                            className="h-4 w-4 text-gold"
                            checked={selectedCategory === category.id}
                            onChange={() => setSelectedCategory(category.id)}
                          />
                          <label htmlFor={`category-${category.id}`} className="ml-2 text-sm">
                            {category.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </GlassmorphicCard>
              </div>

              {/* Auction Items Grid */}
              <div className="flex-grow">
                {auctions.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground mb-4">No auctions found.</p>
                    {user && (
                      <Link to="/create-auction">
                        <Button>Create Your First Auction</Button>
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {auctions.map((auction, index) => (
                      <GlassmorphicCard
                        key={auction.id}
                        variant="default"
                        hover="lift"
                        shadow="sm"
                        className="overflow-hidden animate-fade-in"
                        style={{ animationDelay: `${0.1 * (index % 3)}s` }}
                      >
                        <Link to={`/auction/${auction.id}`} className="block">
                          <div className="relative">
                            <div className="aspect-[4/3] overflow-hidden">
                              <img
                                src={auction.image_url || 'https://images.unsplash.com/photo-1566312581307-d6bb3f6b2311?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'}
                                alt={auction.title}
                                className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                              />
                            </div>
                            <div className="absolute top-3 left-3">
                              <Badge 
                                variant={auction.status === 'active' ? 'default' : 
                                        auction.status === 'pending' ? 'secondary' : 
                                        auction.status === 'ended' ? 'outline' : 'secondary'}
                                className={
                                  auction.status === 'active' ? 'bg-green-500 hover:bg-green-600' :
                                  auction.status === 'pending' ? 'bg-yellow-500 hover:bg-yellow-600' :
                                  auction.status === 'ended' ? 'bg-red-500 hover:bg-red-600' : ''
                                }
                              >
                                {auction.status?.toUpperCase() || 'UNKNOWN'}
                              </Badge>
                            </div>
                            <div className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm text-xs font-medium py-1 px-2 rounded-sm">
                              {auction.categories?.name || 'Uncategorized'}
                            </div>
                          </div>
                          <div className="p-5 space-y-4">
                            <h3 className="font-display font-semibold text-lg line-clamp-1">
                              {auction.title}
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {auction.description}
                            </p>
                            <div className="space-y-2 pt-2 border-t border-border">
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Current Bid</span>
                                <span className="font-semibold text-gold">
                                  ${(auction.current_bid || auction.starting_bid).toLocaleString()}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Seller</span>
                                <span className="text-sm">{auction.profiles?.full_name || 'Anonymous'}</span>
                              </div>
                              {auction.approval_status && (
                                <div className="flex justify-between">
                                  <span className="text-sm text-muted-foreground">Approval</span>
                                  <Badge 
                                    variant={auction.approval_status === 'approved' ? 'default' : 
                                            auction.approval_status === 'pending' ? 'secondary' : 'outline'}
                                    className="text-xs"
                                  >
                                    {auction.approval_status}
                                  </Badge>
                                </div>
                              )}
                            </div>
                            <div className="pt-2">
                              <div className="w-full py-2 text-center bg-gold hover:bg-gold-dark text-white font-medium rounded-md transition-colors">
                                View Details
                              </div>
                            </div>
                          </div>
                        </Link>
                      </GlassmorphicCard>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Auctions;
