
import React from 'react';
import { Star } from 'lucide-react';
import { GlassmorphicCard } from '@/components/ui/GlassmorphicCard';

// Sample testimonials data
const testimonials = [
  {
    id: 1,
    name: 'Eleanor Richardson',
    role: 'Antique Collector',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80',
    quote: 'AntiquaBid has transformed how I discover rare pieces. The authentication process gives me confidence in every purchase I make.',
    rating: 5,
  },
  {
    id: 2,
    name: 'David Chen',
    role: 'Interior Designer',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80',
    quote: 'As a designer, I rely on AntiquaBid to source unique pieces for my clients. The platform is intuitive and the quality of items is exceptional.',
    rating: 5,
  },
  {
    id: 3,
    name: 'Sarah Thompson',
    role: 'Gallery Owner',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80',
    quote: "The transparency of the bidding process is refreshing. I've been able to acquire museum-quality pieces at fair market prices.",
    rating: 4,
  },
];

export default function Testimonials() {
  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background to-ivory dark:to-charcoal-light/20" />
      
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block py-1 px-3 text-xs font-medium uppercase tracking-wider rounded-full bg-gold/10 text-gold mb-4">
            Client Testimonials
          </span>
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
            What Our Clients Say
          </h2>
          <p className="text-muted-foreground">
            Discover why collectors and sellers trust AntiquaBid for their antique trading needs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <GlassmorphicCard
              key={testimonial.id}
              variant="subtle"
              hover="lift"
              shadow="sm"
              className="p-6 animate-fade-in"
              style={{ animationDelay: `${0.15 * index}s` }}
            >
              <div className="flex items-center mb-4">
                <div className="relative mr-4">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="h-12 w-12 rounded-full object-cover border-2 border-gold"
                  />
                </div>
                <div>
                  <h3 className="font-display font-semibold">{testimonial.name}</h3>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < testimonial.rating ? 'text-gold fill-gold' : 'text-muted'
                    }`}
                  />
                ))}
              </div>
              <blockquote className="text-muted-foreground italic">
                "{testimonial.quote}"
              </blockquote>
            </GlassmorphicCard>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-lg font-medium mb-2">Trusted by collectors worldwide</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-70">
            <div className="h-8">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 50" fill="currentColor" className="h-full">
                <path d="M30 15h-5v20h5V15zM35 35h5V15h-5v20zM50 35h5V15h-5v20zM65 35h5V15h-5v20zM80 35h5V15h-5v20zM95 35h5V15h-5v20zM110 35h5V15h-5v20z"/>
              </svg>
            </div>
            <div className="h-8">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 50" fill="currentColor" className="h-full">
                <path d="M25 15v20h10V25h10v10h10V15H45v10H35V15H25zM65 15v20h10V15H65zM85 15v20h10V25h10v10h10V15h-10v10h-10V15H85z"/>
              </svg>
            </div>
            <div className="h-8">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 50" fill="currentColor" className="h-full">
                <path d="M30 15H20v20h10V15zM40 15v20h20V25H50v-5h10v-5H40zM70 15v20h20V25H80v-5h10v-5H70zM100 15v20h20V25h-10v-5h10v-5h-20z"/>
              </svg>
            </div>
            <div className="h-8">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 50" fill="currentColor" className="h-full">
                <path d="M25 15v20h10V25h5v10h10V25h5v10h10V15H55v10h-5V15H40v10h-5V15H25zM75 15v20h30v-5H85v-5h15v-5H85v-5h20v-5H75z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
