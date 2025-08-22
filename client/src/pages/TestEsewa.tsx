import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, CreditCard, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const TestEsewa: React.FC = () => {
  const [amount, setAmount] = useState('100');
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const { toast } = useToast();

  const testEsewaPayment = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    try {
      // Test 1: Direct eSewa test payment
      setTestResults(prev => [...prev, {
        step: 1,
        title: 'Testing eSewa Test Payment',
        status: 'loading',
        message: 'Opening eSewa test payment page...'
      }]);

      // Open eSewa test payment in new window
      const testUrl = `http://localhost:3002/api/esewa/test-payment?amount=${amount}`;
      window.open(testUrl, '_blank');

      setTestResults(prev => prev.map(item => 
        item.step === 1 
          ? { ...item, status: 'success', message: 'Test payment page opened successfully' }
          : item
      ));

      // Test 2: Test API endpoint
      setTestResults(prev => [...prev, {
        step: 2,
        title: 'Testing eSewa API Endpoint',
        status: 'loading',
        message: 'Testing payment initiation...'
      }]);

      const response = await fetch(`http://localhost:3002/api/esewa/test-payment?amount=${amount}`);
      
      if (response.ok) {
        setTestResults(prev => prev.map(item => 
          item.step === 2 
            ? { ...item, status: 'success', message: 'API endpoint working correctly' }
            : item
        ));
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Test 3: Test callback URLs
      setTestResults(prev => [...prev, {
        step: 3,
        title: 'Testing Callback URLs',
        status: 'loading',
        message: 'Verifying callback endpoints...'
      }]);

      const successResponse = await fetch('http://localhost:3002/api/auctions/payment/esewa/success?orderId=test-123');
      const failureResponse = await fetch('http://localhost:3002/api/auctions/payment/esewa/failure?orderId=test-123');

      if (successResponse.ok && failureResponse.ok) {
        setTestResults(prev => prev.map(item => 
          item.step === 3 
            ? { ...item, status: 'success', message: 'Callback endpoints accessible' }
            : item
        ));
      } else {
        throw new Error('Callback endpoints not accessible');
      }

      toast({
        title: "eSewa Test Completed",
        description: "All tests completed successfully. Check the test results below.",
      });

    } catch (error) {
      console.error('eSewa test error:', error);
      
      setTestResults(prev => prev.map(item => 
        item.status === 'loading' 
          ? { ...item, status: 'error', message: error.message || 'Test failed' }
          : item
      ));

      toast({
        title: "Test Failed",
        description: error.message || "An error occurred during testing",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'loading':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'loading':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">eSewa Payment Gateway Test</h1>
        <p className="text-gray-600 text-lg">
          Test your eSewa payment integration with test credentials
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Test Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Test Configuration
            </CardTitle>
            <CardDescription>
              Configure and run eSewa payment tests
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Test Amount (NPR)</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="100"
                min="1"
                step="0.01"
              />
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <span className="font-medium text-amber-800">Test Environment</span>
              </div>
              <p className="text-sm text-amber-700">
                This uses eSewa's test environment. Use these test credentials:
              </p>
              <div className="mt-2 font-mono text-xs bg-amber-100 p-2 rounded">
                Username: test@esewa.com.np<br />
                Password: test123<br />
                OTP: 123456
              </div>
            </div>

            <Button 
              onClick={testEsewaPayment}
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Tests...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Start eSewa Test
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Test Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Test Results
            </CardTitle>
            <CardDescription>
              Results from eSewa integration tests
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {testResults.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No tests run yet. Click "Start eSewa Test" to begin.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {testResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${getStatusColor(result.status)}`}
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(result.status)}
                      <div className="flex-1">
                        <h4 className="font-medium">{result.title}</h4>
                        <p className="text-sm opacity-80">{result.message}</p>
                      </div>
                      <Badge variant={result.status === 'success' ? 'default' : result.status === 'error' ? 'destructive' : 'secondary'}>
                        {result.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Integration Details */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>eSewa Integration Details</CardTitle>
          <CardDescription>
            Technical details about your eSewa payment setup
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-medium">Merchant Code</Label>
              <div className="bg-gray-100 p-2 rounded font-mono text-sm">EPAYTEST</div>
            </div>
            
            <div className="space-y-2">
              <Label className="font-medium">Test Environment</Label>
              <div className="bg-gray-100 p-2 rounded font-mono text-sm">rc-epay.esewa.com.np</div>
            </div>
            
            <div className="space-y-2">
              <Label className="font-medium">Success URL</Label>
              <div className="bg-gray-100 p-2 rounded font-mono text-sm break-all">
                http://localhost:3002/api/auctions/payment/esewa/success
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="font-medium">Failure URL</Label>
              <div className="bg-gray-100 p-2 rounded font-mono text-sm break-all">
                http://localhost:3002/api/auctions/payment/esewa/failure
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="font-medium">Test Payment Endpoints</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline">GET</Badge>
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                  /api/esewa/test-payment?amount=100
                </code>
                <span className="text-sm text-gray-600">- Test payment page</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">POST</Badge>
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                  /api/auctions/order/:orderId/payment/esewa/initiate
                </code>
                <span className="text-sm text-gray-600">- Initiate auction payment</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-800">Security Features</span>
            </div>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• HMAC-SHA256 signature verification</li>
              <li>• Transaction UUID generation</li>
              <li>• Secure callback handling</li>
              <li>• Payment verification with eSewa API</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestEsewa;
