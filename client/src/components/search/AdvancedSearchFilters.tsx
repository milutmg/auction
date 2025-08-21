import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Filter, X, Search, MapPin, Star, DollarSign } from 'lucide-react';
import apiService from '@/services/api';

interface FilterProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onSearch: () => void;
  categories: Array<{id: string, name: string}>;
  loading?: boolean;
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

const AdvancedSearchFilters: React.FC<FilterProps> = ({
  filters,
  onFiltersChange,
  onSearch,
  categories,
  loading = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{type: string, value: string}>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [priceRange, setPriceRange] = useState([filters.min_price || 0, filters.max_price || 10000]);

  // Debounced search suggestions
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (filters.q && filters.q.length >= 2) {
        try {
          const response = await apiService.get(`/search/suggestions?q=${encodeURIComponent(filters.q)}`);
          setSuggestions(response.suggestions || []);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Failed to fetch suggestions:', error);
          setSuggestions([]);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [filters.q]);

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearFilter = (key: keyof SearchFilters) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    onFiltersChange({});
    setPriceRange([0, 10000]);
  };

  const handlePriceRangeChange = (values: number[]) => {
    setPriceRange(values);
    updateFilter('min_price', values[0]);
    updateFilter('max_price', values[1]);
  };

  const handleSuggestionClick = (suggestion: {type: string, value: string}) => {
    if (suggestion.type === 'category') {
      updateFilter('category', suggestion.value);
    } else if (suggestion.type === 'location') {
      updateFilter('location', suggestion.value);
    } else {
      updateFilter('q', suggestion.value);
    }
    setShowSuggestions(false);
  };

  const getActiveFiltersCount = () => {
    return Object.keys(filters).filter(key => 
      key !== 'q' && key !== 'sort' && filters[key as keyof SearchFilters]
    ).length;
  };

  const conditions = [
    { value: 'mint', label: 'Mint Condition' },
    { value: 'excellent', label: 'Excellent' },
    { value: 'very_good', label: 'Very Good' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' },
    { value: 'poor', label: 'Poor' }
  ];

  const auctionTypes = [
    { value: 'active', label: 'Active Auctions' },
    { value: 'ending_soon', label: 'Ending Soon (24h)' },
    { value: 'ended', label: 'Ended Auctions' }
  ];

  const dateRanges = [
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' }
  ];

  const endTimeRanges = [
    { value: 'ending_soon', label: 'Ending Soon (24h)' },
    { value: 'this_week', label: 'This Week' },
    { value: 'this_month', label: 'This Month' }
  ];

  const sortOptions = [
    { value: 'relevance', label: 'Relevance' },
    { value: 'price_low', label: 'Price: Low to High' },
    { value: 'price_high', label: 'Price: High to Low' },
    { value: 'ending_soon', label: 'Ending Soon' },
    { value: 'newest', label: 'Newest First' },
    { value: 'most_bids', label: 'Most Bids' },
    { value: 'most_watched', label: 'Most Watched' },
    { value: 'seller_rating', label: 'Seller Rating' }
  ];

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Search & Filters
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary" className="ml-2">
                {getActiveFiltersCount()} active
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {getActiveFiltersCount() > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                Clear All
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Main Search Bar */}
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search auctions, categories, locations..."
              value={filters.q || ''}
              onChange={(e) => updateFilter('q', e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && onSearch()}
              className="pl-10 pr-10"
            />
            {filters.q && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                onClick={() => clearFilter('q')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Search Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion.type === 'category' && <Filter className="h-4 w-4 text-gray-400" />}
                  {suggestion.type === 'location' && <MapPin className="h-4 w-4 text-gray-400" />}
                  {suggestion.type === 'title' && <Search className="h-4 w-4 text-gray-400" />}
                  <span className="text-sm">{suggestion.value}</span>
                  <span className="text-xs text-gray-500 ml-auto">{suggestion.type}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="featured"
              checked={filters.featured || false}
              onCheckedChange={(checked) => updateFilter('featured', checked)}
            />
            <Label htmlFor="featured" className="text-sm">Featured Only</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="authenticity"
              checked={filters.authenticity_certificate || false}
              onCheckedChange={(checked) => updateFilter('authenticity_certificate', checked)}
            />
            <Label htmlFor="authenticity" className="text-sm">Authenticated</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="shipping"
              checked={filters.shipping_included || false}
              onCheckedChange={(checked) => updateFilter('shipping_included', checked)}
            />
            <Label htmlFor="shipping" className="text-sm">Free Shipping</Label>
          </div>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-4">
          <Label className="text-sm font-medium whitespace-nowrap">Sort by:</Label>
          <Select value={filters.sort || 'relevance'} onValueChange={(value) => updateFilter('sort', value)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Advanced Filters */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleContent className="space-y-4 pt-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Category */}
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={filters.category || ''} onValueChange={(value) => updateFilter('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Condition */}
              <div className="space-y-2">
                <Label>Condition</Label>
                <Select value={filters.condition || ''} onValueChange={(value) => updateFilter('condition', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any Condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any Condition</SelectItem>
                    {conditions.map(condition => (
                      <SelectItem key={condition.value} value={condition.value}>
                        {condition.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Auction Type */}
              <div className="space-y-2">
                <Label>Auction Type</Label>
                <Select value={filters.auction_type || 'active'} onValueChange={(value) => updateFilter('auction_type', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {auctionTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label>Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Enter location"
                    value={filters.location || ''}
                    onChange={(e) => updateFilter('location', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Keywords */}
              <div className="space-y-2">
                <Label>Keywords</Label>
                <Input
                  placeholder="e.g., vintage, antique, rare"
                  value={filters.keywords || ''}
                  onChange={(e) => updateFilter('keywords', e.target.value)}
                />
              </div>

              {/* Materials */}
              <div className="space-y-2">
                <Label>Materials</Label>
                <Input
                  placeholder="e.g., wood, metal, ceramic"
                  value={filters.materials || ''}
                  onChange={(e) => updateFilter('materials', e.target.value)}
                />
              </div>
            </div>

            {/* Price Range */}
            <div className="space-y-4">
              <Label className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Price Range: ${priceRange[0]} - ${priceRange[1]}
              </Label>
              <Slider
                value={priceRange}
                onValueChange={handlePriceRangeChange}
                max={10000}
                min={0}
                step={50}
                className="w-full"
              />
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    type="number"
                    placeholder="Min price"
                    value={priceRange[0]}
                    onChange={(e) => handlePriceRangeChange([parseInt(e.target.value) || 0, priceRange[1]])}
                  />
                </div>
                <div className="flex-1">
                  <Input
                    type="number"
                    placeholder="Max price"
                    value={priceRange[1]}
                    onChange={(e) => handlePriceRangeChange([priceRange[0], parseInt(e.target.value) || 10000])}
                  />
                </div>
              </div>
            </div>

            {/* Minimum Seller Rating */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                Minimum Seller Rating
              </Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(rating => (
                  <Button
                    key={rating}
                    variant={filters.seller_rating === rating ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateFilter('seller_rating', rating)}
                    className="flex items-center gap-1"
                  >
                    {rating} <Star className="h-3 w-3" />
                  </Button>
                ))}
              </div>
            </div>

            {/* Date Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Created Date</Label>
                <Select value={filters.date_range || ''} onValueChange={(value) => updateFilter('date_range', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any time</SelectItem>
                    {dateRanges.map(range => (
                      <SelectItem key={range.value} value={range.value}>
                        {range.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Ending Time</Label>
                <Select value={filters.end_time_range || ''} onValueChange={(value) => updateFilter('end_time_range', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any time</SelectItem>
                    {endTimeRanges.map(range => (
                      <SelectItem key={range.value} value={range.value}>
                        {range.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Search Button */}
        <Button 
          onClick={onSearch} 
          className="w-full" 
          size="lg"
          disabled={loading}
        >
          {loading ? 'Searching...' : 'Search Auctions'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default AdvancedSearchFilters;
