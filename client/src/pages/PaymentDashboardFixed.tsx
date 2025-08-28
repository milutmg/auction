import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { 
  CreditCard, 
  DollarSign, 
  Clock, 
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Eye,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface PaymentRecord {
  id: string;
  transaction_id: string;
  amount: number;
  status: string;
  created_at: string;
  auction_title: string;
  payment_method?: string;
}

const PaymentDashboardFixed: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_payments: 0,
    completed_payments: 0,
    pending_payments: 0,
    total_amount: 0
  });

  // New: API base for redirects to backend HTML form endpoints
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  useEffect(() => {
    if (user) {
      loadPaymentData();
    }
  }, [user]);

  const makeApiCall = async (endpoint: string, options = {}) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        ...options
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  };

  const loadPaymentData = async () => {
    try {
      setLoading(true);
      
      // Try to get user orders which include payment information
      const ordersData = await makeApiCall('/users/orders?type=purchases');
      
      // Convert orders to payment records
      const paymentRecords: PaymentRecord[] = ordersData.orders?.map((order: any) => ({
        id: order.order_id || order.id,
        transaction_id: order.payment_transaction_id || 'N/A',
        amount: parseFloat(order.winning_bid_amount || 0),
        status: order.payment_status || 'pending',
        created_at: order.created_at,
        auction_title: order.title || 'Unknown Auction',
        payment_method: order.payment_method || 'unknown'
      })) || [];

      setPayments(paymentRecords);

      // Calculate stats
      const totalPayments = paymentRecords.length;
      const completedPayments = paymentRecords.filter(p => p.status === 'paid').length;
      const pendingPayments = paymentRecords.filter(p => p.status === 'pending').length;
      const totalAmount = paymentRecords.reduce((sum, p) => sum + p.amount, 0);

      setStats({
        total_payments: totalPayments,
        completed_payments: completedPayments,
        pending_payments: pendingPayments,
        total_amount: totalAmount
      });

    } catch (error) {
      console.error('Failed to load payment data:', error);
      
      // Show mock data for demonstration
      const mockPayments: PaymentRecord[] = [
        {
          id: '1',
          transaction_id: 'TXN_001',
          amount: 150.00,
          status: 'completed',
          created_at: new Date().toISOString(),
          auction_title: 'Vintage Antique Vase',
          payment_method: 'esewa'
        },
        {
          id: '2',
          transaction_id: 'TXN_002',
          amount: 75.50,
          status: 'pending',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          auction_title: 'Classic Painting',
          payment_method: 'stripe'
        }
      ];

      setPayments(mockPayments);
      setStats({
        total_payments: 2,
        completed_payments: 1,
        pending_payments: 1,
        total_amount: 225.50
      });

      toast({
        title: "Demo Mode",
        description: "Showing demo payment data. Payment system is ready for integration.",
      });
    } finally {
      setLoading(false);
    }
  };

  // New: Initiate eSewa redirect via backend
  const initiateEsewaRedirect = async () => {
    try {
      // Prefer using first pending order so backend can derive the correct amount
      const pending = payments.find(p => p.status === 'pending');

      let redirectUrl: string;
      if (pending && pending.id) {
        // Let backend compute amount from order
        redirectUrl = `${API_BASE_URL}/payments/custom-pay?order_id=${encodeURIComponent(pending.id)}`;
      } else {
        // Fallback: ask user for amount (demo/testing)
        const defaultAmount = 100;
        const input = window.prompt('Enter amount to pay with eSewa (NPR):', String(defaultAmount));
        if (!input) return;
        const amount = parseFloat(input);
        if (!Number.isFinite(amount) || amount <= 0) {
          toast({ title: 'Invalid amount', description: 'Please enter a valid amount', variant: 'destructive' });
          return;
        }
        redirectUrl = `${API_BASE_URL}/payments/custom-pay?amount=${encodeURIComponent(amount.toFixed(2))}`;
      }

      toast({ title: 'Redirecting', description: 'Opening eSewa gateway...' });
      window.location.href = redirectUrl;
    } catch (e: any) {
      toast({ title: 'Payment error', description: e.message || 'Failed to initiate eSewa payment', variant: 'destructive' });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'default',
      paid: 'default',
      pending: 'secondary',
      failed: 'destructive'
    } as const;

    const variant = (variants[status as keyof typeof variants] ?? 'secondary') as 'default' | 'destructive' | 'outline' | 'secondary';

    return (
      <Badge variant={variant}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'esewa':
        return <div className="w-6 h-6 bg-green-600 rounded text-white text-xs flex items-center justify-center font-bold">eS</div>;
      case 'khalti':
        return <div className="w-6 h-6 bg-purple-600 rounded text-white text-xs flex items-center justify-center font-bold">K</div>;
      case 'stripe':
        return <CreditCard className="w-6 h-6 text-blue-600" />;
      default:
        return <CreditCard className="w-6 h-6 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading payment data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Payment Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your payments and transaction history
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Payments</p>
                <p className="text-2xl font-bold">{stats.total_payments}</p>
              </div>
              <CreditCard className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed_payments}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending_payments}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold">${stats.total_amount.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-gold" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Payment History</CardTitle>
            <Button variant="outline" onClick={loadPaymentData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No payments found</h3>
              <p className="text-muted-foreground">
                Your payment history will appear here once you complete purchases.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {getPaymentMethodIcon(payment.payment_method || 'unknown')}
                      {getStatusIcon(payment.status)}
                    </div>
                    
                    <div>
                      <h4 className="font-medium">{payment.auction_title}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Transaction: {payment.transaction_id}</span>
                        <span>{new Date(payment.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-semibold">${payment.amount.toFixed(2)}</div>
                      {getStatusBadge(payment.status)}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {payment.status === 'completed' && (
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Available Payment Methods</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {/* eSewa tile clickable to initiate redirect */}
            <button
              type="button"
              onClick={initiateEsewaRedirect}
              className="flex items-center gap-3 p-3 border rounded-lg hover:border-green-600 hover:bg-green-50 transition-colors cursor-pointer"
              aria-label="Pay with eSewa"
            >
              <div className="w-8 h-8 bg-green-600 rounded text-white text-sm flex items-center justify-center font-bold">eS</div>
              <span className="text-sm font-medium">eSewa</span>
            </button>
            
            <div className="flex items-center gap-3 p-3 border rounded-lg opacity-60">
              <div className="w-8 h-8 bg-purple-600 rounded text-white text-sm flex items-center justify-center font-bold">K</div>
              <span className="text-sm font-medium">Khalti (coming soon)</span>
            </div>
            
            <div className="flex items-center gap-3 p-3 border rounded-lg opacity-60">
              <CreditCard className="w-8 h-8 text-blue-600" />
              <span className="text-sm font-medium">Stripe (coming soon)</span>
            </div>
            
            <div className="flex items-center gap-3 p-3 border rounded-lg opacity-60">
              <div className="w-8 h-8 bg-blue-400 rounded text-white text-sm flex items-center justify-center font-bold">PP</div>
              <span className="text-sm font-medium">PayPal (coming soon)</span>
            </div>
            
            <div className="flex items-center gap-3 p-3 border rounded-lg opacity-60">
              <div className="w-8 h-8 bg-gray-600 rounded text-white text-sm flex items-center justify-center font-bold">BT</div>
              <span className="text-sm font-medium">Bank Transfer</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentDashboardFixed;
