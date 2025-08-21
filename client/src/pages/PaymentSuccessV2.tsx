import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { 
  CheckCircle, 
  Download, 
  Receipt, 
  Package, 
  ArrowRight,
  Clock,
  CreditCard,
  User,
  MapPin
} from 'lucide-react';
import apiService from '@/services/api';

interface PaymentTransaction {
  transaction_id: string;
  gross_amount: number;
  net_amount: number;
  payment_gateway_fee: number;
  platform_fee: number;
  currency: string;
  status: string;
  payment_method: string;
  provider_name: string;
  completed_at: string;
  auction_title: string;
  order_id: string;
}

const PaymentSuccessV2: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [transaction, setTransaction] = useState<PaymentTransaction | null>(null);
  const [loading, setLoading] = useState(true);

  const transactionId = searchParams.get('transaction');
  const orderId = searchParams.get('order');

  useEffect(() => {
    if (transactionId) {
      loadTransactionDetails();
    } else {
      setLoading(false);
    }
  }, [transactionId]);

  const loadTransactionDetails = async () => {
    try {
      const response = await apiService.get(`/payments-v2/transactions/${transactionId}/status`);
      setTransaction(response.transaction);
    } catch (error) {
      console.error('Failed to load transaction details:', error);
      toast({
        title: "Error",
        description: "Failed to load payment details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadReceipt = async () => {
    try {
      // This would generate and download a PDF receipt
      toast({
        title: "Receipt Download",
        description: "Receipt download feature would be implemented here.",
      });
    } catch (error) {
      console.error('Failed to download receipt:', error);
      toast({
        title: "Error",
        description: "Failed to download receipt.",
        variant: "destructive",
      });
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'esewa':
        return <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-bold">eS</div>;
      case 'khalti':
        return <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">K</div>;
      case 'stripe':
        return <CreditCard className="w-8 h-8 text-blue-600" />;
      case 'paypal':
        return <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center text-white text-sm font-bold">PP</div>;
      default:
        return <CreditCard className="w-8 h-8 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (!transaction && transactionId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-bold text-red-600 mb-2">Payment Not Found</h2>
            <p className="text-muted-foreground mb-6">
              We couldn't find the payment details for this transaction.
            </p>
            <Button onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Success Header */}
          <Card className="mb-8">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-green-600 mb-2">
                Payment Successful!
              </h1>
              <p className="text-lg text-muted-foreground mb-6">
                Your payment has been processed successfully. Thank you for your purchase!
              </p>
              {transaction && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Receipt className="w-4 h-4" />
                  <span>Transaction ID: {transaction.transaction_id}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {transaction && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Payment Details */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Payment Details
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Amount Paid:</span>
                      <span className="font-bold text-lg text-green-600">
                        ${transaction.gross_amount.toFixed(2)} {transaction.currency}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Payment Method:</span>
                      <div className="flex items-center gap-2">
                        {getPaymentMethodIcon(transaction.payment_method)}
                        <span className="capitalize">{transaction.provider_name}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant="default" className="bg-green-600">
                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Processed At:</span>
                      <span>{new Date(transaction.completed_at).toLocaleString()}</span>
                    </div>

                    <div className="pt-4 border-t">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Item Amount:</span>
                          <span>${transaction.net_amount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Payment Fee:</span>
                          <span>${transaction.payment_gateway_fee.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Platform Fee:</span>
                          <span>${transaction.platform_fee.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-semibold pt-2 border-t">
                          <span>Total:</span>
                          <span>${transaction.gross_amount.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Order Details */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Order Information
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <span className="text-muted-foreground">Item:</span>
                      <p className="font-medium mt-1">{transaction.auction_title}</p>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Order ID:</span>
                      <span className="font-mono">{transaction.order_id?.slice(0, 8)}...</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>Order processing will begin shortly</span>
                    </div>

                    <div className="pt-4 border-t">
                      <h4 className="font-medium mb-2">What's Next?</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• You will receive an email confirmation</li>
                        <li>• The seller will be notified of your payment</li>
                        <li>• Your order will be processed and shipped</li>
                        <li>• You'll receive tracking information once shipped</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={downloadReceipt}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download Receipt
            </Button>

            {orderId && (
              <Button
                onClick={() => navigate(`/orders/${orderId}`)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Package className="w-4 h-4" />
                View Order Details
              </Button>
            )}

            <Button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Support Information */}
          <Card className="mt-8">
            <CardContent className="p-6 text-center">
              <h3 className="font-semibold mb-2">Need Help?</h3>
              <p className="text-muted-foreground text-sm mb-4">
                If you have any questions about your payment or order, our support team is here to help.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="outline" size="sm">
                  Contact Support
                </Button>
                <Button variant="outline" size="sm">
                  View FAQ
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessV2;
