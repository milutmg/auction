import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import BidApproval from '@/components/admin/BidApproval';
import { 
  Users, Gavel, DollarSign, TrendingUp, Activity, Shield, 
  Eye, AlertTriangle, Package, BarChart3, Clock, Star,
  ArrowUpRight, ArrowDownRight, Bell, RefreshCw, Download, 
  Calendar, Search, Filter, Settings, Plus, Minus,
  CheckCircle, X
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { socketService } from '@/services/socketService';

// Types
interface DashboardStats {
  total_users: number;
  active_auctions: number;
  pending_auctions: number;
  total_bids: number;
  revenue: number;
  daily_change: {
    users: number;
    auctions: number;
    bids: number;
    revenue: number;
  };
}

interface RecentActivity {
  id: string;
  type: 'bid' | 'auction' | 'user' | 'payment';
  title: string;
  user: string;
  amount?: number;
  time: string;
  status: 'success' | 'pending' | 'warning';
}

interface TopPerformer {
  name: string;
  category: string;
  value: number;
  change: number;
  type: 'auction' | 'user' | 'category';
}

const UserDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Redirect admin users to admin dashboard
  if (user?.role === 'admin') {
    window.location.href = '/admin';
    return null;
  }

  // State
  const [stats, setStats] = useState<DashboardStats>({
    total_users: 0,
    active_auctions: 0,
    pending_auctions: 0,
    total_bids: 0,
    revenue: 0,
    daily_change: {
      users: 0,
      auctions: 0,
      bids: 0,
      revenue: 0
    }
  });

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingAuctions, setPendingAuctions] = useState([]);
  const [myAuctions, setMyAuctions] = useState([]);
  const [myAuctionsLoading, setMyAuctionsLoading] = useState(false);
  const [myAuctionsError, setMyAuctionsError] = useState<string | null>(null);

  // Admin action handlers
  const handleExportData = async () => {
    try {
      const reports = await apiService.getAdminReports('full_export');
      // Create and download CSV/JSON file
      const blob = new Blob([JSON.stringify(reports, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `admin_report_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  };

  const handleManageUsers = () => {
    // Navigate to user management or show user management modal
    window.open('/auctions', '_blank'); // For now, open auctions page
  };

  const handleModeration = () => {
    // Navigate to moderation panel
    window.open('/auctions', '_blank'); // For now, open auctions page
  };

  const handleReports = () => {
    // Navigate to reports page
    window.open('/auctions', '_blank'); // For now, open auctions page
  };

  // Initialize dashboard data immediately (no API calls for faster loading)
  useEffect(() => {
    initializeDashboardData();
    fetchDashboardData(); // Also fetch real data
  }, []);

  // Fetch my auctions when user becomes available
  useEffect(() => {
    if (user) {
      fetchMyAuctions();
    }
  }, [user]);

  useEffect(() => {
    // Connect socket and attach activity listeners
    let isMounted = true;
    socketService.connect().then(() => {
      if (!isMounted) return;
      const addActivity = (a: any) => {
        const safeType: 'bid' | 'auction' | 'user' | 'payment' = a.type && ['bid','auction','user','payment'].includes(a.type) ? a.type : (a.amount ? 'bid' : 'auction');
        setRecentActivity(prev => [{
          id: a.id || a.bidId || a.auctionId || Date.now().toString(),
          type: safeType,
          title: a.title || (a.event === 'deleted' ? `Auction deleted: ${a.title}` : a.event === 'created' ? `New auction: ${a.title}` : (a.approval_status ? `Auction ${a.approval_status}` : 'Activity')),
          user: a.bidderName || user?.full_name || 'You',
          amount: typeof a.amount === 'number' ? a.amount : undefined,
          time: new Date().toLocaleTimeString(),
          status: a.status && ['success','pending','warning'].includes(a.status) ? a.status : (safeType === 'auction' && a.approval_status === 'pending' ? 'pending' : 'success')
        }, ...prev].slice(0, 20));
      };

      const handleAuctionCreated = (data: any) => {
        if (data.sellerId === user?.id) {
          // refresh my auctions
          fetchMyAuctions();
          addActivity({
            auctionId: data.auctionId,
            title: `Created auction: ${data.title}`,
            type: 'auction',
            status: data.approval_status === 'pending' ? 'pending' : 'success'
          });
        }
      };
      const handleAuctionDeleted = (data: any) => {
        if (data.sellerId === user?.id) {
          setMyAuctions(prev => prev.filter((a: any) => a.id !== data.auctionId));
          addActivity({
            auctionId: data.auctionId,
            title: `Deleted auction: ${data.title}`,
            type: 'auction',
            status: 'warning'
          });
        }
      };
      const handleBidApproved = (data: any) => {
        addActivity({
          bidId: data.bidId,
          auctionId: data.auctionId,
          amount: data.amount,
          bidderName: data.bidderName,
          title: `Bid approved on auction ${data.auctionId}`,
          type: 'bid',
          status: 'success'
        });
      };
      const handleBidRejected = (data: any) => {
        addActivity({
          bidId: data.bidId,
          auctionId: data.auctionId,
          amount: data.amount,
          bidderName: data.bidderName,
          title: `Bid rejected on auction ${data.auctionId}`,
          type: 'bid',
          status: 'warning'
        });
      };

      socketService.onAuctionCreated(handleAuctionCreated);
      socketService.onAuctionDeleted(handleAuctionDeleted);
      socketService.onBidApproved(handleBidApproved);
      socketService.onBidRejected(handleBidRejected);

      // cleanup
      return () => {
        socketService.offAuctionCreated(handleAuctionCreated);
        socketService.offAuctionDeleted(handleAuctionDeleted);
        socketService.offBidApproved(handleBidApproved);
        socketService.offBidRejected(handleBidRejected);
      };
    }).catch(() => {});
    return () => { isMounted = false; };
  }, [user]);

  useEffect(() => {
    const sock = socketService.getSocket();
    if (!sock) return;

    const handleApproved = (data: any) => {
      setPendingAuctions(prev => prev.filter(a => a.id !== data.auctionId));
      setRecentActivity(prev => [
        {
          id: `approved-${data.auctionId}-${Date.now()}`,
          type: 'auction',
          title: `Auction approved: ${data.title}`,
          user: 'System',
          time: 'Just now',
          created_at: new Date().toISOString(),
          status: 'success'
        } as any,
        ...prev.slice(0, 49)
      ]);
    };

    const handleRejected = (data: any) => {
      setPendingAuctions(prev => prev.filter(a => a.id !== data.auctionId));
      setRecentActivity(prev => [
        {
          id: `rejected-${data.auctionId}-${Date.now()}`,
          type: 'auction',
          title: `Auction rejected: ${data.title}`,
          user: 'System',
          time: 'Just now',
          created_at: new Date().toISOString(),
          status: 'warning'
        } as any,
        ...prev.slice(0, 49)
      ]);
    };

    sock.on('auction-approved', handleApproved);
    sock.on('auction-rejected', handleRejected);

    return () => {
      sock.off('auction-approved', handleApproved);
      sock.off('auction-rejected', handleRejected);
    };
  }, []);

  const initializeDashboardData = () => {
    // Remove mock stats; start with zeros then fetch real
    setStats(prev => ({
      total_users: 0,
      active_auctions: 0,
      pending_auctions: 0,
      total_bids: 0,
      revenue: 0,
      daily_change: prev.daily_change
    }));
    setRecentActivity([]);
    setTopPerformers([]);
    setLoading(false);
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log('Current user:', user);
      // If user is admin, keep existing admin stats path (redirect earlier anyway)
      if (user?.role === 'admin') return;

      // Fetch public stats (non-admin) plus user-specific counts
      const publicStats = await apiService.getPublicStats();

      // Optionally fetch user activity for personalized numbers
      let myActivity: any[] = [];
      try {
        const resp = await fetch(`${import.meta.env.VITE_API_URL}/auth/my-activity?limit=25`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (resp.ok) {
          myActivity = await resp.json();
          setRecentActivity(myActivity.slice(0, 15).map((a: any) => ({
            id: a.id || `${a.activity_type}-${a.created_at}`,
            type: a.activity_type === 'bid' ? 'bid' : a.activity_type === 'auction_created' ? 'auction' : 'user',
            title: `${a.action_description} ${a.auction_title || ''}`.trim(),
            user: user?.full_name || 'You',
            amount: a.amount || undefined,
            time: new Date(a.created_at).toLocaleString(),
            status: a.activity_type === 'bid' ? 'pending' : 'success'
          })));
        }
      } catch (e) { console.warn('my-activity fetch failed', e); }

      setStats(prev => ({
        ...prev,
        total_users: publicStats.total_users,
        active_auctions: publicStats.active_auctions,
        total_bids: publicStats.total_bids,
        revenue: publicStats.revenue,
        pending_auctions: pendingAuctions.length,
      }));

      // Top performers removed (or could fetch from a public endpoint later)
      setTopPerformers([]);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyAuctions = async () => {
    setMyAuctionsLoading(true);
    setMyAuctionsError(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auctions/my`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Failed to load auctions' }));
        throw new Error(err.error || 'Failed to load auctions');
      }
      const data = await response.json();
      setMyAuctions(data);
      // Track pending ones separately if needed
      setPendingAuctions(data.filter((a: any) => a.approval_status === 'pending'));
    } catch (e: any) {
      console.error('Fetch my auctions error:', e);
      setMyAuctionsError(e.message || 'Failed to load auctions');
      toast({
        title: 'Error loading auctions',
        description: e.message || 'Could not fetch your auctions',
        variant: 'destructive'
      });
    } finally {
      setMyAuctionsLoading(false);
    }
  };

  const handleApproveAuction = async (auctionId: string) => {
    try {
      const response = await fetch(`/api/admin/auction/${auctionId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ approvalStatus: 'approved' })
      });

      if (response.ok) {
        // Remove from pending list
        setPendingAuctions(prev => prev.filter((auction: any) => auction.id !== auctionId));
        // Show success message (you can add a toast here)
        console.log('Auction approved successfully');
      } else {
        console.error('Failed to approve auction');
      }
    } catch (error) {
      console.error('Error approving auction:', error);
    }
  };

  const handleDeleteAuction = async (auctionId: string) => {
    if (!confirm('Are you sure you want to delete this auction?')) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auctions/${auctionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setMyAuctions(prev => prev.filter((auction: any) => auction.id !== auctionId));
        setPendingAuctions(prev => prev.filter((auction: any) => auction.id !== auctionId));
        // Add local activity immediately
        setRecentActivity(prev => [{
          id: `delete-${auctionId}-${Date.now()}`,
          type: 'auction',
          title: 'You deleted an auction',
          user: user?.full_name || 'You',
          time: new Date().toLocaleTimeString(),
          status: 'warning'
        } as RecentActivity, ...prev].slice(0, 20));
        toast({
          title: 'Auction deleted',
            description: 'Your auction was deleted successfully.',
            duration: 4000
        });
      } else {
        const error = await response.json();
        toast({
          title: 'Delete failed',
          description: error.error || 'Failed to delete auction',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error deleting auction:', error);
      toast({
        title: 'Delete failed',
        description: 'Failed to delete auction',
        variant: 'destructive'
      });
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    color = "blue" 
  }: { 
    title: string; 
    value: string | number; 
    change: number; 
    icon: any; 
    color?: string;
  }) => {
    const isPositive = change >= 0;
    const colorClasses = {
      blue: "bg-blue-50 text-blue-700 border-blue-200",
      green: "bg-emerald-50 text-emerald-700 border-emerald-200",
      yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
      purple: "bg-purple-50 text-purple-700 border-purple-200"
    };

    return (
      <Card className="relative overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <div className="flex items-center mt-2">
                {isPositive ? (
                  <ArrowUpRight className="h-4 w-4 text-green-500" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-500" />
                )}
                <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(change)}%
                </span>
                <span className="text-sm text-gray-500 ml-1">from yesterday</span>
              </div>
            </div>
            <div className={`p-3 rounded-full ${colorClasses[color as keyof typeof colorClasses]}`}>
              <Icon className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-yellow-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <div className="flex items-center mt-2">
              <p className="text-gray-600">Welcome back, {user?.full_name || 'Admin'}</p>
              <Badge className="ml-3 bg-green-100 text-green-800">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Online
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="hover:bg-yellow-50" onClick={handleExportData}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" className="hover:bg-yellow-50">
              <Calendar className="h-4 w-4 mr-2" />
              Last 30 days
            </Button>
            <Button 
              onClick={async () => {
                console.log('Loading test data...');
                const testAuctions = [
                  {
                    id: '4',
                    title: 'Test Auction Item',
                    description: 'This is a test auction',
                    image_url: null,
                    starting_bid: '100',
                    current_bid: null,
                    category_name: 'Test',
                    status: 'pending',
                    approval_status: 'pending',
                    bid_count: 0
                  }
                ];
                setMyAuctions(testAuctions);
                setPendingAuctions(testAuctions);
              }}
              variant="outline" 
              size="sm"
              className="hover:bg-yellow-50"
            >
              Load Test Data
            </Button>
            <Button 
              onClick={fetchDashboardData} 
              variant="outline" 
              size="sm"
              className="hover:bg-yellow-50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Users"
          value={stats.total_users.toLocaleString()}
          change={stats.daily_change.users}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Active Auctions"
          value={stats.active_auctions}
          change={stats.daily_change.auctions}
          icon={Gavel}
          color="green"
        />
        <StatCard
          title="Total Bids"
          value={stats.total_bids.toLocaleString()}
          change={stats.daily_change.bids}
          icon={TrendingUp}
          color="purple"
        />
        <StatCard
          title="Revenue"
          value={`$${stats.revenue.toLocaleString()}`}
          change={stats.daily_change.revenue}
          icon={DollarSign}
          color="yellow"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Performance Overview */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl">Performance Overview</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gradient-to-br from-yellow-50 via-yellow-100 to-orange-100 rounded-lg flex items-center justify-center relative overflow-hidden">
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-4 left-4 w-16 h-16 bg-yellow-400 rounded-full"></div>
                  <div className="absolute top-12 right-8 w-8 h-8 bg-orange-400 rounded-full"></div>
                  <div className="absolute bottom-8 left-12 w-12 h-12 bg-yellow-500 rounded-full"></div>
                  <div className="absolute bottom-4 right-4 w-6 h-6 bg-orange-500 rounded-full"></div>
                </div>
                
                <div className="text-center z-10">
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg">
                    <BarChart3 className="h-16 w-16 text-yellow-600 mx-auto mb-4" />
                    <p className="text-gray-800 font-semibold">Performance Analytics</p>
                    <p className="text-sm text-gray-600 mt-2">Revenue, Bids, and User Growth</p>
                    <div className="mt-4 flex justify-center space-x-4 text-xs">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full mr-1"></div>
                        <span>Revenue</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
                        <span>Bids</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
                        <span>Users</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Top Performers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPerformers.map((performer, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-gray-50 to-white border hover:shadow-md transition-shadow">
                  <div className="flex items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-3 ${
                      index === 0 ? 'bg-yellow-100 border-2 border-yellow-300' : 
                      index === 1 ? 'bg-gray-100 border-2 border-gray-300' : 
                      'bg-orange-100 border-2 border-orange-300'
                    }`}>
                      {performer.type === 'category' && <Package className={`h-6 w-6 ${
                        index === 0 ? 'text-yellow-600' : index === 1 ? 'text-gray-600' : 'text-orange-600'
                      }`} />}
                      {performer.type === 'user' && <Users className={`h-6 w-6 ${
                        index === 0 ? 'text-yellow-600' : index === 1 ? 'text-gray-600' : 'text-orange-600'
                      }`} />}
                      {performer.type === 'auction' && <Gavel className={`h-6 w-6 ${
                        index === 0 ? 'text-yellow-600' : index === 1 ? 'text-gray-600' : 'text-orange-600'
                      }`} />}
                      {index === 0 && <Star className="h-3 w-3 text-yellow-500 absolute -mt-3 -mr-2" />}
                    </div>
                    <div>
                      <div className="flex items-center">
                        <p className="font-medium text-gray-900">{performer.name}</p>
                        {index === 0 && <Badge className="ml-2 bg-yellow-100 text-yellow-800 text-xs">TOP</Badge>}
                      </div>
                      <p className="text-sm text-gray-500">{performer.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">${performer.value.toLocaleString()}</p>
                    <div className="flex items-center justify-end">
                      {performer.change >= 0 ? (
                        <ArrowUpRight className="h-3 w-3 text-green-500" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3 text-red-500" />
                      )}
                      <span className={`text-xs font-medium ${performer.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {Math.abs(performer.change)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* My Auctions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl">My Auctions</CardTitle>
            <Badge variant="secondary">
              {myAuctionsLoading ? 'Loading...' : `${myAuctions.length} items`}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {myAuctionsLoading && (
                <div className="text-center py-8 text-sm text-gray-500">Loading your auctions...</div>
              )}
              {myAuctionsError && !myAuctionsLoading && (
                <div className="text-center py-8">
                  <p className="text-red-600 text-sm mb-2">{myAuctionsError}</p>
                  <Button size="sm" variant="outline" onClick={fetchMyAuctions}>Retry</Button>
                </div>
              )}
              {!myAuctionsLoading && !myAuctionsError && myAuctions.length === 0 && (
                <div className="text-center py-8">
                  <Gavel className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No auctions found</p>
                  <p className="text-sm text-gray-400">Your created auctions will appear here</p>
                  <div className="mt-4">
                    <Button size="sm" onClick={() => window.open('/create-auction','_blank')}>Create Auction</Button>
                  </div>
                </div>
              )}
              {!myAuctionsLoading && !myAuctionsError && myAuctions.map((auction: any) => (
                <div key={auction.id} className="flex items-center justify-between p-4 rounded-lg border hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded overflow-hidden bg-gray-100">
                      {auction.image_url ? (
                        <img
                          src={`${import.meta.env.VITE_BASE_URL}${auction.image_url}`}
                          alt={auction.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1566312581307-d6bb3f6b2311?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Gavel className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{auction.title}</p>
                      <p className="text-sm text-gray-500">{auction.category_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-green-600 font-medium">${auction.starting_bid}</p>
                        <Badge className={`text-xs ${
                          auction.approval_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          auction.status === 'active' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {auction.approval_status === 'pending' ? 'Pending' : auction.status}
                        </Badge>
                        <span className="text-xs text-gray-500">{auction.bid_count} bids</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => window.open(`/auctions/${auction.id}`, '_blank')}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="border-red-300 text-red-600 hover:bg-red-50"
                      onClick={() => handleDeleteAuction(auction.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl">Recent Activity</CardTitle>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    activity.status === 'success' ? 'bg-green-100' : 
                    activity.status === 'pending' ? 'bg-yellow-100' : 'bg-red-100'
                  }`}>
                    {activity.type === 'bid' && <TrendingUp className={`h-5 w-5 ${
                      activity.status === 'success' ? 'text-green-600' : 
                      activity.status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                    }`} />}
                    {activity.type === 'auction' && <Gavel className={`h-5 w-5 ${
                      activity.status === 'success' ? 'text-green-600' : 
                      activity.status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                    }`} />}
                    {activity.type === 'user' && <Users className={`h-5 w-5 ${
                      activity.status === 'success' ? 'text-green-600' : 
                      activity.status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                    }`} />}
                    {activity.type === 'payment' && <DollarSign className={`h-5 w-5 ${
                      activity.status === 'success' ? 'text-green-600' : 
                      activity.status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                    }`} />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{activity.title}</p>
                    <p className="text-sm text-gray-500">by {activity.user}</p>
                  </div>
                  <div className="text-right">
                    {activity.amount && (
                      <p className="font-medium text-gray-900">${activity.amount}</p>
                    )}
                    <p className="text-sm text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions & System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Quick Actions & System</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Quick Actions */}
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-3">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  className="bg-yellow-600 hover:bg-yellow-700 text-white"
                  onClick={() => window.open('/create-auction', '_blank')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Auction
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleManageUsers}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Manage Users
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleModeration}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Moderation
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleReports}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Reports
                </Button>
              </div>
            </div>

            {/* System Status */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">System Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Database</span>
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Online
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Active Sessions</span>
                  <span className="text-sm font-medium">142</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Server Load</span>
                  <span className="text-sm font-medium">68%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Recent Errors</span>
                  <Badge variant="outline" className="text-yellow-600 border-yellow-200">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    2
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications */}
      <div className="fixed bottom-6 right-6">
        <Button 
          size="lg" 
          className="bg-yellow-600 hover:bg-yellow-700 text-white rounded-full shadow-lg"
        >
          <Bell className="h-5 w-5" />
          <Badge className="ml-2 bg-red-500 text-white">3</Badge>
        </Button>
      </div>
    </div>
  );
};

export default UserDashboard;
