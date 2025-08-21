import { GlassmorphicCard } from '@/components/ui/GlassmorphicCard';

export const route = '/cookies';

export default function CookiesPolicy() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow pt-24 pb-20">
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            <GlassmorphicCard variant="default" shadow="sm" className="p-6">
              <h1 className="text-3xl font-display font-bold mb-6">Cookies Policy</h1>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  AntiquaBid uses cookies and similar tracking technologies to enhance your experience, analyze site usage, and deliver personalized content.
                </p>
                <h2 className="text-2xl font-display font-semibold mt-6 mb-3">1. What are cookies?</h2>
                <p>
                  Cookies are small text files stored on your device that help websites remember information about your visit.
                </p>
                <h2 className="text-2xl font-display font-semibold mt-6 mb-3">2. Types of cookies we use</h2>
                <p>
                  We use essential cookies (required for site operation), performance cookies (analytics), and functional cookies (preferences).
                </p>
                <h2 className="text-2xl font-display font-semibold mt-6 mb-3">3. Managing cookies</h2>
                <p>
                  You can manage or delete cookies via your browser settings. Disabling certain cookies may affect site functionality.
                </p>
                <h2 className="text-2xl font-display font-semibold mt-6 mb-3">What are your choices regarding cookies?</h2>
                <p>
                  If you'd like to delete cookies or instruct your web browser to delete or refuse cookies, please visit the help pages of your web browser.
                </p>
                <p>
                  Please note, however, that if you delete cookies or refuse to accept them, you might not be able to use all of the features we offer, you may not be able to store your preferences, and some of our pages might not display properly.
                </p>
                <h2 className="text-2xl font-display font-semibold mt-6 mb-3">Where can you find more information about cookies?</h2>
                <p>
                  You can learn more about cookies and the following third-party websites:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-2">
                  <li>
                    AllAboutCookies:&nbsp;
                    <a href="http://www.allaboutcookies.org/" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">
                      http://www.allaboutcookies.org/
                    </a>
                  </li>
                  <li>
                    Network Advertising Initiative:&nbsp;
                    <a href="http://www.networkadvertising.org/" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">
                      http://www.networkadvertising.org/
                    </a>
                  </li>
                </ul>
                <h2 className="text-2xl font-display font-semibold mt-6 mb-3">4. Contact</h2>
                <p>
                  For questions about our Cookies Policy, contact milantamang@gmail.com.
                </p>
              </div>
            </GlassmorphicCard>
          </div>
        </section>
      </main>
    </div>
  );
}
