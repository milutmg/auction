import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Package, Clock, User, MapPin } from 'lucide-react';
import PaymentGateway from '@/components/payment/PaymentGateway';
import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/services/api';

interface Order {
  id: string;
  auction_id: string;
  auction_title: string;
  auction_description: string;
  auction_image_url: string;
  winning_bid_amount: number;
  payment_status: string;
  order_status: string;
  seller_name: string;
  created_at: string;
  estimated_delivery: string;
}

const PaymentCheckout: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentCompleted, setPaymentCompleted] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (orderId) {
      loadOrder();
    }
  }, [orderId, user, navigate]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const response = await apiService.get(`/users/orders?type=purchases`);
      const foundOrder = response.orders.find((o: Order) => o.id === orderId);
      
      if (!foundOrder) {
        toast({
          title: "Order Not Found",
          description: "The requested order could not be found.",
          variant: "destructive",
        });
        navigate('/dashboard');
        return;
      }

      if (foundOrder.payment_status === 'paid') {
        setPaymentCompleted(true);
      }

      setOrder(foundOrder);
    } catch (error) {
      console.error('Failed to load order:', error);
      toast({
        title: "Error",
        description: "Failed to load order details. Please try again.",
        variant: "destructive",
      });
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (transactionId: string) => {
    setPaymentCompleted(true);
    toast({
      title: "Payment Successful!",
      description: "Your payment has been processed successfully.",
    });

    // Redirect to success page after a short delay
    setTimeout(() => {
      navigate(`/payment/success?transaction=${transactionId}&order=${orderId}`);
    }, 2000);
  };

  const handlePaymentError = (error: string) => {
    toast({
      title: "Payment Failed",
      description: error,
      variant: "destructive",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'secondary' as const, label: 'Pending Payment' },
      paid: { variant: 'default' as const, label: 'Paid' },
      shipped: { variant: 'default' as const, label: 'Shipped' },
      delivered: { variant: 'default' as const, label: 'Delivered' },
      completed: { variant: 'default' as const, label: 'Completed' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading order details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Order Not Found</h1>
          <p className="text-muted-foreground">The requested order could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center text-muted-foreground hover:text-foreground mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </button>
            <h1 className="text-3xl font-bold">
              {paymentCompleted ? 'Payment Successful' : 'Complete Your Payment'}
            </h1>
            <p className="text-muted-foreground mt-2">
              {paymentCompleted 
                ? 'Your payment has been processed successfully.'
                : 'Review your order details and complete the payment to secure your auction win.'
              }
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Item Image */}
                  <div className="aspect-square rounded-lg overflow-hidden">
                    <img
                      src={order.auction_image_url || '/placeholder.svg'}
                      alt={order.auction_title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Item Details */}
                  <div>
                    <h3 className="font-semibold text-lg line-clamp-2">
                      {order.auction_title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
                      {order.auction_description}
                    </p>
                  </div>

                  <Separator />

                  {/* Order Info */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Order ID:</span>
                      <span className="text-sm font-mono">{order.id.slice(0, 8)}...</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Winning Bid:</span>
                      <span className="font-semibold text-lg text-gold">
                        ${order.winning_bid_amount.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Status:</span>
                      {getStatusBadge(order.payment_status)}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>Seller: {order.seller_name}</span>
                    </div>

                    {order.estimated_delivery && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Est. Delivery: {new Date(order.estimated_delivery).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Order Timeline */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Order Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      <div>
                        <div className="text-sm font-medium">Auction Won</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className={`flex items-center gap-3 ${
                      paymentCompleted ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${
                        paymentCompleted ? 'bg-green-600' : 'bg-gray-300'
                      }`}></div>
                      <div>
                        <div className="text-sm font-medium">Payment Completed</div>
                        <div className="text-xs text-muted-foreground">
                          {paymentCompleted ? 'Just now' : 'Pending...'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-muted-foreground">
                      <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                      <div>
                        <div className="text-sm font-medium">Order Processing</div>
                        <div className="text-xs text-muted-foreground">Pending</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-muted-foreground">
                      <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                      <div>
                        <div className="text-sm font-medium">Shipped</div>
                        <div className="text-xs text-muted-foreground">Pending</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-muted-foreground">
                      <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                      <div>
                        <div className="text-sm font-medium">Delivered</div>
                        <div className="text-xs text-muted-foreground">Pending</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payment Section */}
            <div className="lg:col-span-2">
              {paymentCompleted ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                    <h2 className="text-2xl font-bold text-green-600 mb-2">Payment Successful!</h2>
                    <p className="text-muted-foreground mb-6">
                      Your payment has been processed successfully. The seller will be notified and your order will be processed soon.
                    </p>
                    <div className="flex gap-4 justify-center">
                      <button
                        onClick={() => navigate('/dashboard')}
                        className="px-6 py-2 bg-gold text-white rounded-md hover:bg-gold-dark transition-colors"
                      >
                        Go to Dashboard
                      </button>
                      <button
                        onClick={() => navigate(`/orders/${order.id}`)}
                        className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        View Order Details
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <PaymentGateway
                  orderId={order.id}
                  amount={order.winning_bid_amount}
                  currency="USD"
                  onPaymentSuccess={handlePaymentSuccess}
                  onPaymentError={handlePaymentError}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentCheckout;
