import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { GlassmorphicCard } from '@/components/ui/GlassmorphicCard';
import { Button } from '@/components/ui/button';
import { CreditCard, Clock, CheckCircle, XCircle, Package } from 'lucide-react';

interface PaymentRecord {
  id: string;
  transaction_id: string;
  amount: number;
  status: string;
  created_at: string;
  auction_id: string;
  auction_title: string;
  image_url: string;
  order_status: string;
  payment_status: string;
}

const PaymentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchPayments();
    }
  }, [user]);

  const fetchPayments = async () => {
    try {
      // Fetch both completed payments and pending payments
      const [paymentsRes, pendingRes] = await Promise.all([
        fetch(`/api/payments/dashboard/${user?.id}`),
        fetch(`/api/payments/pending/${user?.id}`)
      ]);
      
      const paymentsData = paymentsRes.ok ? await paymentsRes.json() : [];
      const pendingData = pendingRes.ok ? await pendingRes.json() : [];
      
      // Combine and format data
      const allPayments = [
        ...paymentsData,
        ...pendingData.map(p => ({
          id: `pending-${p.auction_id}`,
          transaction_id: 'N/A',
          amount: p.current_bid,
          status: 'pending',
          created_at: p.created_at,
          auction_id: p.auction_id,
          auction_title: p.title,
          image_url: p.image_url,
          order_status: 'pending',
          payment_status: 'pending'
        }))
      ];
      
      setPayments(allPayments);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'pending': return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'failed': return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'text-green-600 bg-green-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'failed': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Dashboard</h1>
        <p className="text-gray-600">Manage your auction payments and orders</p>
      </div>

      {payments.length === 0 ? (
        <GlassmorphicCard className="p-8 text-center">
          <CreditCard className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Payments Yet</h3>
          <p className="text-gray-500">You haven't won any auctions that require payment.</p>
        </GlassmorphicCard>
      ) : (
        <div className="space-y-6">
          {payments.map((payment) => (
            <GlassmorphicCard key={payment.id} className="p-6">
              <div className="flex items-start space-x-4">
                <img
                  src={payment.image_url || '/placeholder.svg'}
                  alt={payment.auction_title}
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {payment.auction_title}
                    </h3>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(payment.status)}
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(payment.status)}`}>
                        {payment.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Amount</p>
                      <p className="font-semibold text-lg">${payment.amount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Transaction ID</p>
                      <p className="font-mono text-sm">{payment.transaction_id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Date</p>
                      <p className="text-sm">{new Date(payment.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Package className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          Order: {payment.order_status || 'pending'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      {payment.status === 'pending' && (
                        <Button
                          onClick={() => window.location.href = `/api/payments/pay?auction_id=${payment.auction_id}`}
                          size="sm"
                          className="bg-amber-600 hover:bg-amber-700"
                        >
                          Complete Payment
                        </Button>
                      )}
                      {payment.status === 'failed' && (
                        <Button
                          onClick={() => window.location.href = `/api/payments/pay?auction_id=${payment.auction_id}`}
                          size="sm"
                          variant="outline"
                        >
                          Retry Payment
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </GlassmorphicCard>
          ))}
        </div>
      )}
    </div>
  );
};

export default PaymentDashboard;