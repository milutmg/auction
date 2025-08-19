export interface Auction {
  id: string;
  title: string;
  description: string;
  starting_price: number;
  current_price: number;
  image_url: string;
  start_time: string;
  end_time: string;
  status: 'upcoming' | 'active' | 'ended';
  category: string;
  seller_id: string;
  seller_name?: string;
  bid_count?: number;
  created_at: string;
  updated_at: string;
}

export interface BidData {
  auctionId: string;
  userId: string;
  amount: number;
  bidderName: string;
  timestamp: string;
}

export interface AuctionUpdate {
  auctionId: string;
  currentPrice: number;
  bidCount: number;
  highestBidder: string;
  timeRemaining: number;
}

export interface CreateAuctionRequest {
  title: string;
  description: string;
  starting_price: number;
  start_time: string;
  end_time: string;
  category: string;
  image_url?: string;
}

export interface AuctionFilters {
  category?: string;
  status?: 'upcoming' | 'active' | 'ended';
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}
