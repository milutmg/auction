import React, { useEffect, useState } from 'react';
import apiService from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Auction {
  id: number;
  title: string;
  starting_bid: number;
  current_bid: number | null;
  status: string;
  approval_status: string;
  created_at: string;
  seller_id: number;
}

const AdminManageAuctions: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [processing, setProcessing] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRejected, setShowRejected] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchAuctions();
  }, [user]);

  const fetchAuctions = async () => {
    setLoading(true);
    try {
      // Use dedicated admin endpoint to get all auctions with approval statuses
      const data = await apiService.getAdminAllAuctions();
      const list: Auction[] = Array.isArray(data) ? data : (data?.data || data?.auctions || []);
      setAuctions(list);
    } catch (e: any) {
      console.error('Failed to load auctions', e);
      setError(e.message || 'Failed to load auctions');
    } finally {
      setLoading(false);
    }
  };

  const approve = async (id: number) => {
    setProcessing(id);
    try {
      await apiService.approveAuction(id.toString());
      setAuctions(prev => prev.filter(a => a.id !== id));
    } catch (e: any) {
      alert(e.message || 'Approve failed');
    } finally { setProcessing(null); }
  };

  const reject = async (id: number) => {
    const reason = prompt('Enter rejection reason (optional)');
    if (reason === null) return; // cancelled
    setProcessing(id);
    try {
      await apiService.rejectAuction(id.toString(), reason || undefined);
      setAuctions(prev => prev.filter(a => a.id !== id));
    } catch (e: any) {
      alert(e.message || 'Reject failed');
    } finally { setProcessing(null); }
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Manage Auctions</h1>
      {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-4">{error}</div>}
      {loading ? <div>Loading...</div> : (
        auctions.filter(a=> a.approval_status==='pending' || a.approval_status==='rejected').length === 0 ? <div>No pending/rejected auctions.</div> : (
          <>
            <div className="flex items-center gap-4 mb-4">
              <button onClick={()=>setShowRejected(false)} className={`text-sm px-3 py-1 rounded ${!showRejected?'bg-green-600 text-white':'bg-gray-200'}`}>Pending ({auctions.filter(a=>a.approval_status==='pending').length})</button>
              <button onClick={()=>setShowRejected(true)} className={`text-sm px-3 py-1 rounded ${showRejected?'bg-red-600 text-white':'bg-gray-200'}`}>Rejected ({auctions.filter(a=>a.approval_status==='rejected').length})</button>
            </div>
            <div className="space-y-4">
            {auctions
              .filter(a=> showRejected? a.approval_status==='rejected': a.approval_status==='pending')
              .map(a => (
              <div key={a.id} className="border rounded p-4 flex justify-between items-center">
                <div>
                  <div className="font-semibold">{a.title}</div>
                  <div className="text-sm text-gray-600">Starting: ${a.starting_bid} {a.current_bid ? ` | Current: $${a.current_bid}` : ''}</div>
                  <div className="text-xs mt-1">Status: {a.status} | Approval: <span className={a.approval_status === 'pending' ? 'text-yellow-600' : a.approval_status==='rejected'? 'text-red-600':'text-green-600'}>{a.approval_status}</span></div>
                </div>
                <div className="flex gap-2">
                  {a.approval_status === 'pending' && (
                    <button disabled={processing===a.id} onClick={() => approve(a.id)} className="px-3 py-1 bg-green-600 text-white rounded text-sm disabled:opacity-50">{processing===a.id?'...':'Approve'}</button>
                  )}
                  {a.approval_status === 'pending' && (
                    <button disabled={processing===a.id} onClick={() => reject(a.id)} className="px-3 py-1 bg-red-600 text-white rounded text-sm disabled:opacity-50">{processing===a.id?'...':'Reject'}</button>
                  )}
                </div>
              </div>
            ))}
            </div>
          </>
        )
      )}
    </div>
  );
};

export default AdminManageAuctions;
