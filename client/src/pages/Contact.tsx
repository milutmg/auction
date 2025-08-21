import React from 'react';
import { GlassmorphicCard } from '@/components/ui/GlassmorphicCard';

export const route = '/contact';

export default function Contact() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow pt-24 pb-20">
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            <GlassmorphicCard variant="default" shadow="sm" className="p-6">
              <h1 className="text-3xl font-display font-bold mb-6">Contact Us</h1>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  We'd love to hear from you! Please find our contact details and location below.
                </p>
                <h2 className="text-2xl font-display font-semibold mt-6 mb-3">Our Location</h2>
                <div className="aspect-video w-full max-w-2xl mx-auto">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3531.0000000000005!2d85.3239599!3d27.746999999999998!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39eb1920a0000001%3A0x0!2zMjfCsDQ0JzQ5LjIiTiA4NcKwMTknMjYuMiJF!5e0!3m2!1sen!2snp!4v1678912345678!5m2!1sen!2snp"
                    width="100%"
                    height="450"
                    style={{ border: 0 }}
                    allowFullScreen={true}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  ></iframe>
                </div>
                <h2 className="text-2xl font-display font-semibold mt-6 mb-3">Contact Information</h2>
                <p>
                  <strong>Email:</strong> <a href="mailto:milantamang@gmail.com" className="text-gold hover:underline">milantamang@gmail.com</a>
                </p>
                <p>
                  <strong>Phone:</strong> <a href="tel:+9779749566845" className="text-gold hover:underline">+977 9749566845</a>
                </p>
              </div>
            </GlassmorphicCard>
          </div>
        </section>
      </main>
    </div>
  );
}
