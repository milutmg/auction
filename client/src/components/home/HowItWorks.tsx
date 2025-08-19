
import React from 'react';
import { Search, Heart, ShieldCheck, BadgeDollarSign } from 'lucide-react';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { GlassmorphicCard } from '@/components/ui/GlassmorphicCard';

// How it works steps
const steps = [
  {
    id: 1,
    title: 'Discover Antiques',
    description: 'Browse through our curated collection of authenticated antiques from trusted sellers around the world.',
    icon: Search,
    color: 'bg-blue-500/10 text-blue-500',
  },
  {
    id: 2,
    title: 'Place Your Bid',
    description: 'Set your maximum bid on your favorite items. Our system will automatically increment your bid up to your maximum.',
    icon: Heart,
    color: 'bg-red-500/10 text-red-500',
  },
  {
    id: 3,
    title: 'Secure Transaction',
    description: 'Once you win an auction, our secure payment system ensures your transaction is protected and verified.',
    icon: ShieldCheck,
    color: 'bg-green-500/10 text-green-500',
  },
  {
    id: 4,
    title: 'Receive Your Treasure',
    description: 'We coordinate with sellers to ensure your antique is carefully packaged and shipped to your doorstep.',
    icon: BadgeDollarSign,
    color: 'bg-gold/10 text-gold',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-muted/30 to-background" />
      <div className="absolute top-1/3 right-0 w-80 h-80 bg-gold/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-1/4 w-60 h-60 bg-gold/10 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block py-1 px-3 text-xs font-medium uppercase tracking-wider rounded-full bg-gold/10 text-gold mb-4">
            Simple Process
          </span>
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
            How AntiquaBid Works
          </h2>
          <p className="text-muted-foreground">
            Our transparent bidding platform makes it easy to discover, bid on, and acquire authentic antiques from verified sellers worldwide.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div 
              key={step.id} 
              className="flex flex-col items-center text-center animate-fade-in"
              style={{ animationDelay: `${0.15 * index}s` }}
            >
              <div className={`relative mb-6 rounded-full p-4 ${step.color}`}>
                <step.icon className="h-7 w-7" strokeWidth={1.5} />
                <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gold text-white text-xs flex items-center justify-center font-bold">
                  {step.id}
                </span>
              </div>
              <h3 className="text-xl font-display font-semibold mb-3">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 pt-10 border-t border-border">
          <GlassmorphicCard
            variant="premium"
            shadow="md"
            className="p-8 md:p-10 max-w-4xl mx-auto text-center animate-fade-in"
          >
            <h3 className="text-2xl md:text-3xl font-display font-semibold mb-4">
              Ready to Start Bidding?
            </h3>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Create an account today to start exploring our exclusive collection of antiques and place your first bid.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <AnimatedButton
                variant="premium"
                size="lg"
                className="font-medium"
              >
                Register Now
              </AnimatedButton>
              <AnimatedButton
                variant="outline"
                size="lg"
                className="font-medium"
              >
                Learn More
              </AnimatedButton>
            </div>
          </GlassmorphicCard>
        </div>
      </div>
    </section>
  );
}
