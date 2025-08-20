import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { GlassmorphicCard } from '@/components/ui/GlassmorphicCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CreditCard, DollarSign, Check, X as Close, Smartphone, Wallet } from 'lucide-react';

// Currency formatter for NPR
const formatNPR = (val: any) => {
  const num = parseFloat(val);
  if (isNaN(num)) return 'NPR 0.00';
  return 'NPR ' + num.toFixed(2);
};

const PaymentForm: React.FC = () => {
  const { user } = useAuth();
  const [pending, setPending] = useState<any[]>([]);
  const [selectedAuction, setSelectedAuction] = useState<any | null>(null);
  const [method, setMethod] = useState<'esewa' | 'khalti' | 'cod'>('esewa');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const price = selectedAuction?.current_bid ? parseFloat(selectedAuction.current_bid) : 0;

  // Load pending payment events first; fall back to legacy pending list if empty
  useEffect(() => {
    if (!user) return;
    let active = true;
    async function load() {
      setLoadingData(true);
      try {
        const evRes = await fetch(`/api/payments/events/pending/${user.id}`);
        let events = await evRes.json();
        if (!Array.isArray(events)) events = [];
        // Normalize event fields so UI expects current_bid
        events = events.map((e: any) => ({
          auction_id: e.auction_id,
          title: e.auction_title || e.title,
            current_bid: e.current_bid || e.amount, // ensure amount from payment_events table is used
            status: e.status || 'pending',
            created_at: e.created_at
        }));
        if (events.length === 0) {
          // fallback (safety) to compute pending directly from auctions
          const pendRes = await fetch(`/api/payments/pending/${user.id}`);
            const legacy = await pendRes.json();
            events = legacy.map((l: any) => ({
              auction_id: l.auction_id,
              title: l.title,
              current_bid: l.current_bid,
              status: 'pending',
              created_at: l.created_at
            }));
        }
        if (active) {
          setPending(events);
          if (events.length) setSelectedAuction(events[0]);
        }
      } catch {/* silent */} finally { if (active) setLoadingData(false); }
    }
    load();
    return () => { active = false; };
  }, [user?.id]);

  const handlePay = async () => {
    if (!selectedAuction || !user) return;
    if (method !== 'esewa') return; // only esewa enabled
    setLoading(true);
    try {
      const resp = await fetch(`/api/payments/pay?auction_id=${selectedAuction.auction_id}`, { headers: { 'Authorization': `Bearer ${token}` }});
      if (!resp.ok) throw new Error('Failed to init payment');
      const html = await resp.text();
      const w = window.open('', '_blank');
      if (w) { w.document.write(html); w.document.close(); } else { document.open(); document.write(html); document.close(); }
    } catch (e) {
      alert('Unable to start payment.');
    } finally { setLoading(false); }
  };

  if (!user) return null;

  return (
    <div className="flex justify-center py-10 px-4">
      <div className="w-full max-w-md bg-white shadow-lg rounded-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b flex items-center justify-between bg-gray-50">
          <h2 className="text-lg font-semibold">Complete Payment</h2>
          <button onClick={()=>window.history.back()} className="p-1 hover:bg-gray-200 rounded" aria-label="Close">
            <Close size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-6">
          {loadingData && <div className="text-sm text-gray-500">Loading payment data...</div>}
          {/* Auction selection if multiple */}
          {!loadingData && pending.length > 1 && (
            <div>
              <label className="block text-sm font-medium mb-2">Select Auction</label>
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500"
                value={selectedAuction?.auction_id || ''}
                onChange={(e) => setSelectedAuction(pending.find(a => a.auction_id === parseInt(e.target.value)))}
              >
                {pending.map(p => <option key={p.auction_id} value={p.auction_id}>#{p.auction_id} • {p.title} • {formatNPR(p.current_bid)}</option>)}
              </select>
            </div>
          )}

          {/* Summary */}
          <div className="border rounded-lg bg-gray-50">
            <div className="px-4 py-3 border-b font-semibold text-sm flex items-center justify-between">
              <span>Auction Summary</span>
              {selectedAuction ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  {formatNPR(selectedAuction.current_bid)} due
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">No payment due</span>
              )}
            </div>
            {selectedAuction ? (
              <div className="px-4 py-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">Auction ID:</span><span className="font-medium">#{selectedAuction.auction_id}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Title:</span><span className="font-medium truncate max-w-[200px]" title={selectedAuction.title}>{selectedAuction.title}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Winning Bid:</span><span className="font-semibold text-gray-900">{formatNPR(selectedAuction.current_bid)}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Status:</span><span className="text-amber-600 font-medium">Payment Required</span></div>
                <div className="pt-2 border-t flex justify-between font-semibold"><span>Total Amount:</span><span>{formatNPR(selectedAuction.current_bid)}</span></div>
              </div>
            ) : (
              <div className="px-4 py-6 text-center text-sm text-gray-500">You have no outstanding auction payments.</div>
            )}
          </div>

          {/* Payment Methods */}
          <div>
            <h3 className="text-sm font-medium mb-3">Select Payment Method</h3>
            <div className="space-y-3">
              {/* eSewa */}
              <label className={`flex items-center gap-3 border rounded-lg p-3 cursor-pointer transition ${method==='esewa' ? 'border-green-600 ring-2 ring-green-200' : 'border-gray-200 hover:border-gray-300'}`}> 
                <input type="radio" name="method" className="hidden" checked={method==='esewa'} onChange={()=>setMethod('esewa')} />
                <div className="w-10 h-10 rounded bg-green-600 flex items-center justify-center text-white"><CreditCard size={18} /></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">eSewa</p>
                  <p className="text-xs text-gray-500">Instant digital wallet payment</p>
                </div>
                {method==='esewa' && <Check size={18} className="text-green-600" />}
              </label>
              {/* Khalti disabled */}
              <div className="opacity-60 pointer-events-none">
                <label className="flex items-center gap-3 border rounded-lg p-3 bg-gray-50">
                  <div className="w-10 h-10 rounded bg-purple-600 flex items-center justify-center text-white"><Smartphone size={18} /></div>
                  <div className="flex-1"><p className="text-sm font-medium">Khalti (Coming Soon)</p><p className="text-xs text-gray-500">Currently unavailable</p></div>
                </label>
              </div>
              {/* Cash on Arrival disabled */}
              <div className="opacity-60 pointer-events-none">
                <label className="flex items-center gap-3 border rounded-lg p-3 bg-gray-50">
                  <div className="w-10 h-10 rounded bg-gray-700 flex items-center justify-center text-white"><Wallet size={18} /></div>
                  <div className="flex-1"><p className="text-sm font-medium">Cash on Arrival</p><p className="text-xs text-gray-500">Not supported for auctions</p></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Action */}
        <div className="px-5 pb-6">
          <button
            disabled={!selectedAuction || loading}
            onClick={handlePay}
            className={`w-full rounded-lg py-3 text-sm font-semibold text-white transition flex items-center justify-center gap-2 ${(!selectedAuction || loading) ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
          >
            {loading ? 'Initializing...' : selectedAuction ? `Pay ${formatNPR(price)} with eSewa` : 'No Payment Due'}
          </button>
          <p className="mt-3 text-center text-xs text-gray-500">Your order will be confirmed once payment is completed successfully.</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentForm;