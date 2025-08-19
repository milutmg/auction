
import React from 'react';
import { GlassmorphicCard } from '@/components/ui/GlassmorphicCard';

const About = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow pb-20">
        <section className="py-12 md:py-16 relative overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-muted/30 to-background" />
          <div className="absolute top-1/3 right-0 w-80 h-80 bg-gold/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-60 h-60 bg-gold/10 rounded-full blur-3xl" />
          
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <span className="inline-block py-1 px-3 text-xs font-medium uppercase tracking-wider rounded-full bg-gold/10 text-gold mb-4">
                Our Story
              </span>
              <h1 className="text-4xl md:text-5xl font-display font-bold mb-6">
                About AntiquaBid
              </h1>
              <p className="text-muted-foreground text-lg">
                Connecting collectors with authentic treasures from around the world.
              </p>
            </div>

            <GlassmorphicCard
              variant="default"
              shadow="md"
              className="p-8 md:p-10 max-w-4xl mx-auto mb-12"
            >
              <div className="prose prose-lg dark:prose-invert mx-auto">
                <p>
                  Founded in 2022, AntiquaBid was created by a team of antique enthusiasts and technology
                  experts who saw the need for a more transparent and accessible platform for antique trading.
                </p>
                <p>
                  Our mission is to bridge the gap between collectors, sellers, and authenticated antiques,
                  creating a marketplace that values integrity, provenance, and fair market pricing.
                </p>
                <p>
                  What sets AntiquaBid apart is our commitment to authentication. Every item listed on our
                  platform undergoes a rigorous verification process by our team of experts, ensuring that
                  our users can bid with confidence.
                </p>
                <p>
                  We believe that historical artifacts and antiques should be preserved and cherished, which
                  is why we also work with museums and cultural institutions to ensure that particularly
                  significant items are documented and, when possible, made accessible to the public.
                </p>
              </div>
            </GlassmorphicCard>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <GlassmorphicCard
                variant="subtle"
                shadow="sm"
                className="p-6"
              >
                <h2 className="text-2xl font-display font-semibold mb-4">Our Values</h2>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-gold/10 text-gold mr-3 mt-0.5">
                      •
                    </span>
                    <span>Authenticity in every transaction</span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-gold/10 text-gold mr-3 mt-0.5">
                      •
                    </span>
                    <span>Transparency throughout the bidding process</span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-gold/10 text-gold mr-3 mt-0.5">
                      •
                    </span>
                    <span>Respect for historical significance and provenance</span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-gold/10 text-gold mr-3 mt-0.5">
                      •
                    </span>
                    <span>Commitment to fair market pricing</span>
                  </li>
                </ul>
              </GlassmorphicCard>

              <GlassmorphicCard
                variant="subtle"
                shadow="sm"
                className="p-6"
              >
                <h2 className="text-2xl font-display font-semibold mb-4">Our Team</h2>
                <p className="mb-4">
                  Our team consists of experienced antique appraisers, art historians, technology specialists,
                  and customer service professionals who are passionate about connecting people with pieces 
                  of history.
                </p>
                <p>
                  Each team member brings unique expertise to ensure AntiquaBid offers the most comprehensive,
                  secure, and enjoyable antique trading experience possible.
                </p>
              </GlassmorphicCard>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default About;
