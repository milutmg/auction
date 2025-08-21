
import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

export default function Footer() {
  const { toast } = useToast();

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Thank you for subscribing!",
      description: "You'll receive updates on new auctions and features.",
      duration: 3000,
    });
    // Clear the input field
    const form = e.target as HTMLFormElement;
    form.reset();
  };

  return (
    <footer className="bg-ivory dark:bg-charcoal border-t border-border">
      <div className="container mx-auto py-16 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Company Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-display font-semibold text-charcoal dark:text-ivory">
              Antiqua<span className="text-gold">Bid</span>
            </h2>
            <p className="text-muted-foreground max-w-xs">
              A premiere auction platform for authenticated antiques, bringing collectors and sellers together in a transparent marketplace.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-muted-foreground hover:text-gold transition-colors duration-200">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-muted-foreground hover:text-gold transition-colors duration-200">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-muted-foreground hover:text-gold transition-colors duration-200">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-muted-foreground hover:text-gold transition-colors duration-200">
                <Linkedin size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-display font-medium text-charcoal dark:text-ivory">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-muted-foreground hover:text-gold transition-colors duration-200">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/auctions" className="text-muted-foreground hover:text-gold transition-colors duration-200">
                  Auctions
                </Link>
              </li>
              <li>
                <Link to="/categories" className="text-muted-foreground hover:text-gold transition-colors duration-200">
                  Categories
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-gold transition-colors duration-200">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-muted-foreground hover:text-gold transition-colors duration-200">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-display font-medium text-charcoal dark:text-ivory">Contact Us</h3>
            <div className="space-y-2">
              <p className="flex items-center text-muted-foreground">
                <Mail size={18} className="mr-2" />
                milantamang@gmail.com
              </p>
              <p className="flex items-center text-muted-foreground">
                <Phone size={18} className="mr-2" />
                9749566845
              </p>
              <p className="text-muted-foreground">
                Basundhara, Kathmandu
              </p>
            </div>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h3 className="text-lg font-display font-medium text-charcoal dark:text-ivory">Newsletter</h3>
            <p className="text-muted-foreground">
              Subscribe to our newsletter for updates on new auctions and features.
            </p>
            <form onSubmit={handleSubscribe} className="space-y-2">
              <Input
                type="email"
                placeholder="Your email address"
                required
                className="bg-white dark:bg-charcoal-light border-border"
              />
              <Button 
                type="submit" 
                className="w-full bg-gold hover:bg-gold-dark text-white"
              >
                Subscribe
              </Button>
            </form>
          </div>
        </div>

        <div className="border-t border-border mt-10 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground text-center md:text-left">
            &copy; {new Date().getFullYear()} AntiquaBid. All rights reserved.
          </p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <Link to="/privacy" className="text-sm text-muted-foreground hover:text-gold transition-colors duration-200">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-sm text-muted-foreground hover:text-gold transition-colors duration-200">
              Terms of Service
            </Link>
            <Link to="/cookies" className="text-sm text-muted-foreground hover:text-gold transition-colors duration-200">
              Cookies Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
