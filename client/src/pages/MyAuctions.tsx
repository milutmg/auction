import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { GlassmorphicCard } from '@/components/ui/GlassmorphicCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, Eye, Plus } from 'lucide-react';

interface Auction {
  id: string;
  title: string;
  description: string;
  starting_bid: string;
  current_bid: string | null;
  image_url: string;
  category_name: string;
  status: string;
  approval_status: string;
  end_time: string;
  created_at: string;
  bid_count: number;
}

const MyAuctions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMyAuctions = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/my-auctions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAuctions(data);
      }
    } catch (error) {
      console.error('Error fetching auctions:', error);
      toast({
        title: "Error",
        description: "Failed to load your auctions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteAuction = async (auctionId: string) => {
    if (!confirm('Are you sure you want to delete this auction?')) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auctions/${auctionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setAuctions(prev => prev.filter(auction => auction.id !== auctionId));
        toast({
          title: "Success",
          description: "Auction deleted successfully"
        });
      } else {
        throw new Error('Failed to delete auction');
      }
    } catch (error) {
      console.error('Error deleting auction:', error);
      toast({
        title: "Error",
        description: "Failed to delete auction",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (user) {
      fetchMyAuctions();
    }
  }, [user]);

  const getStatusBadge = (status: string, approvalStatus?: string) => {
    if (approvalStatus === 'pending') {
      return <Badge className="bg-yellow-100 text-yellow-800">PENDING APPROVAL</Badge>;
    }
    
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">ACTIVE</Badge>;
      case 'ended':
        return <Badge className="bg-gray-100 text-gray-800">ENDED</Badge>;
      default:
        return <Badge className="bg-blue-100 text-blue-800">{status.toUpperCase()}</Badge>;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
          <Link to="/auth">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading your auctions...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold font-display text-foreground mb-2">
              My Auctions
            </h1>
            <p className="text-muted-foreground">
              Manage your auction listings
            </p>
          </div>
          <Link to="/create-auction">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create New Auction
            </Button>
          </Link>
        </div>

        {auctions.length === 0 ? (
          <div className="text-center py-16">
            <h3 className="text-lg font-semibold mb-2">No auctions yet</h3>
            <p className="text-muted-foreground mb-6">
              You haven't created any auctions. Start by creating your first auction.
            </p>
            <Link to="/create-auction">
              <Button>Create Your First Auction</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {auctions.map((auction) => (
              <GlassmorphicCard key={auction.id} variant="default" shadow="sm" className="overflow-hidden">
                <div className="relative">
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={auction.image_url ? 
                        `${import.meta.env.VITE_BASE_URL}${auction.image_url}` : 
                        'https://images.unsplash.com/photo-1566312581307-d6bb3f6b2311?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
                      }
                      alt={auction.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1566312581307-d6bb3f6b2311?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
                      }}
                    />
                  </div>
                  <div className="absolute top-3 left-3">
                    {getStatusBadge(auction.status, auction.approval_status)}
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2">{auction.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{auction.description}</p>
                  
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span>Current Bid</span>
                      <span className="font-semibold text-amber-600">
                        ${(auction.current_bid ? parseFloat(auction.current_bid) : parseFloat(auction.starting_bid)).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Category</span>
                      <span>{auction.category_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bids</span>
                      <span>{auction.bid_count}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link to={`/auctions/${auction.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteAuction(auction.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </GlassmorphicCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyAuctions;