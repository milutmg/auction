import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, ArrowRight, Home, Receipt } from 'lucide-react';

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const transactionId = searchParams.get('ref');
  const auctionId = searchParams.get('auction_id');

  const now = new Date().toLocaleString();

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-amber-50 via-white to-amber-100 relative overflow-hidden">
      {/* Decorative blurred orbs */}
      <div className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full bg-gradient-to-br from-gold/30 to-amber-200 blur-3xl opacity-60 animate-pulse" />
      <div className="pointer-events-none absolute bottom-[-120px] right-[-120px] w-96 h-96 rounded-full bg-gradient-to-tr from-amber-300/40 to-gold/30 blur-3xl opacity-40" />

      <div className="relative w-full max-w-md">
        <div className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-amber-100 px-8 py-10 text-center animate-[fadeIn_0.5s_ease]">
          <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-green-500/30 mb-6 animate-[popIn_0.45s_ease]">
            <CheckCircle size={46} className="drop-shadow" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Payment Successful</h1>
          <p className="mt-2 text-sm text-gray-600">Thank you. Your payment has been confirmed.</p>
          <div className="mt-4 space-y-1 text-xs text-gray-500">
            {auctionId && <p className="font-medium text-gray-700">Auction <span className="text-gold font-semibold">#{auctionId}</span></p>}
            {transactionId && <p className="flex items-center justify-center gap-1">Txn Ref: <span className="font-mono text-[11px] bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">{transactionId}</span></p>}
            <p>{now}</p>
          </div>

            {/* Divider */}
          <div className="mt-6 h-px bg-gradient-to-r from-transparent via-amber-200 to-transparent" />

          <div className="mt-6 grid grid-cols-2 gap-3">
            <Link to="/payments" className="group/pay inline-flex items-center justify-center gap-1.5 rounded-lg bg-gold text-white text-sm font-medium py-2.5 px-3 shadow hover:bg-gold-dark focus:outline-none focus:ring-2 focus:ring-gold/50 transition">
              <Receipt size={16} />
              <span>Payments</span>
            </Link>
            <Link to="/dashboard" className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium py-2.5 px-3 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gold/40 transition">
              <Home size={16} />
              <span>Dashboard</span>
            </Link>
            <Link to="/auctions" className="col-span-2 inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-gold text-white text-sm font-medium py-2.5 px-3 shadow hover:from-amber-500 hover:to-gold-dark focus:outline-none focus:ring-2 focus:ring-gold/50 transition">
              <span>Browse Auctions</span>
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <p className="mt-6 text-[11px] text-gray-400">You can safely close this page.</p>
        </div>
      </div>

      {/* Simple keyframes */}
      <style>{`@keyframes fadeIn{0%{opacity:0;transform:translateY(8px)}100%{opacity:1;transform:translateY(0)}}@keyframes popIn{0%{opacity:0;transform:scale(.6)}60%{opacity:1;transform:scale(1.05)}100%{opacity:1;transform:scale(1)}}`}</style>
    </div>
  );
};

export default PaymentSuccess;