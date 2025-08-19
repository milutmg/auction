
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock } from 'lucide-react';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { GlassmorphicCard } from '@/components/ui/GlassmorphicCard';

// Sample auctions data
const featuredAuctions = [
  {
    id: '1',
    title: 'Victorian Mahogany Writing Desk',
    description: 'Exquisite 19th century writing desk with intricate carvings and original brass hardware.',
    currentBid: 3800,
    estimatedValue: '4,000 - 6,000',
    timeLeft: '1 day, 6 hours',
    imageUrl: 'https://images.unsplash.com/photo-1566312581307-d6bb3f6b2311?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    category: 'Furniture',
    bids: 12,
  },
  {
    id: '2',
    title: 'Art Nouveau Silver Tea Set',
    description: 'Complete 5-piece silver tea service with floral motifs, circa 1905.',
    currentBid: 5200,
    estimatedValue: '5,500 - 7,500',
    timeLeft: '2 days, 14 hours',
    imageUrl: 'https://images.unsplash.com/photo-1592500305630-419da01a7c33?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    category: 'Silver',
    bids: 8,
  },
  {
    id: '3',
    title: 'Rare Meiji Period Japanese Vase',
    description: 'Porcelain vase with hand-painted scenes of Mount Fuji and traditional landscapes.',
    currentBid: 7600,
    estimatedValue: '7,000 - 9,000',
    timeLeft: '3 days, 9 hours',
    imageUrl: 'https://images.unsplash.com/photo-1607974086865-c43ca42551d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    category: 'Ceramics',
    bids: 15,
  },
  {
    id: '4',
    title: '18th Century French Oil Painting',
    description: 'Original landscape painting in ornate gilded frame, artist unknown.',
    currentBid: 12400,
    estimatedValue: '12,000 - 18,000',
    timeLeft: '4 days, 21 hours',
    imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    category: 'Art',
    bids: 22,
  },
];

export default function FeaturedAuctions() {
  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background to-muted/30" />
      
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12">
          <div className="max-w-lg">
            <span className="inline-block py-1 px-3 text-xs font-medium uppercase tracking-wider rounded-full bg-gold/10 text-gold mb-4">
              Featured Listings
            </span>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Current Auctions
            </h2>
            <p className="text-muted-foreground">
              Discover our handpicked selection of premium antiques currently open for bidding. Each item is verified for authenticity and carefully appraised.
            </p>
          </div>
          <Link to="/auctions" className="mt-6 md:mt-0 group flex items-center text-gold font-medium hover:underline">
            View All Auctions
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {featuredAuctions.map((auction, index) => (
            <GlassmorphicCard
              key={auction.id}
              variant="default"
              hover="lift"
              shadow="sm"
              className="overflow-hidden animate-fade-in"
              style={{ animationDelay: `${0.1 * index}s` }}
            >
              <div className="relative">
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={auction.imageUrl}
                    alt={auction.title}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                  />
                </div>
                <div className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm text-xs font-medium py-1 px-2 rounded-sm">
                  {auction.category}
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
                    <span className="font-semibold text-gold">${auction.currentBid.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 mr-1" />
                      {auction.timeLeft}
                    </div>
                    <span className="text-xs font-medium">{auction.bids} bids</span>
                  </div>
                </div>
                <Link 
                  to={`/auction/${auction.id}`}
                  className="block w-full text-center py-2 mt-2 bg-gold hover:bg-gold-dark text-white font-medium rounded-md transition-colors"
                >
                  View Details
                </Link>
              </div>
            </GlassmorphicCard>
          ))}
        </div>

        <div className="mt-12 text-center">
          <AnimatedButton 
            variant="outline" 
            size="lg" 
            className="font-medium"
            asChild
          >
            <Link to="/auctions">
              Explore All Auctions <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </AnimatedButton>
        </div>
      </div>
    </section>
  );
}
