import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  XCircle, 
  RefreshCw, 
  ArrowLeft,
  AlertTriangle,
  CreditCard,
  HelpCircle
} from 'lucide-react';

const PaymentFailedV2: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const transactionId = searchParams.get('transaction');
  const orderId = searchParams.get('order');
  const error = searchParams.get('error');

  const getErrorMessage = (errorCode: string | null) => {
    switch (errorCode) {
      case 'verification_failed':
        return 'Payment verification failed. The payment was declined by your payment provider.';
      case 'insufficient_funds':
        return 'Insufficient funds in your account. Please check your balance and try again.';
      case 'expired_card':
        return 'Your payment method has expired. Please update your payment information.';
      case 'invalid_card':
        return 'Invalid payment information. Please check your card details and try again.';
      case 'network_error':
        return 'Network error occurred during payment processing. Please try again.';
      case 'timeout':
        return 'Payment request timed out. Please try again.';
      case 'cancelled':
        return 'Payment was cancelled by the user.';
      default:
        return 'An unexpected error occurred during payment processing. Please try again or contact support.';
    }
  };

  const getTroubleshootingTips = (errorCode: string | null) => {
    switch (errorCode) {
      case 'verification_failed':
      case 'invalid_card':
        return [
          'Verify your card number, expiry date, and CVV are correct',
          'Ensure your billing address matches your card information',
          'Try using a different payment method'
        ];
      case 'insufficient_funds':
        return [
          'Check your account balance',
          'Try using a different card or payment method',
          'Contact your bank if you believe this is an error'
        ];
      case 'expired_card':
        return [
          'Update your payment method with current card information',
          'Try using a different valid card',
          'Contact your bank for a replacement card'
        ];
      case 'network_error':
      case 'timeout':
        return [
          'Check your internet connection',
          'Try again in a few minutes',
          'Use a different browser or device'
        ];
      default:
        return [
          'Double-check your payment information',
          'Try using a different payment method',
          'Contact support if the problem persists'
        ];
    }
  };

  const retryPayment = () => {
    if (orderId) {
      navigate(`/payment/checkout/${orderId}`);
    } else {
      navigate('/dashboard');
    }
  };

  const contactSupport = () => {
    // This would open a support ticket or chat
    window.open('mailto:support@auctionplatform.com?subject=Payment Failed - Transaction ' + transactionId, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Failed Header */}
          <Card className="mb-8">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-12 h-12 text-red-600" />
              </div>
              <h1 className="text-3xl font-bold text-red-600 mb-2">
                Payment Failed
              </h1>
              <p className="text-lg text-muted-foreground mb-6">
                We were unable to process your payment. Please review the details below and try again.
              </p>
              {transactionId && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Transaction ID: {transactionId}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Error Details */}
          <Alert className="mb-8 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Error:</strong> {getErrorMessage(error)}
            </AlertDescription>
          </Alert>

          {/* Troubleshooting */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <HelpCircle className="w-5 h-5" />
                Troubleshooting Tips
              </h3>
              
              <ul className="space-y-2">
                {getTroubleshootingTips(error).map((tip, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-muted-foreground">{tip}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                What You Can Do
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Payment Options:</h4>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• Try a different credit/debit card</li>
                    <li>• Use a digital wallet (eSewa, Khalti)</li>
                    <li>• Consider bank transfer option</li>
                    <li>• Update your payment information</li>
                  </ul>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium">Need Help?</h4>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• Contact our support team</li>
                    <li>• Check our payment FAQ</li>
                    <li>• Verify with your bank</li>
                    <li>• Try again later</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={retryPayment}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Try Payment Again
            </Button>

            <Button
              onClick={contactSupport}
              variant="outline"
              className="flex items-center gap-2"
            >
              <HelpCircle className="w-4 h-4" />
              Contact Support
            </Button>

            <Button
              onClick={() => navigate('/dashboard')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </div>

          {/* Additional Information */}
          <Card className="mt-8">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-2">Important Information</h3>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>
                  • No charges have been made to your account for this failed transaction
                </p>
                <p>
                  • Your auction win is still reserved for a limited time
                </p>
                <p>
                  • You can retry payment or choose a different payment method
                </p>
                <p>
                  • If you continue to experience issues, please contact our support team
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Support Contact */}
          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>
              Need immediate assistance? Email us at{' '}
              <a href="mailto:support@auctionplatform.com" className="text-blue-600 hover:underline">
                support@auctionplatform.com
              </a>{' '}
              or call our support line at{' '}
              <a href="tel:+1-555-0123" className="text-blue-600 hover:underline">
                +1 (555) 012-3456
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailedV2;
