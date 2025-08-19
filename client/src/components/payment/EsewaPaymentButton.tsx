import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, CreditCard, Shield, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/services/api';

interface EsewaPaymentProps {
  orderId: string;
  amount: number;
  auctionTitle: string;
  onPaymentSuccess?: (result: any) => void;
  onPaymentFailure?: (error: any) => void;
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
    logo: string;
  };
}

const EsewaPaymentButton: React.FC<EsewaPaymentProps> = ({
  orderId,
  amount,
  auctionTitle,
  onPaymentSuccess,
  onPaymentFailure
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null);
  const { toast } = useToast();

  const initiateEsewaPayment = async () => {
    setIsLoading(true);
    
    try {
      // Call backend to initiate eSewa payment
      const response = await api.initiateEsewaPayment(orderId);
      
      if (response.success) {
        const { paymentUrl, formData, summary } = response.payment;
        setPaymentSummary(summary);
        
        // Create and submit form to eSewa
        submitPaymentForm(paymentUrl, formData);
        
        toast({
          title: "Redirecting to eSewa",
          description: "You will be redirected to eSewa for payment...",
        });
      } else {
        throw new Error(response.message || 'Failed to initiate payment');
      }
    } catch (error) {
      console.error('eSewa payment initiation error:', error);
      toast({
        title: "Payment Error",
        description: error.message || "Failed to initiate eSewa payment",
        variant: "destructive",
      });
      
      if (onPaymentFailure) {
        onPaymentFailure(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const submitPaymentForm = (paymentUrl: string, formData: any) => {
    // Create a form and submit it to eSewa
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = paymentUrl;
    form.target = '_self';

    // Add form fields
    Object.keys(formData).forEach(key => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = formData[key];
      form.appendChild(input);
    });

    // Add form to body and submit
    document.body.appendChild(form);
    form.submit();
    
    // Clean up
    document.body.removeChild(form);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: 'NPR'
    }).format(amount);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <CreditCard className="h-5 w-5" />
          eSewa Payment
        </CardTitle>
        <CardDescription>
          Complete your auction payment securely with eSewa
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Payment Summary */}
        <div className="space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-sm text-muted-foreground">Auction Item:</span>
            <span className="text-sm font-medium text-right max-w-[200px]">
              {auctionTitle}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Order ID:</span>
            <Badge variant="outline" className="text-xs">
              {orderId.slice(0, 8)}...
            </Badge>
          </div>
          
          <Separator />
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Winning Bid:</span>
            <span className="text-sm">{formatCurrency(amount)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Service Fee:</span>
            <span className="text-sm">NPR 0.00</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Tax:</span>
            <span className="text-sm">NPR 0.00</span>
          </div>
          
          <Separator />
          
          <div className="flex justify-between items-center font-semibold">
            <span>Total Amount:</span>
            <span className="text-lg">{formatCurrency(amount)}</span>
          </div>
        </div>

        {/* eSewa Info */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <img 
              src="https://esewa.com.np/common/images/esewa-icon.png" 
              alt="eSewa" 
              className="h-6 w-6"
              onError={(e) => {
                // Fallback if image fails to load
                e.currentTarget.style.display = 'none';
              }}
            />
            <span className="font-medium text-green-800">eSewa Digital Wallet</span>
          </div>
          <p className="text-xs text-green-700">
            You will be redirected to eSewa for secure payment processing
          </p>
        </div>

        {/* Security Info */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Shield className="h-4 w-4" />
          <span>Your payment is secured with eSewa's encryption</span>
        </div>

        {/* Payment Button */}
        <Button 
          onClick={initiateEsewaPayment}
          disabled={isLoading}
          className="w-full bg-green-600 hover:bg-green-700"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Initiating Payment...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Pay with eSewa
            </>
          )}
        </Button>

        {/* Test Environment Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-xs text-amber-800">
            <strong>Test Environment:</strong> This is using eSewa's test environment. 
            Use test credentials for payment.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default EsewaPaymentButton;
