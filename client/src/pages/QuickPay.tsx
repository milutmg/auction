import React, { useState } from 'react';
import { GlassmorphicCard } from '@/components/ui/GlassmorphicCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CreditCard, DollarSign } from 'lucide-react';

const QuickPay: React.FC = () => {
  const [amount, setAmount] = useState('1000');

  const handlePayment = () => {
    const url = `http://localhost:3002/api/payments/custom-pay?amount=${amount}&customerName=Test User&customerEmail=test@example.com&description=Quick Payment Test`;
    window.open(url, '_blank');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <GlassmorphicCard className="p-8">
        <div className="text-center mb-6">
          <CreditCard className="h-12 w-12 text-amber-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold">Quick eSewa Payment</h1>
          <p className="text-gray-600">Test payment integration</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Amount</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10"
                placeholder="Enter amount"
              />
            </div>
          </div>

          <Button 
            onClick={handlePayment}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            Pay with eSewa
          </Button>
        </div>
      </GlassmorphicCard>
    </div>
  );
};

export default QuickPay;