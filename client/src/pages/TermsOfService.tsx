import { GlassmorphicCard } from '@/components/ui/GlassmorphicCard';

export const route = '/terms';

export default function TermsOfService() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow pt-24 pb-20">
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            <GlassmorphicCard variant="default" shadow="sm" className="p-6">
              <h1 className="text-3xl font-display font-bold mb-6">Terms of Service</h1>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Welcome to AntiquaBid! These Terms of Service ("Terms") govern your access to and use of the AntiquaBid website, mobile applications, and services (collectively, the "Service"). By accessing or using the Service, you agree to be bound by these Terms.
                </p>
                <h2 className="text-2xl font-display font-semibold mt-6 mb-3">1. Acceptance of Terms</h2>
                <p>
                  By creating an account, bidding on an auction, or otherwise using the Service, you acknowledge that you have read, understood, and agree to be bound by these Terms, as well as our Privacy Policy and Cookies Policy. If you do not agree with any part of these Terms, you may not use the Service.
                </p>
                <h2 className="text-2xl font-display font-semibold mt-6 mb-3">2. Changes to Terms</h2>
                <p>
                  We reserve the right to modify or update these Terms at any time. We will notify you of any changes by posting the new Terms on this page. Your continued use of the Service after any such changes constitutes your acceptance of the new Terms.
                </p>
                <h2 className="text-2xl font-display font-semibold mt-6 mb-3">3. User Accounts</h2>
                <p>
                  To access certain features of the Service, you may be required to create an account. You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
                </p>
                <h2 className="text-2xl font-display font-semibold mt-6 mb-3">4. Auction Rules</h2>
                <p>
                  All auctions on AntiquaBid are subject to specific rules, including bidding increments, reserve prices, and auction end times. By placing a bid, you agree to be bound by these rules. All bids are considered binding offers.
                </p>
                <h2 className="text-2xl font-display font-semibold mt-6 mb-3">5. Payments</h2>
                <p>
                  If you are a winning bidder, you agree to pay the full bid amount plus any applicable taxes and shipping fees. Payments are processed through secure third-party payment gateways.
                </p>
                <h2 className="text-2xl font-display font-semibold mt-6 mb-3">6. Content and Conduct</h2>
                <p>
                  You are solely responsible for any content you submit or post on the Service. You agree not to post any content that is illegal, offensive, or infringes on the rights of others. We reserve the right to remove any content that violates these Terms.
                </p>
                <h2 className="text-2xl font-display font-semibold mt-6 mb-3">7. Disclaimers and Limitation of Liability</h2>
                <p>
                  The Service is provided "as is" without any warranties, express or implied. We do not guarantee the accuracy, completeness, or reliability of any content on the Service. In no event shall AntiquaBid be liable for any damages arising from your use of the Service.
                </p>
                <h2 className="text-2xl font-display font-semibold mt-6 mb-3">8. Governing Law</h2>
                <p>
                  These Terms shall be governed by and construed in accordance with the laws of [Your Jurisdiction], without regard to its conflict of law principles.
                </p>
                <h2 className="text-2xl font-display font-semibold mt-6 mb-3">9. Contact Us</h2>
                <p>
                  If you have any questions about these Terms, please contact us at milantamang@gmail.com.
                </p>
              </div>
            </GlassmorphicCard>
          </div>
        </section>
      </main>
    </div>
  );
}
