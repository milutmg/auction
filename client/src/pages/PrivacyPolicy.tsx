import React from 'react';
import { GlassmorphicCard } from '@/components/ui/GlassmorphicCard';

export const route = '/privacy';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow pt-24 pb-20">
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            <GlassmorphicCard variant="default" shadow="sm" className="p-6">
              <h1 className="text-3xl font-display font-bold mb-6">Privacy Policy</h1>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  AntiquaBid  is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services.
                </p>
                <h2 className="text-2xl font-display font-semibold mt-6 mb-3">1. Information We Collect</h2>
                <p>
                  We may collect personal information you provide directly (such as name, email, shipping address, and payment information), and information collected automatically (such as usage data and cookies).
                </p>
                <h2 className="text-2xl font-display font-semibold mt-6 mb-3">2. How We Use Your Information</h2>
                <p>
                  We use your information to provide and improve our services, process payments, communicate with you, enforce our terms, and comply with legal obligations.
                </p>
                <h2 className="text-2xl font-display font-semibold mt-6 mb-3">3. Sharing and Disclosure</h2>
                <p>
                  We may share information with service providers, payment processors, and when required by law. We do not sell your personal information.
                </p>
                <h2 className="text-2xl font-display font-semibold mt-6 mb-3">4. Data Security</h2>
                <p>
                  We implement reasonable security measures to protect your information, but no method of transmission or storage is 100% secure.
                </p>
                <h2 className="text-2xl font-display font-semibold mt-6 mb-3">5. Your Choices</h2>
                <p>
                  You may access, update, or delete your account information and opt out of certain communications. Contact us for requests.
                </p>
                <p>
                  Depending on your location, you may have certain rights regarding your personal information, including the right to access, correct, update, or request deletion of your personal data. To exercise these rights, please contact us at milantamang@gmail.com.
                </p>
                <h2 className="text-2xl font-display font-semibold mt-6 mb-3">6. Changes to this Policy</h2>
                <p>
                  We may update this Privacy Policy. Changes will be posted on this page with an updated effective date. You are advised to review this Privacy Policy periodically for any changes.
                </p>
                <h2 className="text-2xl font-display font-semibold mt-6 mb-3">7. Contact</h2>
                <p>
                  For questions about this Privacy Policy, contact us at milantamang@gmail.com.
                </p>
              </div>
            </GlassmorphicCard>
          </div>
        </section>
      </main>
    </div>
  );
}
