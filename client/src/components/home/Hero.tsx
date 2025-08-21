
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { GlassmorphicCard } from '@/components/ui/GlassmorphicCard';

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-ivory to-ivory-dark dark:from-charcoal dark:to-charcoal-dark overflow-hidden">
        <div className="absolute top-1/4 -left-10 w-60 h-60 bg-gold/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gold/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-8 max-w-xl animate-fade-in">
            <div>
              <span className="inline-block py-1 px-3 mb-4 text-xs font-medium uppercase tracking-wider rounded-full bg-gold/10 text-gold">
                Premium Antique Auction Platform
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold leading-tight text-charcoal dark:text-ivory">
                Discover Rare Treasures from the Past
              </h1>
              <p className="mt-6 text-lg text-muted-foreground">
                Bid on authenticated antiques in a transparent marketplace. Our platform connects collectors with verified sellers, ensuring a secure and seamless experience.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <AnimatedButton 
                size="lg" 
                variant="premium" 
                className="font-medium"
                asChild
              >
                <Link to="/auctions">
                  Explore Auctions <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </AnimatedButton>
              <AnimatedButton 
                size="lg" 
                variant="outline" 
                className="font-medium"
                asChild
              >
                <Link to="/#how-it-works">
                  How It Works
                </Link>
              </AnimatedButton>
            </div>
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center">
                <div className="mr-2 h-2 w-2 rounded-full bg-gold" />
                <span className="text-muted-foreground">Verified Authenticity</span>
              </div>
              <div className="flex items-center">
                <div className="mr-2 h-2 w-2 rounded-full bg-gold" />
                <span className="text-muted-foreground">Secure Transactions</span>
              </div>
              <div className="flex items-center">
                <div className="mr-2 h-2 w-2 rounded-full bg-gold" />
                <span className="text-muted-foreground">Expert Appraisals</span>
              </div>
            </div>
          </div>

          <div className="relative" style={{ perspective: '1000px' }}>
            <GlassmorphicCard 
              variant="premium" 
              shadow="lg"
              className="lg:absolute lg:top-0 lg:right-0 w-full max-w-lg p-6 animate-fade-in"
              style={{ animationDelay: '0.2s', transform: 'rotateY(-5deg)' }}
            >
              <div className="relative aspect-[3/4] overflow-hidden rounded-md mb-4">
                <img 
                  src="https://thelightclinic.co.uk/cdn/shop/files/ED77F56C-7712-44F8-88AF-C299BB9A6548_1024x1024@2x.jpg?v=1733747176" 
                  alt="Antique vase"
                  className="object-cover w-full h-full hover-scale"
                />
                <div className="absolute top-3 right-3 bg-gold/90 text-white text-xs font-semibold py-1 px-2 rounded-sm">
                  Featured
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-display font-semibold">18th Century Ming Dynasty Vase</h3>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current Bid</span>
                  <span className="font-semibold text-gold">$24,500</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Ends in</span>
                  <span className="font-medium">2 days, 14 hours</span>
                </div>
              </div>
            </GlassmorphicCard>

            <GlassmorphicCard 
              variant="subtle" 
              shadow="md"
              className="lg:absolute lg:top-1/3 lg:-left-12 w-full max-w-sm p-4 animate-fade-in"
              style={{ animationDelay: '0.4s', transform: 'rotateY(5deg) translateZ(-10px)' }}
            >
              <div className="relative aspect-video overflow-hidden rounded-md mb-3">
                <img 
                  src="https://images.unsplash.com/photo-1566805484277-4d0be27e9ce6?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fGFudGlxdWUlMjBjbG9ja3xlbnwwfHwwfHx8MA%3D%3D" 
                  alt="Art Deco Mantel Clock"
                  className="object-cover w-full h-full hover-scale"
                />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-display font-medium">Art Deco Mantel Clock</h3>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Current Bid</span>
                  <span className="font-semibold text-gold">$5,200</span>
                </div>
              </div>
            </GlassmorphicCard>
          </div>
        </div>

        <div className="mt-20 lg:mt-32 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10">
          <div className="text-center space-y-2 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="text-3xl md:text-4xl font-display font-bold text-gold">2.5K+</div>
            <p className="text-sm text-muted-foreground">Verified Antiques</p>
          </div>
          <div className="text-center space-y-2 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="text-3xl md:text-4xl font-display font-bold text-gold">10K+</div>
            <p className="text-sm text-muted-foreground">Active Bidders</p>
          </div>
          <div className="text-center space-y-2 animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <div className="text-3xl md:text-4xl font-display font-bold text-gold">150+</div>
            <p className="text-sm text-muted-foreground">Verified Sellers</p>
          </div>
          <div className="text-center space-y-2 animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <div className="text-3xl md:text-4xl font-display font-bold text-gold">99%</div>
            <p className="text-sm text-muted-foreground">Satisfaction Rate</p>
          </div>
        </div>
      </div>
    </section>
  );
}
