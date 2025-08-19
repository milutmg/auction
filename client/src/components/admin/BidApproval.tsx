import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Clock, DollarSign } from 'lucide-react';

interface PendingBid {
  id: string;
  amount: string;
  created_at: string;
  auction_id: string;
  auction_title: string;
  current_bid: string | null;
  starting_bid: string;
  bidder_name: string;
  bidder_email: string;
}

const BidApproval = () => {
  const [pendingBids, setPendingBids] = useState<PendingBid[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchPendingBids = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auctions/admin/bids/pending`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPendingBids(data);
      } else {
        throw new Error('Failed to fetch pending bids');
      }
    } catch (error) {
      console.error('Error fetching pending bids:', error);
      toast({
        title: "Error",
        description: "Failed to load pending bids",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingBids();
  }, []);

  const handleApprove = async (bidId: string) => {
    setProcessing(bidId);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auctions/admin/bids/${bidId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Bid approved successfully"
        });
        setPendingBids(prev => prev.filter(bid => bid.id !== bidId));
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to approve bid');
      }
    } catch (error) {
      console.error('Error approving bid:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to approve bid",
        variant: "destructive"
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (bidId: string) => {
    setProcessing(bidId);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auctions/admin/bids/${bidId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Bid rejected successfully"
        });
        setPendingBids(prev => prev.filter(bid => bid.id !== bidId));
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reject bid');
      }
    } catch (error) {
      console.error('Error rejecting bid:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to reject bid",
        variant: "destructive"
      });
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold mb-4">Pending Bid Approvals</h2>
        <div className="text-center py-8">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Pending Bid Approvals</h2>
        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
          {pendingBids.length} pending
        </Badge>
      </div>

      {pendingBids.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No pending bids to review</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingBids.map((bid) => (
            <div key={bid.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-medium text-gray-900">{bid.auction_title}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {new Date(bid.created_at).toLocaleDateString()}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                    <div>
                      <span className="font-medium">Bidder:</span>
                      <p>{bid.bidder_name}</p>
                      <p className="text-xs">{bid.bidder_email}</p>
                    </div>
                    <div>
                      <span className="font-medium">Bid Amount:</span>
                      <p className="text-lg font-bold text-green-600">
                        ${parseFloat(bid.amount).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Current Bid:</span>
                      <p>${parseFloat(bid.current_bid || bid.starting_bid).toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="font-medium">Starting Bid:</span>
                      <p>${parseFloat(bid.starting_bid).toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    <span className="text-green-600 font-medium">
                      Increase: +${(parseFloat(bid.amount) - parseFloat(bid.current_bid || bid.starting_bid)).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <Button
                    size="sm"
                    onClick={() => handleApprove(bid.id)}
                    disabled={processing === bid.id}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReject(bid.id)}
                    disabled={processing === bid.id}
                    className="border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BidApproval;