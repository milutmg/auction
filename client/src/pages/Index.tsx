
import React from 'react';
import Hero from '@/components/home/Hero';
import FeaturedAuctions from '@/components/home/FeaturedAuctions';
import HowItWorks from '@/components/home/HowItWorks';
import Testimonials from '@/components/home/Testimonials';
import ApiTest from '@/components/debug/ApiTest';

export default function Index() {
  return (
    <>
      <Hero />
      <div className="py-8">
        <ApiTest />
      </div>
      <FeaturedAuctions />
      <HowItWorks />
      <Testimonials />
    </>
  );
}
