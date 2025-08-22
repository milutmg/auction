import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User, Settings, LogOut, Bell, ChevronDown, Search, Menu, X, Check, Clock, AlertCircle, MessageSquare, DollarSign, Gavel, LayoutDashboard, CreditCard, PlusCircle, Folder } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { socketService } from '@/services/socketService'; // added

// Notification Dropdown Component
const NotificationDropdown = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]); // {id,title,message,type,time,unread,created_at}
  const dropdownRef = useRef<HTMLDivElement>(null);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const unreadCount = notifications.filter(n => n.unread).length;

  // Helpers
  const fetchNotifications = async () => {
    if (!user || !token) return;
    setLoading(true);
    try {
      const resp = await fetch('/api/notifications?limit=25', { headers: { 'Authorization': `Bearer ${token}` } });
      if (resp.ok) {
        const data = await resp.json();
        setNotifications(data.map((n: any) => ({
          id: n.id,
            title: n.title,
            message: n.message,
            type: n.type,
            created_at: n.created_at,
            time: formatRelativeTime(n.created_at),
            unread: !n.read
        })));
      }
    } catch (e) { /* silent */ }
    finally { setLoading(false); }
  };

  const formatRelativeTime = (iso: string) => {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const sec = Math.floor(diff/1000);
    if (sec < 60) return sec + 's ago';
    const min = Math.floor(sec/60); if (min < 60) return min + 'm ago';
    const hr = Math.floor(min/60); if (hr < 24) return hr + 'h ago';
    const day = Math.floor(hr/24); return day + 'd ago';
  };

  const pushNotification = (partial: any) => {
    setNotifications(prev => {
      // avoid duplicates by id & type combo
      const exists = prev.some(p => p.id === partial.id && partial.id !== undefined);
      const item = { ...partial, time: formatRelativeTime(partial.created_at || new Date().toISOString()), unread: true };
      return exists ? prev : [item, ...prev].slice(0, 50);
    });
  };

  // Socket listeners for real-time events
  useEffect(() => {
    if (!user) return;
    fetchNotifications();

    socketService.connect().then(sock => {
      const bidApproved = (d: any) => { if (d.bidderId === user.id) pushNotification({
        id: 'bid-approved-' + d.bidId,
        title: 'Bid Approved',
        message: `Your bid ($${d.amount}) was approved on auction #${d.auctionId}.`,
        type: 'bid_approved', created_at: new Date().toISOString()
      }); };
      const auctionApproved = (d: any) => { if (d.sellerId === user.id) pushNotification({
        id: 'auction-approved-' + d.auctionId,
        title: 'Auction Approved',
        message: `Your auction "${d.title}" is now live for bidding.`,
        type: 'auction_approved', created_at: new Date().toISOString()
      }); };
      const paymentCompleted = (d: any) => { if (d.userId === user.id) pushNotification({
        id: 'payment-completed-' + d.auctionId,
        title: 'Payment Successful',
        message: `Payment completed for auction #${d.auctionId}.`,
        type: 'payment_success', created_at: new Date().toISOString()
      }); };
      const paymentRequired = (d: any) => { if (d.userId === user.id) pushNotification({
        id: 'payment-required-' + d.auctionId,
        title: 'Payment Required',
        message: `Please complete payment for "${d.title}" ($${d.amount}).`,
        type: 'payment_required', created_at: new Date().toISOString()
      }); };

      socketService.onBidApproved(bidApproved);
      sock.on('auction-approved', auctionApproved);
      socketService.onPaymentCompleted(paymentCompleted);
      socketService.onPaymentRequired(paymentRequired);

      socketService.onReconnect(() => { fetchNotifications(); });

      return () => {
        socketService.offBidApproved(bidApproved);
        sock.off('auction-approved', auctionApproved);
        socketService.offPaymentCompleted(paymentCompleted);
        socketService.offPaymentRequired(paymentRequired);
      };
    }).catch(()=>{});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = () => setIsOpen(o => !o);

  const markAsRead = async (id: any) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread:false } : n));
    if (!token) return;
    try { await fetch(`/api/notifications/${id}/read`, { method:'PUT', headers:{ 'Authorization': `Bearer ${token}` } }); } catch {}
  };
  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread:false })));
    if (!token) return;
    try { await fetch('/api/notifications/mark-all-read', { method:'PUT', headers:{ 'Authorization': `Bearer ${token}` } }); } catch {}
  };

  const getIcon = (type: string) => {
    if (type === 'bid_approved') return <Check size={16} className="text-green-600" />;
    if (type === 'auction_approved') return <Gavel size={16} className="text-gold" />;
    if (type === 'payment_success') return <DollarSign size={16} className="text-green-600" />;
    if (type === 'payment_required') return <AlertCircle size={16} className="text-yellow-600" />;
    if (type === 'outbid') return <AlertCircle size={16} className="text-orange-500" />;
    return <MessageSquare size={16} className="text-gold" />;
  };

  if (!user) return null;

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Notification Button */}
      <button
        onClick={toggleDropdown}
        className={`relative p-2 text-gold hover:text-gold-dark hover:bg-gold hover:bg-opacity-10 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gold focus:ring-opacity-20 ${isOpen ? 'bg-gold bg-opacity-10' : ''}`}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-semibold px-1.5 py-0.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-[9999]"
          style={{ minWidth: '320px' }}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-gold hover:text-gold-dark font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto">
            {loading && <div className="px-4 py-6 text-center text-gray-500 text-sm">Loading...</div>}
            {!loading && notifications.length === 0 && (
              <div className="px-4 py-8 text-center text-gray-500 text-sm">
                No notifications
              </div>
            )}
            {notifications.map(n => (
              <div
                key={n.id}
                onClick={() => markAsRead(n.id)}
                className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${
                  n.unread ? 'bg-gold bg-opacity-5' : ''
                }`}
              >
                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <p className="text-sm font-medium text-gray-900">
                        {n.title}
                      </p>
                      {n.unread && (
                        <div className="w-2 h-2 bg-gold rounded-full flex-shrink-0 mt-1.5 ml-2"></div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {n.message}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      <Clock size={12} className="text-gray-400" />
                      <span className="text-xs text-gray-500">{n.time}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-100">
            <button onClick={()=>{ fetchNotifications(); }} className="text-sm text-gold hover:text-gold-dark font-medium w-full text-center">
              Refresh
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Profile Dropdown Component
const ProfileDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleMenuClick = (action: string) => {
    setIsOpen(false);
    switch (action) {
      case 'View Profile':
        navigate('/account');
        break;
      case 'Settings':
        navigate('/account');
        break;
      case 'Logout':
        signOut();
        navigate('/');
        break;
      default:
        break;
    }
  };

  // If no user is logged in, show login button
  if (!user) {
    return (
      <Link
        to="/auth"
        className="px-4 py-2 text-sm font-medium text-white bg-gold hover:bg-gold-dark rounded-lg transition-colors"
      >
        Sign In
      </Link>
    );
  }

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Profile Button */}
      <button
        onClick={toggleDropdown}
        className={`flex items-center gap-2 px-3 py-2 text-gold hover:text-gold-dark hover:bg-gold hover:bg-opacity-10 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gold focus:ring-opacity-20 ${isOpen ? 'bg-gold bg-opacity-10' : ''}`}
      >
        <img
          src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || user.email)}&background=c5a028&color=fff`}
          alt="Profile"
          className="w-8 h-8 rounded-full object-cover border-2 border-gold-light"
        />
        <span className="hidden md:block text-sm font-medium">{user.full_name || user.email}</span>
        <ChevronDown 
          size={16} 
          className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-xl z-[9999]"
          style={{ minWidth: '224px' }}
        >
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <img
                src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || user.email)}&background=c5a028&color=fff`}
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user.full_name || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <button
              onClick={() => handleMenuClick('View Profile')}
              className="flex items-center gap-3 w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <User size={16} />
              View Profile
            </button>

            <button
              onClick={() => handleMenuClick('Settings')}
              className="flex items-center gap-3 w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <Settings size={16} />
              Settings
            </button>
          </div>

          {/* Logout Section */}
          <div className="py-1 border-t border-gray-100">
            <button
              onClick={() => handleMenuClick('Logout')}
              className="flex items-center gap-3 w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Complete Navbar Component
const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false); // added
  const location = useLocation();
  const { user } = useAuth();
  const [pendingPayments, setPendingPayments] = useState<number>(0);
  const [recentPaymentSuccess, setRecentPaymentSuccess] = useState<{ ts:number; auctionId?: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  // Detect redirect-based success (query params) & expire after 3 minutes
  useEffect(() => {
    if (location.pathname === '/payments') {
      const params = new URLSearchParams(location.search);
      if (params.get('status') === 'success' && params.get('ref')) {
        setRecentPaymentSuccess({ ts: Date.now(), auctionId: params.get('auction_id') || undefined });
      }
    }
  }, [location.pathname, location.search]);

  // Listen to real-time payment-completed events to flash success indicator
  useEffect(() => {
    socketService.connect().then(() => {
      const handler = (d:any) => { setRecentPaymentSuccess({ ts: Date.now(), auctionId: d.auctionId }); };
      socketService.onPaymentCompleted(handler);
      return () => socketService.offPaymentCompleted(handler);
    }).catch(()=>{});
  }, []);

  // Auto-clear after 3 minutes
  useEffect(() => {
    if (!recentPaymentSuccess) return;
    const id = setTimeout(() => setRecentPaymentSuccess(null), 3*60*1000);
    return () => clearTimeout(id);
  }, [recentPaymentSuccess]);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!user) return;
      try {
        const events = await socketService.fetchPendingPaymentEvents(user.id).catch(()=>[]);
        if (active) setPendingPayments(events.length);
      } catch {}
    }
    load();

    socketService.onReconnect(() => {
      if (!user) return;
      socketService.fetchPendingPaymentEvents(user.id).then(ev => setPendingPayments(ev.length));
    });

    // Ensure socket connection via shared service
    socketService.connect().then(() => {
      if (!active) return;
      const reqH = (d: any) => { if (user && d.userId === user.id) setPendingPayments(p => p + 1); };
      const compH = (d: any) => { if (user && d.userId === user.id) setPendingPayments(p => Math.max(0, p - 1)); };
      socketService.onPaymentRequired(reqH);
      socketService.onPaymentCompleted(compH);
      return () => {
        socketService.offPaymentRequired(reqH);
        socketService.offPaymentCompleted(compH);
      };
    }).catch(()=>{});
    return () => { active = false; };
  }, [user]);

  const toggleMobileMenu = () => { setIsMobileMenuOpen(o=>!o); };
  const toggleSearch = () => { setIsSearchOpen(o=>!o); };
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    navigate(`/auctions?search=${encodeURIComponent(searchTerm.trim())}`);
    // keep input open so user can refine
  };

  const isActivePath = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="relative bg-white border-b border-gray-200 sticky top-0 z-50">
      {/* Simplified full-width bar so hamburger sits flush left */}
      <div className="flex items-center justify-between h-16 px-2 sm:px-4">
        {/* Left Section: Hamburger + Logo (flush-left) */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleMobileMenu}
            className="p-2 text-gold hover:text-gold-dark hover:bg-gold hover:bg-opacity-10 rounded-lg transition"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <Link to="/" className="text-xl font-bold text-gold hover:text-gold-dark transition-colors whitespace-nowrap">
            Antique Bidderly
          </Link>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2 relative pr-1 sm:pr-0">
          {/* Inline expandable search */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className={`flex items-center transition-all duration-300 bg-white border ${isSearchOpen ? 'border-gold/50 shadow-sm pl-2 pr-2 rounded-lg' : 'border-transparent'} overflow-hidden`}>
              <button
                type="button"
                onClick={() => { if (isSearchOpen && searchTerm) { navigate(`/auctions?search=${encodeURIComponent(searchTerm.trim())}`); } setIsSearchOpen(o=>!o); }}
                className={`p-2 text-gold hover:text-gold-dark rounded-md transition ${isSearchOpen ? 'bg-gold/10' : 'hover:bg-gold hover:bg-opacity-10'}`}
                aria-label="Search"
              >
                <Search size={18} />
              </button>
              {isSearchOpen && (
                <input
                  autoFocus
                  value={searchTerm}
                  onChange={(e)=>setSearchTerm(e.target.value)}
                  placeholder="Search auctions..."
                  className="w-40 md:w-56 bg-transparent outline-none text-sm placeholder-gray-400"
                />
              )}
            </div>
            {isSearchOpen && (
              <button type="submit" className="text-xs font-medium px-3 py-2 rounded-md bg-gold text-white hover:bg-gold-dark transition">
                Go
              </button>
            )}
          </form>
          {/* Notifications */}
          {user && <NotificationDropdown />}
          {/* Profile */}
          <ProfileDropdown />
        </div>
      </div>

      {/* Floating left vertical panel (does NOT push content) */}
      {isMobileMenuOpen && (
        <div className="absolute left-0 top-full w-64 backdrop-blur-sm bg-white/90 border-r border-b border-gold/20 shadow-xl rounded-br-2xl overflow-hidden animate-[slideInMenu_.28s_ease] z-40">
          <div className="px-4 py-4 flex flex-col gap-2">
            <nav className="flex flex-col gap-1 text-sm font-medium">
              <Link to="/auctions" className={`group flex items-center gap-2 px-3 py-2 rounded-md transition ${isActivePath('/auctions') ? 'bg-gold/15 text-gold shadow-inner' : 'text-gray-700 hover:bg-amber-50 hover:text-gold'}`} onClick={()=>setIsMobileMenuOpen(false)}>
                <Gavel size={16} className="opacity-80 group-hover:opacity-100" />
                Auctions
              </Link>
              <Link to="/categories" className={`group flex items-center gap-2 px-3 py-2 rounded-md transition ${isActivePath('/categories') ? 'bg-gold/15 text-gold shadow-inner' : 'text-gray-700 hover:bg-amber-50 hover:text-gold'}`} onClick={()=>setIsMobileMenuOpen(false)}>
                <Folder size={16} className="opacity-80 group-hover:opacity-100" />
                Categories
              </Link>
              <Link to="/test-esewa" className={`group flex items-center gap-2 px-3 py-2 rounded-md transition ${isActivePath('/test-esewa') ? 'bg-gold/15 text-gold shadow-inner' : 'text-gray-700 hover:bg-amber-50 hover:text-gold'}`} onClick={()=>setIsMobileMenuOpen(false)}>
                <CreditCard size={16} className="opacity-80 group-hover:opacity-100" />
                Test eSewa
              </Link>
              {user && (
                <>
                  <Link to="/dashboard" className={`group flex items-center gap-2 px-3 py-2 rounded-md transition ${isActivePath('/dashboard') ? 'bg-gold/15 text-gold shadow-inner' : 'text-gray-700 hover:bg-amber-50 hover:text-gold'}`} onClick={()=>setIsMobileMenuOpen(false)}>
                    <LayoutDashboard size={16} className="opacity-80 group-hover:opacity-100" />
                    My Dashboard
                  </Link>
                  <Link to="/payments" className={`group flex items-center gap-2 px-3 py-2 rounded-md transition ${isActivePath('/payments') ? 'bg-gold/15 text-gold shadow-inner' : 'text-gray-700 hover:bg-amber-50 hover:text-gold'}`} onClick={()=>setIsMobileMenuOpen(false)}>
                    <CreditCard size={16} className="opacity-80 group-hover:opacity-100" />
                    <span className="flex-1 flex items-center gap-1">Payments {pendingPayments>0 && (<span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-semibold bg-red-500 text-white rounded-full">{pendingPayments}</span>)} {recentPaymentSuccess && (<span title={`Recent payment successful${recentPaymentSuccess.auctionId ? ' for auction '+ recentPaymentSuccess.auctionId : ''}`} className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-green-500 text-white text-[10px] animate-pulse">✓</span>)}</span>
                  </Link>
                  {user.role === 'admin' && (
                    <Link to="/admin/manage-auctions" className={`group flex items-center gap-2 px-3 py-2 rounded-md transition ${isActivePath('/admin/manage-auctions') ? 'bg-gold/15 text-gold shadow-inner' : 'text-gray-700 hover:bg-amber-50 hover:text-gold'}`} onClick={()=>setIsMobileMenuOpen(false)}>
                      <Settings size={16} className="opacity-80 group-hover:opacity-100" />
                      Manage Auctions
                    </Link>
                  )}
                  {user.role !== 'admin' && (
                    <>
                      <Link to="/payment-form" className={`group flex items-center gap-2 px-3 py-2 rounded-md transition ${isActivePath('/payment-form') ? 'bg-gold/15 text-gold shadow-inner' : 'text-gray-700 hover:bg-amber-50 hover:text-gold'}`} onClick={()=>setIsMobileMenuOpen(false)}>
                        <CreditCard size={16} className="opacity-80 group-hover:opacity-100" />
                        Pay Now
                      </Link>
                      <Link to="/create-auction" className={`group flex items-center gap-2 px-3 py-2 rounded-md transition ${isActivePath('/create-auction') ? 'bg-gold/15 text-gold shadow-inner' : 'text-gray-700 hover:bg-amber-50 hover:text-gold'}`} onClick={()=>setIsMobileMenuOpen(false)}>
                        <PlusCircle size={16} className="opacity-80 group-hover:opacity-100" />
                        Create Auction
                      </Link>
                    </>
                  )}
                </>
              )}
            </nav>
          </div>
          <style>{`@keyframes slideInMenu{0%{opacity:0;transform:translateY(-6px) scale(.98);}100%{opacity:1;transform:translateY(0) scale(1);}}`}</style>
        </div>
      )}
    </nav>
  );
};

export default Navbar;