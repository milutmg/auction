import React, { useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { socketService } from '@/services/socketService';
import { CheckCircle, XCircle, CreditCard } from 'lucide-react';

interface PaymentNotificationData {
  type: 'success' | 'error';
  title: string;
  message: string;
  transactionId: string;
}

const PaymentNotification: React.FC = () => {
  const { toast } = useToast();

  useEffect(() => {
    const handlePaymentNotification = (data: PaymentNotificationData) => {
      const icon = data.type === 'success' ? CheckCircle : XCircle;
      const variant = data.type === 'success' ? 'default' : 'destructive';

      toast({
        title: data.title,
        description: (
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <div>
              <p>{data.message}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Transaction: {data.transactionId}
              </p>
            </div>
          </div>
        ),
        variant,
        duration: 5000,
      });
    };

    // Listen for payment notifications via socket
    const socket = socketService.getSocket();
    if (socket) {
      socket.on('payment-notification', handlePaymentNotification);
    }

    return () => {
      if (socket) {
        socket.off('payment-notification', handlePaymentNotification);
      }
    };
  }, [toast]);

  return null; // This component only handles notifications
};

export default PaymentNotification;