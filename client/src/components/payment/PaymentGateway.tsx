import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { 
  CreditCard, 
  Wallet, 
  Building2, 
  DollarSign, 
  Shield, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink
} from 'lucide-react';
import apiService from '@/services/api';

interface PaymentProvider {
  id: string;
  name: string;
  display_name: string;
  provider_type: string;
  payment_methods: string[];
  fee_structure: {
    percentage: number;
    fixed: number;
  };
  processing_time: string;
}

interface PaymentFees {
  gross_amount: number;
  net_amount: number;
  gateway_fee: number;
  platform_fee: number;
}

interface PaymentGatewayProps {
  orderId: string;
  amount: number;
  currency?: string;
  onPaymentSuccess?: (transactionId: string) => void;
  onPaymentError?: (error: string) => void;
}

const PaymentGateway: React.FC<PaymentGatewayProps> = ({
  orderId,
  amount,
  currency = 'USD',
  onPaymentSuccess,
  onPaymentError
}) => {
  const { toast } = useToast();
  
  // State
  const [providers, setProviders] = useState<PaymentProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('esewa'); // force esewa
  const [selectedMethod, setSelectedMethod] = useState<string>('wallet'); // only wallet method
  const [fees, setFees] = useState<PaymentFees | null>(null);
  const [loading, setLoading] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  
  // Customer info state
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: ''
  });

  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    card_number: '',
    expiry_month: '',
    expiry_year: '',
    cvv: '',
    cardholder_name: ''
  });

  // Load payment providers on mount
  useEffect(() => {
    loadPaymentProviders();
    // Also compute fees for eSewa immediately
    calculateFees();
  }, [amount, currency]);

  const loadPaymentProviders = async () => {
    try {
      setLoading(true);
      // Fetch providers but keep only eSewa active
      const response = await apiService.get(`/payments-v2/providers?amount=${amount}&currency=${currency}`);
      const esewaOnly = (response.providers || []).filter((p: PaymentProvider) => p.name === 'esewa');
      // Normalize fallback if backend not returning esewa
      if (esewaOnly.length === 0) {
        esewaOnly.push({
          id: 'esewa-static',
            name: 'esewa',
            display_name: 'eSewa',
            provider_type: 'wallet',
            payment_methods: ['wallet'],
            fee_structure: { percentage: 0, fixed: 0 },
            processing_time: 'Instant'
        } as any);
      }
      setProviders(esewaOnly);
      setSelectedProvider('esewa');
      setSelectedMethod('wallet');
    } catch (error) {
      console.error('Failed to load payment providers:', error);
      // Fallback static eSewa
      setProviders([{
        id: 'esewa-static',
        name: 'esewa',
        display_name: 'eSewa',
        provider_type: 'wallet',
        payment_methods: ['wallet'],
        fee_structure: { percentage: 0, fixed: 0 },
        processing_time: 'Instant'
      } as any]);
    } finally {
      setLoading(false);
    }
  };

  // Disable changing provider (only eSewa) so remove handleProviderChange side effects
  const handleProviderChange = (providerName: string) => {
    if (providerName !== 'esewa') return; // ignore other clicks
    setSelectedProvider('esewa');
    setSelectedMethod('wallet');
  };
  const calculateFees = async () => {
    try {
      // call backend only if endpoint exists; fallback to simple fee (none)
      const response = await apiService.post('/payments-v2/calculate-fees', {
        amount,
        provider_name: 'esewa'
      }).catch(() => ({ fees: { gross_amount: amount, net_amount: amount, gateway_fee: 0, platform_fee: 0 }}));
      setFees(response.fees || { gross_amount: amount, net_amount: amount, gateway_fee: 0, platform_fee: 0 });
    } catch {/* silent */}
  };

  const getProviderIcon = (providerType: string, providerName: string) => {
    switch (providerName) {
      case 'esewa':
        return <Wallet className="h-5 w-5 text-green-600" />;
      case 'khalti':
        return <Wallet className="h-5 w-5 text-purple-600" />;
      case 'stripe':
        return <CreditCard className="h-5 w-5 text-blue-600" />;
      case 'paypal':
        return <CreditCard className="h-5 w-5 text-blue-400" />;
      case 'bank_transfer':
        return <Building2 className="h-5 w-5 text-gray-600" />;
      default:
        return <CreditCard className="h-5 w-5" />;
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'wallet':
        return <Wallet className="h-4 w-4" />;
      case 'card':
        return <CreditCard className="h-4 w-4" />;
      case 'bank_transfer':
        return <Building2 className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const validateForm = () => {
    if (!customerInfo.name || !customerInfo.email) {
      toast({
        title: "Validation Error",
        description: "Name and email are required.",
        variant: "destructive",
      });
      return false;
    }

    if (selectedMethod === 'card' && selectedProvider === 'stripe') {
      if (!paymentForm.card_number || !paymentForm.expiry_month || 
          !paymentForm.expiry_year || !paymentForm.cvv || !paymentForm.cardholder_name) {
        toast({
          title: "Validation Error",
          description: "All card details are required.",
          variant: "destructive",
        });
        return false;
      }
    }

    return true;
  };

  const processPayment = async () => {
    if (!validateForm()) return;
    try {
      setProcessingPayment(true);
      const paymentData: any = {
        payment_provider: 'esewa',
        payment_method: 'wallet',
        customer_info: customerInfo
      };
      const response = await apiService.post(`/payments-v2/orders/${orderId}/pay`, paymentData);
      if (response.success && response.payment_result?.payment_type === 'redirect') {
        if (response.payment_result.form_data) {
          submitPaymentForm(response.payment_result.payment_url, response.payment_result.form_data, response.payment_result.method);
        } else if (response.payment_result.payment_url) {
          window.open(response.payment_result.payment_url, '_blank');
        }
        if (onPaymentSuccess) onPaymentSuccess(response.transaction_id);
      } else {
        // Fallback simple initiate eSewa legacy if enhanced route not available
        try {
          const legacy = await apiService.initiateEsewaPayment(orderId);
          if (legacy?.form) {
            submitPaymentForm(legacy.action, legacy.form, 'POST');
          }
        } catch {/* ignore */}
      }
    } catch (error: any) {
      const msg = error.message || 'Payment processing failed';
      toast({ title: 'Payment Error', description: msg, variant: 'destructive' });
      if (onPaymentError) onPaymentError(msg);
    } finally { setProcessingPayment(false); }
  };

  const submitPaymentForm = (actionUrl: string, formData: any, method: string = 'POST') => {
    // Create a form dynamically and submit
    const form = document.createElement('form');
    form.method = method;
    form.action = actionUrl;

    Object.entries(formData).forEach(([key, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = value as string;
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  };

  const handleStripePayment = (clientSecret: string) => {
    // This would integrate with Stripe's JavaScript SDK
    toast({
      title: "Stripe Payment",
      description: "Stripe payment integration would be implemented here.",
    });
  };

  const handleKhaltiWidget = (widgetData: any, publicKey: string) => {
    // This would integrate with Khalti's JavaScript widget
    toast({
      title: "Khalti Payment",
      description: "Khalti payment widget would be loaded here.",
    });
  };

  const showBankTransferInstructions = (bankDetails: any, instructions: string[]) => {
    // This would show a modal or redirect to instructions page
    toast({
      title: "Bank Transfer",
      description: "Bank transfer instructions will be displayed.",
    });
  };

  const currentProvider = providers.find(p => p.name === selectedProvider);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading payment options...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Payment Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Payment Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Auction Amount:</span>
              <span className="font-medium">${amount.toFixed(2)}</span>
            </div>
            {fees && (
              <>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Payment Fee:</span>
                  <span>${fees.gateway_fee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Platform Fee:</span>
                  <span>${fees.platform_fee.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>${fees.gross_amount.toFixed(2)}</span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Provider Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Choose Payment Method</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {providers.map((provider) => (
              <div
                key={provider.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  'esewa' === provider.name ? 'border-green-500 bg-green-50' : 'border-gray-200'
                }`}
                onClick={() => handleProviderChange(provider.name)}
              >
                <div className="flex items-center gap-3">
                  {getProviderIcon(provider.provider_type, provider.name)}
                  <div className="flex-1">
                    <div className="font-medium">{provider.display_name}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      {provider.processing_time}
                    </div>
                  </div>
                  <Badge variant="secondary">Active</Badge>
                </div>
              </div>
            ))}
            {/* Static disabled Khalti */}
            <div className="p-4 border rounded-lg opacity-50 select-none">
              <div className="flex items-center gap-3">
                {getProviderIcon('wallet', 'khalti')}
                <div className="flex-1">
                  <div className="font-medium">Khalti (Coming Soon)</div>
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Clock className="h-3 w-3" />Later
                  </div>
                </div>
                <Badge variant="outline">Disabled</Badge>
              </div>
            </div>
            {/* Static disabled Cash on Arrival */}
            <div className="p-4 border rounded-lg opacity-50 select-none">
              <div className="flex items-center gap-3">
                <Wallet className="h-5 w-5 text-gray-600" />
                <div className="flex-1">
                  <div className="font-medium">Cash on Arrival</div>
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Clock className="h-3 w-3" />Not Supported
                  </div>
                </div>
                <Badge variant="outline">Disabled</Badge>
              </div>
            </div>
          </div>
          {/* No method selector needed since only wallet */}
        </CardContent>
      </Card>

      {/* Customer Information */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={customerInfo.name}
                onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={customerInfo.email}
                onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                placeholder="Enter your email"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={customerInfo.phone}
              onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
              placeholder="Enter your phone number"
            />
          </div>
        </CardContent>
      </Card>

      {/* Card Details for Stripe */}
      {selectedMethod === 'card' && selectedProvider === 'stripe' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Card Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="card_number">Card Number *</Label>
              <Input
                id="card_number"
                value={paymentForm.card_number}
                onChange={(e) => setPaymentForm({ ...paymentForm, card_number: e.target.value })}
                placeholder="1234 5678 9012 3456"
                maxLength={19}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="expiry_month">Month *</Label>
                <Select
                  value={paymentForm.expiry_month}
                  onValueChange={(value) => setPaymentForm({ ...paymentForm, expiry_month: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="MM" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                      <SelectItem key={month} value={month.toString().padStart(2, '0')}>
                        {month.toString().padStart(2, '0')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="expiry_year">Year *</Label>
                <Select
                  value={paymentForm.expiry_year}
                  onValueChange={(value) => setPaymentForm({ ...paymentForm, expiry_year: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="YYYY" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="cvv">CVV *</Label>
                <Input
                  id="cvv"
                  value={paymentForm.cvv}
                  onChange={(e) => setPaymentForm({ ...paymentForm, cvv: e.target.value })}
                  placeholder="123"
                  maxLength={4}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="cardholder_name">Cardholder Name *</Label>
              <Input
                id="cardholder_name"
                value={paymentForm.cardholder_name}
                onChange={(e) => setPaymentForm({ ...paymentForm, cardholder_name: e.target.value })}
                placeholder="Name on card"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Notice */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Your payment information is encrypted and secure. We never store your sensitive payment details.
        </AlertDescription>
      </Alert>

      {/* Pay Button */}
      <Button
        onClick={processPayment}
        disabled={processingPayment || selectedProvider !== 'esewa'}
        className="w-full"
        size="lg"
      >
        {processingPayment ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing eSewa Payment...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            Pay with eSewa
          </>
        )}
      </Button>
    </div>
  );
};

export default PaymentGateway;
