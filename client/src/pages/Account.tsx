
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { GlassmorphicCard } from '@/components/ui/GlassmorphicCard';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { LogOut, User, Mail, Calendar } from 'lucide-react';

const Account = () => {
  const { user, signOut, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
      navigate('/');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow pt-24 pb-20">
        <section className="py-12 md:py-16 relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-muted/30 to-background" />
          <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-gold/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-gold/10 rounded-full blur-3xl" />
          
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <GlassmorphicCard variant="default" shadow="md" className="p-8">
                <div className="mb-6">
                  <h1 className="text-3xl font-display font-bold mb-2">
                    Account Details
                  </h1>
                  <p className="text-muted-foreground">
                    Manage your account information and preferences
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center space-x-4 p-4 bg-muted/20 rounded-lg">
                    <User className="h-6 w-6 text-gold" />
                    <div>
                      <p className="font-medium">Full Name</p>
                      <p className="text-muted-foreground">
                        {user.user_metadata?.full_name || 'Not provided'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 p-4 bg-muted/20 rounded-lg">
                    <Mail className="h-6 w-6 text-gold" />
                    <div>
                      <p className="font-medium">Email Address</p>
                      <p className="text-muted-foreground">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 p-4 bg-muted/20 rounded-lg">
                    <Calendar className="h-6 w-6 text-gold" />
                    <div>
                      <p className="font-medium">Member Since</p>
                      <p className="text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-border">
                  <Button
                    onClick={handleSignOut}
                    variant="outline"
                    className="w-full"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              </GlassmorphicCard>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Account;
