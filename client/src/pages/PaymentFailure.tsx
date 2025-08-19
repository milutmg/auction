import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, ArrowLeft, RefreshCw, HelpCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const PaymentFailurePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const orderId = searchParams.get('orderId');
  const error = searchParams.get('error');
  const reason = searchParams.get('reason');

  const handleRetryPayment = () => {
    if (orderId) {
      // Navigate back to order page to retry payment
      navigate(`/order/${orderId}`);
    } else {
      navigate('/auctions');
    }
  };

  const commonFailureReasons = [
    {
      title: "Insufficient Balance",
      description: "Your eSewa wallet doesn't have enough balance to complete this transaction.",
      solution: "Please top up your eSewa wallet and try again."
    },
    {
      title: "Transaction Timeout",
      description: "The payment session expired due to inactivity.",
      solution: "Return to the auction and initiate payment again."
    },
    {
      title: "User Cancellation",
      description: "You cancelled the payment process.",
      solution: "You can try again anytime before the payment deadline."
    },
    {
      title: "Technical Error",
      description: "There was a technical issue with the payment gateway.",
      solution: "Please try again in a few minutes or contact support."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          
          <Card className="border-red-200 bg-red-50">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-red-800">Payment Failed</CardTitle>
              <CardDescription className="text-red-700">
                Your payment could not be processed at this time.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              
              {/* Error Details */}
              {(orderId || error || reason) && (
                <div className="bg-white rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold mb-3">Error Details</h4>
                  
                  {orderId && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Order ID:</span>
                      <Badge variant="outline">
                        {orderId.slice(0, 8)}...
                      </Badge>
                    </div>
                  )}
                  
                  {error && (
                    <div>
                      <span className="text-sm text-muted-foreground">Error Code:</span>
                      <div className="text-sm font-mono bg-gray-100 p-2 rounded mt-1">
                        {error}
                      </div>
                    </div>
                  )}
                  
                  {reason && (
                    <div>
                      <span className="text-sm text-muted-foreground">Reason:</span>
                      <div className="text-sm mt-1">
                        {reason}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* What Went Wrong */}
              <div className="bg-white rounded-lg p-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" />
                  What might have gone wrong?
                </h4>
                
                <div className="space-y-4">
                  {commonFailureReasons.map((item, index) => (
                    <div key={index} className="border-l-2 border-gray-200 pl-4">
                      <h5 className="font-medium text-sm">{item.title}</h5>
                      <p className="text-xs text-muted-foreground mb-1">
                        {item.description}
                      </p>
                      <p className="text-xs text-blue-600">
                        {item.solution}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* eSewa Help */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2">eSewa Support</h4>
                <div className="text-sm text-green-700 space-y-1">
                  <p>• Check your eSewa wallet balance</p>
                  <p>• Ensure your eSewa account is active</p>
                  <p>• Contact eSewa support: 9801-977977</p>
                  <p>• Visit: <a href="https://esewa.com.np" target="_blank" rel="noopener noreferrer" className="underline">esewa.com.np</a></p>
                </div>
              </div>

              {/* Important Notes */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h4 className="font-semibold text-amber-800 mb-2">Important Notes</h4>
                <div className="text-sm text-amber-700 space-y-1">
                  <p>• Your auction win is still valid</p>
                  <p>• You have time to complete payment before the deadline</p>
                  <p>• No amount has been deducted from your account</p>
                  <p>• You can try the payment again</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={handleRetryPayment} 
                  className="flex-1"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Payment Again
                </Button>
                <Button 
                  onClick={() => navigate('/auctions')} 
                  variant="outline" 
                  className="flex-1"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Auctions
                </Button>
              </div>

              {/* Support Contact */}
              <div className="text-center pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">
                  Still having trouble?
                </p>
                <Button 
                  onClick={() => navigate('/contact')} 
                  variant="link" 
                  size="sm"
                >
                  Contact Customer Support
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailurePage;
