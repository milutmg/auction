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

interface PaymentDetail extends PaymentRecord { winner_name?: string; }

// NPR currency formatter
const formatNPR = (v: any) => {
  const n = parseFloat(v);
  if (isNaN(n)) return 'NPR 0.00';
  return 'NPR ' + n.toFixed(2);
};

const PaymentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [paymentEvents, setPaymentEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [recentSuccess, setRecentSuccess] = useState<{ transactionId: string; auctionId?: string } | null>(null);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const [initiating, setInitiating] = useState<string | null>(null);
  const [paymentDetail, setPaymentDetail] = useState<PaymentDetail | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchPayments();
      fetchPaymentEvents();
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

  const fetchPaymentEvents = async () => {
    try {
      const resp = await fetch(`/api/payments/events/pending/${user?.id}`);
      if (resp.ok) {
        const data = await resp.json();
        setPaymentEvents(data);
      }
    } catch(e) { console.error(e); }
  };

  useEffect(() => {
    // attach socket listeners
    const s = (window as any).socketService?.getSocket?.();
    if (!s || !user) return;
    const reqH = (d:any) => { if (d.userId === user.id) { setPaymentEvents(p => [{...d, auction_title:d.title}, ...p]); } };
    const compH = (d:any) => { if (d.userId === user.id) { setPaymentEvents(p => p.filter(ev => ev.auctionId !== d.auctionId)); } };
    s.on('payment-required', reqH);
    s.on('payment-completed', compH);
    return () => { s.off('payment-required', reqH); s.off('payment-completed', compH); };
  }, [user]);

  useEffect(() => {
    // Detect redirected success via localStorage or query params
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    const ref = params.get('ref');
    const auction_id = params.get('auction_id') || undefined;
    let stored: any = null;
    try { stored = JSON.parse(localStorage.getItem('paymentSuccessPending') || 'null'); } catch {}
    if (status === 'success' && ref) {
      setRecentSuccess({ transactionId: ref, auctionId: auction_id });
      setShowSuccessBanner(true);
    } else if (stored && Date.now() - stored.ts < 5 * 60 * 1000) {
      setRecentSuccess({ transactionId: stored.transactionId, auctionId: stored.auctionId });
      setShowSuccessBanner(true);
    }
    // cleanup stored flag
    if (stored) localStorage.removeItem('paymentSuccessPending');
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      fetch(`/api/payments/status/${ref}`)
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d && d.transaction_id) setPaymentDetail(d); })
        .catch(e => console.error('Fetch payment detail error', e));
    }
  }, []);

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

  const startPayment = async (auctionId: string | number) => {
    if (!auctionId) return;
    try {
      setInitiating(String(auctionId));
      const base = import.meta.env.VITE_API_URL || '/api';
      // Prefer order-based flow if your backend expects order_id; fallback to amount if not available
      const resp = await fetch(`${base}/payments/custom-pay?order_id=${auctionId}`);
      if (!resp.ok) throw new Error('Payment init failed');
      const html = await resp.text();
      const w = window.open('', '_blank');
      if (w) { w.document.write(html); w.document.close(); } else { document.open(); document.write(html); document.close(); }
    } catch (e) {
      alert('Could not start payment. Please retry.');
    } finally { setInitiating(null); }
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
      {showSuccessBanner && recentSuccess && (
        <div className="mb-6 p-4 rounded-md border border-green-300 bg-green-50 flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-green-700">Payment Successful</p>
              <p className="text-sm text-green-600 mt-1">Transaction {recentSuccess.transactionId} completed{recentSuccess.auctionId ? ` for auction ${recentSuccess.auctionId}`: ''}.</p>
            </div>
            <button onClick={() => { setShowSuccessBanner(false); }} className="text-green-700 text-sm hover:underline">Dismiss</button>
          </div>
          {paymentDetail && paymentDetail.transaction_id === recentSuccess.transactionId && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm bg-white rounded-md p-4 border border-green-200">
              <div>
                <p className="text-gray-500">Auction</p>
                <p className="font-medium">{paymentDetail.auction_title}</p>
              </div>
              <div>
                <p className="text-gray-500">Amount</p>
                <p className="font-semibold">{formatNPR(paymentDetail.amount)}</p>
              </div>
              <div>
                <p className="text-gray-500">Status</p>
                <p className="font-medium capitalize">{paymentDetail.status}</p>
              </div>
              <div>
                <p className="text-gray-500">Date</p>
                <p>{new Date(paymentDetail.created_at).toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>
      )}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Dashboard</h1>
        <p className="text-gray-600">Manage your auction payments and orders</p>
      </div>

      {payments.length === 0 && paymentEvents.length === 0 ? (
        <GlassmorphicCard className="p-8 text-center">
          <CreditCard className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Payments Yet</h3>
          <p className="text-gray-500">You haven't won any auctions that require payment.</p>
        </GlassmorphicCard>
      ) : (
        <div className="space-y-6">
          {paymentEvents.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Pending Payments</h2>
              <div className="space-y-4">
                {paymentEvents.map(ev => (
                  <GlassmorphicCard key={ev.id || ev.auctionId || ev.auction_id} className="p-6 border-amber-200 border">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{ev.auction_title || ev.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">Amount due: {formatNPR(ev.amount || ev.current_bid)}</p>
                        <p className="text-xs text-yellow-600 mt-2">Action required: complete payment</p>
                      </div>
                      <Button size="sm" disabled={initiating === String(ev.auctionId || ev.auction_id)} className="bg-amber-600 hover:bg-amber-700 disabled:opacity-60" onClick={() => startPayment(ev.auctionId || ev.auction_id)}>
                        {initiating === String(ev.auctionId || ev.auction_id) ? 'Starting...' : `Pay ${formatNPR(ev.amount || ev.current_bid)}`}
                      </Button>
                    </div>
                  </GlassmorphicCard>
                ))}
              </div>
            </div>
          )}
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
                      <p className="font-semibold text-lg">{formatNPR(payment.amount)}</p>
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
                          onClick={() => startPayment(payment.auction_id)}
                          size="sm"
                          className="bg-amber-600 hover:bg-amber-700"
                          disabled={initiating === String(payment.auction_id)}
                        >
                          {initiating === String(payment.auction_id) ? 'Starting...' : `Pay ${formatNPR(payment.amount)}`}
                        </Button>
                      )}
                      {payment.status === 'failed' && (
                        <Button
                          onClick={() => startPayment(payment.auction_id)}
                          size="sm"
                          variant="outline"
                          disabled={initiating === String(payment.auction_id)}
                        >
                          {initiating === String(payment.auction_id) ? 'Starting...' : `Retry ${formatNPR(payment.amount)}`}
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