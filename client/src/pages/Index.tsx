import React from 'react';
import Hero from '@/components/home/Hero';
import { useAuth } from '@/contexts/AuthContext';

export default function Index() {
  const { user } = useAuth();
  return (
    <>
      <Hero />
      <section className="py-16 bg-white dark:bg-charcoal text-center border-t border-gray-100 dark:border-charcoal-light/30">
        <div className="container mx-auto px-4 max-w-3xl">
          {user ? (
            <>
              <h2 className="text-2xl md:text-3xl font-display font-semibold mb-4">Welcome back{user.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}!</h2>
              <p className="text-muted-foreground mb-8">Jump back into bidding or manage your activity.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="/auctions" className="px-6 py-3 rounded-md bg-gold text-white font-medium hover:bg-gold-dark transition">Browse Auctions</a>
                <a href="/dashboard" className="px-6 py-3 rounded-md border border-gray-300 dark:border-charcoal-light font-medium hover:bg-gray-50 dark:hover:bg-charcoal-light/40 transition">Go to Dashboard</a>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-2xl md:text-3xl font-display font-semibold mb-4">Discover & Bid Securely</h2>
              <p className="text-muted-foreground mb-8">Create an account or sign in to browse categories, view detailed listings, and place bids on authenticated antiques.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="/auth" className="px-6 py-3 rounded-md bg-gold text-white font-medium hover:bg-gold-dark transition">Sign In / Register</a>
                <a href="/about" className="px-6 py-3 rounded-md border border-gray-300 dark:border-charcoal-light font-medium hover:bg-gray-50 dark:hover:bg-charcoal-light/40 transition">Learn More</a>
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
