import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { GlassmorphicCard } from '@/components/ui/GlassmorphicCard';
import { AnimatedButton } from '@/components/ui/AnimatedButton';

interface Category {
  id: string;
  name: string;
  description: string;
  auction_count: string;
  active_auction_count: string;
  pending_auction_count: string;
  avg_price: string;
  min_price: string;
  max_price: string;
  featured: boolean;
}

// Category images mapping (you can add more as needed)
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

const Categories = () => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/categories`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      } else {
        throw new Error('Failed to fetch categories');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: "Error",
        description: "Failed to load categories",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNotImplemented = (e: React.MouseEvent) => {
    e.preventDefault();
    toast({
      title: "Coming Soon",
      description: "This feature will be available soon!",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-lg">Loading categories...</p>
        </div>
      </div>
    );
  }

  const featuredCategories = categories.filter(cat => cat.featured);
  const regularCategories = categories.filter(cat => !cat.featured);

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow pb-20">
        <section className="py-12 md:py-16 relative overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-muted/30 to-background" />
          <div className="absolute top-1/3 right-0 w-80 h-80 bg-gold/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-60 h-60 bg-gold/10 rounded-full blur-3xl" />
          
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="inline-block py-1 px-3 text-xs font-medium uppercase tracking-wider rounded-full bg-gold/10 text-gold mb-4">
                Explore
              </span>
              <h1 className="text-4xl md:text-5xl font-display font-bold mb-6">
                Browse By Category
              </h1>
              <p className="text-muted-foreground text-lg">
                Discover our authenticated antiques across different categories, each with its own unique history and character.
              </p>
            </div>

            {/* Featured Categories */}
            <div className="mb-16">
              <h2 className="text-2xl font-display font-semibold mb-8">
                Featured Categories
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {featuredCategories.map((category, index) => (
                  <GlassmorphicCard
                    key={category.id}
                    variant="default"
                    hover="lift"
                    shadow="sm"
                    className="overflow-hidden animate-fade-in h-full"
                    style={{ animationDelay: `${0.1 * index}s` }}
                  >
                    <div className="aspect-[4/3] overflow-hidden">
                      <img
                        src={getCategoryImage(category.name)}
                        alt={category.name}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                      />
                    </div>
                    <div className="p-5 space-y-4">
                      <h3 className="font-display font-semibold text-lg">
                        {category.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {category.description}
                      </p>
                      <div className="pt-2 flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {category.auction_count} items
                        </span>
                        <Link
                          to={`/categories/${encodeURIComponent(category.name)}`}
                          className="text-gold hover:underline text-sm font-medium"
                        >
                          View Category
                        </Link>
                      </div>
                    </div>
                  </GlassmorphicCard>
                ))}
              </div>
            </div>

            {/* All Categories */}
            <div>
              <h2 className="text-2xl font-display font-semibold mb-8">
                All Categories
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {regularCategories.map((category) => (
                  <GlassmorphicCard
                    key={category.id}
                    variant="subtle"
                    hover="lift"
                    shadow="sm"
                    className="p-5 animate-fade-in"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-display font-semibold">
                          {category.name}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {category.auction_count} items
                        </p>
                      </div>
                      <img
                        src={getCategoryImage(category.name)}
                        alt={category.name}
                        className="w-14 h-14 rounded-md object-cover"
                      />
                    </div>
                    <div className="mt-4">
                      <Link
                        to={`/categories/${encodeURIComponent(category.name)}`}
                        className="text-gold hover:underline text-sm font-medium"
                      >
                        View Category
                      </Link>
                    </div>
                  </GlassmorphicCard>
                ))}
              </div>
            </div>

            {/* Call to Action */}
            <div className="mt-20 text-center">
              <GlassmorphicCard
                variant="premium"
                shadow="md"
                className="p-8 max-w-2xl mx-auto"
              >
                <h2 className="text-2xl md:text-3xl font-display font-semibold mb-4">
                  Can't find what you're looking for?
                </h2>
                <p className="text-muted-foreground mb-6">
                  Let our team of experts help you source the perfect antique for your collection.
                </p>
                <AnimatedButton
                  variant="premium"
                  size="lg"
                  className="font-medium"
                  onClick={handleNotImplemented}
                >
                  Contact Our Specialists
                </AnimatedButton>
              </GlassmorphicCard>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Categories;
