import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Clock, Package, CreditCard, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/services/api';
import EsewaPaymentButton from '@/components/payment/EsewaPaymentButton';

interface Order {
  id: string;
  auction_id: string;
  winner_id: string;
  final_amount: number;
  status: string;
  payment_deadline: string;
  payment_method: string | null;
  auction_title: string;
  auction_image: string | null;
  winner_name: string;
  created_at: string;
  updated_at: string;
}

interface PaymentSummary {
  orderId: string;
  auctionTitle: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  fees: {
    serviceFee: number;
    tax: number;
    total: number;
  };
  paymentGateway: {
    name: string;
    merchantCode: string;
  };
}

const OrderDetailsPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.getOrderDetails(orderId!);
      setOrder(response.order);
      setPaymentSummary(response.paymentSummary);
      
    } catch (error: any) {
      console.error('Failed to fetch order details:', error);
      setError(error.message || 'Failed to load order details');
      toast({
        title: "Error",
        description: "Failed to load order details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: 'NPR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-NP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-600';
      case 'shipped': return 'bg-blue-600';
      case 'delivered': return 'bg-purple-600';
      case 'cancelled': return 'bg-red-600';
      default: return 'bg-yellow-600';
    }
  };

  const getTimeRemaining = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diff = deadlineDate.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} day${days > 1 ? 's' : ''} ${hours % 24}h remaining`;
    }
    
    return `${hours}h ${minutes}m remaining`;
  };

  const handlePaymentSuccess = (result: any) => {
    toast({
      title: "Payment Initiated",
      description: "Redirecting to eSewa for payment processing...",
    });
  };

  const handlePaymentFailure = (error: any) => {
    toast({
      title: "Payment Failed",
      description: error.message || "Failed to initiate payment",
      variant: "destructive",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <main className="flex-grow pt-24 pb-20">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading order details...</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col">
        <main className="flex-grow pt-24 pb-20">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <Card className="border-red-200 bg-red-50">
                <CardContent className="flex flex-col items-center justify-center p-8">
                  <AlertTriangle className="h-8 w-8 text-red-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Order Not Found</h3>
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    {error || 'The order you are looking for could not be found.'}
                  </p>
                  <Button onClick={() => navigate('/dashboard')} variant="outline">
                    View My Orders
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const isPaymentPending = order.status === 'pending';
  const isPaymentDeadlineNear = order.payment_deadline && 
    new Date(order.payment_deadline).getTime() - Date.now() < 24 * 60 * 60 * 1000;

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow pt-24 pb-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Header Section */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Order Details</h1>
                <p className="text-muted-foreground">
                  Order #{order.id.slice(0, 8)}...
                </p>
              </div>
              <Badge variant="secondary" className={`text-white ${getStatusColor(order.status)}`}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </Badge>
            </div>

            {/* Payment Deadline Warning */}
            {isPaymentPending && isPaymentDeadlineNear && (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="flex items-center gap-3 p-4">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="font-medium text-yellow-800">Payment Deadline Approaching</p>
                    <p className="text-sm text-yellow-700">
                      Please complete payment by {formatDate(order.payment_deadline)} - {getTimeRemaining(order.payment_deadline)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  <img
                    src={order.auction_image || '/placeholder.svg'}
                    alt={order.auction_title}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{order.auction_title}</h3>
                    <p className="text-sm text-muted-foreground">Auction ID: {order.auction_id}</p>
                    <div className="mt-2">
                      <span className="text-2xl font-bold text-green-600">
                        {formatCurrency(order.final_amount)}
                      </span>
                      <span className="text-sm text-muted-foreground ml-2">Final bid amount</span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Order Date:</span>
                    <span className="ml-2 font-medium">{formatDate(order.created_at)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Winner:</span>
                    <span className="ml-2 font-medium">{order.winner_name}</span>
                  </div>
                  {order.payment_deadline && (
                    <div>
                      <span className="text-muted-foreground">Payment Deadline:</span>
                      <span className="ml-2 font-medium">{formatDate(order.payment_deadline)}</span>
                    </div>
                  )}
                  {order.payment_method && (
                    <div>
                      <span className="text-muted-foreground">Payment Method:</span>
                      <span className="ml-2 font-medium capitalize">{order.payment_method}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Payment Section */}
            {isPaymentPending && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Options
                  </CardTitle>
                  <CardDescription>
                    Complete your payment to finalize this order
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {paymentSummary && (
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <h4 className="font-medium">Payment Summary</h4>
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span>Item Amount:</span>
                          <span>{formatCurrency(paymentSummary.amount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Service Fee:</span>
                          <span>{formatCurrency(paymentSummary.fees.serviceFee)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tax:</span>
                          <span>{formatCurrency(paymentSummary.fees.tax)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-medium">
                          <span>Total Amount:</span>
                          <span>{formatCurrency(paymentSummary.fees.total)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    <h4 className="font-medium">Choose Payment Method:</h4>
                    
                    {/* eSewa Payment Button */}
                    <EsewaPaymentButton
                      orderId={order.id}
                      amount={order.final_amount}
                      auctionTitle={order.auction_title}
                      onPaymentSuccess={handlePaymentSuccess}
                      onPaymentFailure={handlePaymentFailure}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Order Status */}
            {order.status !== 'pending' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Order Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <div className="text-green-600 mb-4">
                      <CheckCircle className="h-12 w-12 mx-auto" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                      {order.status === 'paid' && 'Payment Completed Successfully!'}
                      {order.status === 'shipped' && 'Your Order Has Been Shipped!'}
                      {order.status === 'delivered' && 'Order Delivered Successfully!'}
                      {order.status === 'cancelled' && 'Order Cancelled'}
                    </h3>
                    <p className="text-muted-foreground">
                      {order.status === 'paid' && 'Thank you for your payment. Your order is being processed.'}
                      {order.status === 'shipped' && 'Your item is on the way. You will receive updates on delivery.'}
                      {order.status === 'delivered' && 'Your order has been delivered successfully. Enjoy your purchase!'}
                      {order.status === 'cancelled' && 'This order has been cancelled.'}
                    </p>
                    {order.payment_method && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Paid via {order.payment_method.charAt(0).toUpperCase() + order.payment_method.slice(1)} on {formatDate(order.updated_at)}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex justify-center gap-4">
              <Button onClick={() => navigate('/dashboard')} variant="outline">
                Back to Dashboard
              </Button>
              {order.status === 'delivered' && (
                <Button>
                  Leave Review
                </Button>
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default OrderDetailsPage;
