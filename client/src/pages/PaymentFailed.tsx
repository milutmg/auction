import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { XCircle } from 'lucide-react';

const PaymentFailed: React.FC = () => {
  const [searchParams] = useSearchParams();
  const error = searchParams.get('error');
  const auctionId = searchParams.get('auction_id');

  const getErrorMessage = (errorCode: string | null) => {
    switch (errorCode) {
      case 'missing_auction_id':
        return 'Auction ID is missing. Please try again.';
      case 'auction_not_found':
        return 'The auction was not found or is not available for payment.';
      case 'payment_cancelled':
        return 'Payment was cancelled. You can try again anytime.';
      case 'decode_failed':
        return 'There was an error processing the payment response.';
      case 'missing_data':
        return 'Payment data is incomplete. Please contact support.';
      case 'processing_failed':
        return 'Payment processing failed. Please try again.';
      default:
        return 'Payment failed due to an unknown error. Please try again.';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <XCircle className="mx-auto h-16 w-16 text-red-500" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Payment Failed
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {getErrorMessage(error)}
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">What can you do?</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Check your payment method and try again</li>
            <li>• Ensure you have sufficient funds</li>
            <li>• Contact our support team if the problem persists</li>
            <li>• Try using a different payment method</li>
          </ul>
        </div>

        <div className="flex space-x-4">
          {auctionId && (
            <a
              href={`/api/payments/pay?auction_id=${auctionId}`}
              className="flex-1 bg-amber-600 text-white py-2 px-4 rounded-md text-center hover:bg-amber-700 transition-colors"
            >
              Try Again
            </a>
          )}
          <Link
            to="/auctions"
            className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md text-center hover:bg-gray-700 transition-colors"
          >
            Browse Auctions
          </Link>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Need help? Contact us at{' '}
            <a href="mailto:support@antiqueauc.com" className="text-amber-600 hover:text-amber-500">
              support@antiqueauc.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailed;