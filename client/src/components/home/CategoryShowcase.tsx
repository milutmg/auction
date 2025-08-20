import React from 'react';
import { Link } from 'react-router-dom';
import { GlassmorphicCard } from '@/components/ui/GlassmorphicCard';

// Curated category showcase (can be static or later fetched)
const categories = [
  { name: 'Fine Art', slug: 'Fine Art', img: 'https://images.unsplash.com/photo-1582561424557-058a57e27069?auto=format&fit=crop&w=800&q=80', items: 320 },
  { name: 'Furniture', slug: 'Furniture', img: 'https://images.unsplash.com/photo-1537182534312-f945134cce34?auto=format&fit=crop&w=800&q=80', items: 540 },
  { name: 'Jewelry', slug: 'Jewelry', img: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80', items: 210 },
  { name: 'Ceramics', slug: 'Ceramics', img: 'https://images.unsplash.com/photo-1530039251581-c38ce8a8a346?auto=format&fit=crop&w=800&q=80', items: 180 },
  { name: 'Silver', slug: 'Silver', img: 'https://images.unsplash.com/photo-1548483531-7edb5d09c597?auto=format&fit=crop&w=800&q=80', items: 95 },
  { name: 'Collectibles', slug: 'Collectibles', img: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80', items: 260 },
];

const CategoryShowcase: React.FC = () => {
  return (
    <section className="py-16 bg-gradient-to-b from-background to-muted/30 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <div className="max-w-xl">
            <span className="inline-block py-1 px-3 text-xs font-medium uppercase tracking-wider rounded-full bg-gold/10 text-gold mb-4">
              Explore Categories
            </span>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Browse Popular Categories</h2>
            <p className="text-muted-foreground">Jump straight into areas with high bidder interest. Every item is vetted for authenticity.</p>
          </div>
          <Link to="/categories" className="self-start md:self-end text-gold font-medium hover:underline">View All</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
          {categories.map((c, i) => (
            <GlassmorphicCard
              key={c.slug}
              variant="subtle"
              hover="lift"
              shadow="sm"
              className="group overflow-hidden p-0 animate-fade-in"
              style={{ animationDelay: `${0.05 * i}s` }}
            >
              <Link to={`/categories/${encodeURIComponent(c.slug)}`} className="block relative">
                <div className="aspect-square overflow-hidden">
                  <img src={c.img} alt={c.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="p-3 md:p-4">
                  <h3 className="text-sm md:text-base font-semibold font-display line-clamp-1">{c.name}</h3>
                  <p className="text-xs text-muted-foreground">{c.items}+ items</p>
                </div>
              </Link>
            </GlassmorphicCard>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryShowcase;
