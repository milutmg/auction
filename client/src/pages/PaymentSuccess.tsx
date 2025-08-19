import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

interface PaymentDetails {
  transaction_id: string;
  auction_title: string;
  amount: number;
  winner_name: string;
  status: string;
}

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const transactionId = searchParams.get('ref');
  const auctionId = searchParams.get('auction_id');

  useEffect(() => {
    if (transactionId) {
      fetchPaymentDetails();
    }
  }, [transactionId]);

  const fetchPaymentDetails = async () => {
    try {
      const response = await fetch(`/api/payments/status/${transactionId}`);
      if (response.ok) {
        const data = await response.json();
        setPaymentDetails(data);
      }
    } catch (error) {
      console.error('Error fetching payment details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Payment Successful!
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Your payment has been processed successfully
          </p>
        </div>

        {paymentDetails && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Details</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Transaction ID</dt>
                <dd className="text-sm text-gray-900 font-mono">{paymentDetails.transaction_id}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Auction</dt>
                <dd className="text-sm text-gray-900">{paymentDetails.auction_title}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Amount Paid</dt>
                <dd className="text-sm text-gray-900">${paymentDetails.amount}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="text-sm text-green-600 capitalize">{paymentDetails.status}</dd>
              </div>
            </dl>
          </div>
        )}

        <div className="flex space-x-4">
          <Link
            to="/auctions"
            className="flex-1 bg-amber-600 text-white py-2 px-4 rounded-md text-center hover:bg-amber-700 transition-colors"
          >
            Browse Auctions
          </Link>
          <Link
            to="/profile"
            className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md text-center hover:bg-gray-700 transition-colors"
          >
            View Profile
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;