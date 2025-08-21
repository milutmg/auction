
import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Activity, User } from 'lucide-react';
import { GlassmorphicCard } from '@/components/ui/GlassmorphicCard';
import { cn } from '@/lib/utils';

export interface AuctionItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  currentBid: number;
  startingBid: number;
  timeLeft: string;
  category: string;
  bids: number;
  featured?: boolean;
  seller: {
    name: string;
    verified: boolean;
  };
}

interface AuctionCardProps {
  auction: AuctionItem;
  className?: string;
}

export default function AuctionCard({ auction, className }: AuctionCardProps) {
  return (
    <GlassmorphicCard
      variant={auction.featured ? "premium" : "default"}
      hover="lift"
      shadow="sm"
      className={cn("overflow-hidden h-full", className)}
    >
      <Link to={`/auction/${auction.id}`} className="block h-full">
        <div className="relative">
          <div className="aspect-[4/3] overflow-hidden">
            <img
              src={auction.imageUrl || "/placeholder.svg"}
              alt={auction.title}
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
            />
          </div>
          {auction.featured && (
            <div className="absolute top-3 left-3 bg-gold/90 text-white text-xs font-semibold py-1 px-2 rounded-sm">
              Featured
            </div>
          )}
          <div className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm text-xs font-medium py-1 px-2 rounded-sm">
            {auction.category}
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <h3 className="font-display font-semibold text-lg line-clamp-1">
              {auction.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {auction.description}
            </p>
          </div>
          
          <div className="flex items-center text-sm">
            <User className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
            <span className="text-muted-foreground flex items-center">
              {auction.seller.name}
              {auction.seller.verified && (
                <span className="ml-1 bg-blue-500/20 text-blue-500 text-xs py-0.5 px-1 rounded">
                  Verified
                </span>
              )}
            </span>
          </div>
          
          <div className="space-y-2 pt-2 border-t border-border">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Current Bid</span>
              <span className="font-semibold text-gold">${auction.currentBid.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Starting Bid</span>
              <span className="text-sm">${auction.startingBid.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5 mr-1" />
                {auction.timeLeft}
              </div>
              <div className="flex items-center text-sm">
                <Activity className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                <span>{auction.bids} bids</span>
              </div>
            </div>
          </div>
          
          <div className="pt-2">
            <div className="w-full py-2 text-center bg-gold hover:bg-gold-dark text-white font-medium rounded-md transition-colors">
              View Details
            </div>
          </div>
        </div>
      </Link>
    </GlassmorphicCard>
  );
}
