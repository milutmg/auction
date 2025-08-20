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
  CheckCircle, X, FileText, Printer, SlidersHorizontal
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
  // created_at?: string; // normalized away; using time instead
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
  const [showAllActivity, setShowAllActivity] = useState(false); // Added for View All toggle
  const [reportRange, setReportRange] = useState<'7d'|'30d'|'90d'>('30d');
  const [lastExportAt, setLastExportAt] = useState<Date | null>(null);
  const [performanceRange, setPerformanceRange] = useState<'7d'|'30d'|'90d'>('30d');
  const [performanceData, setPerformanceData] = useState<Array<{ date: string; revenue: number; bids: number; users: number }>>([]);
  const [activeSeries, setActiveSeries] = useState<{ revenue: boolean; bids: boolean; users: boolean }>({ revenue: true, bids: true, users: true });
  const [hoverPoint, setHoverPoint] = useState<any>(null);
  const [chartType, setChartType] = useState<'line'|'area'>('line');

  // Reports enhancements state
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [reportLoading, setReportLoading] = useState(false);
  const [reportMetrics, setReportMetrics] = useState<{activity:boolean; auctions:boolean; bids:boolean; revenue:boolean}>({activity:true, auctions:true, bids:true, revenue:true});
  const [filteredType, setFilteredType] = useState<'all'|'bid'|'auction'|'user'|'payment'>('all');
  const [reportSeries, setReportSeries] = useState<Array<{ label:string; values:number[] }>>([]);

  // Admin action handlers
  const handleExportData = async () => {
    try {
      const reports = await apiService.getAdminReports(`full_export?range=${reportRange}`);
      const blob = new Blob([JSON.stringify(reports, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report_${reportRange}_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setLastExportAt(new Date());
      toast({ title: 'Export complete', description: 'JSON export downloaded.' });
    } catch (error) {
      console.error('Failed to export data:', error);
      toast({ title: 'Export failed', description: 'Could not export data', variant: 'destructive' });
    }
  };

  const handleExportCSV = async () => {
    try {
      const data = await apiService.getAdminReports(`activity?range=${reportRange}`);
      const rows = Array.isArray(data) ? data : (data.items || []);
      if (!rows.length) {
        toast({ title: 'No data', description: 'Nothing to export for selected range' });
        return;
      }
      const headers = Object.keys(rows[0]);
      const csv = [headers.join(','), ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `activity_${reportRange}.csv`; a.click();
      URL.revokeObjectURL(url);
      setLastExportAt(new Date());
      toast({ title: 'CSV ready', description: 'Activity CSV downloaded.' });
    } catch (e) {
      console.error(e);
      toast({ title: 'CSV export failed', description: 'Try again later', variant: 'destructive' });
    }
  };

  const handleGeneratePDF = () => {
    // Simple print-based PDF generation placeholder
    toast({ title: 'Generating PDF', description: 'Use browser print dialog to save.' });
    setTimeout(() => window.print(), 400);
  };

  const handleReports = () => {
    window.open('/reports', '_blank');
  };

  const handleScheduleReport = () => {
    toast({ title: 'Scheduled (demo)', description: `Weekly report for range ${reportRange} scheduled.` });
  };

  const toggleReportMetric = (key: keyof typeof reportMetrics) => {
    setReportMetrics(m => ({...m, [key]: !m[key]}));
  };

  const fetchDynamicReportData = async () => {
    setReportLoading(true);
    try {
      // simulate API aggregation
      await new Promise(r => setTimeout(r, 500));
      const days = reportRange === '7d' ? 7 : reportRange === '30d' ? 30 : 90;
      const mk = (base:number) => Array.from({length: days}, (_,i)=> Math.max(0, Math.round(base * (0.9 + Math.random()*0.2))));
      const series: Array<{label:string; values:number[]}> = [];
      if (reportMetrics.activity) series.push({ label: 'Activity', values: mk(recentActivity.length / Math.max(1, days/4)) });
      if (reportMetrics.auctions) series.push({ label: 'Auctions', values: mk(myAuctions.length || 5) });
      if (reportMetrics.bids) series.push({ label: 'Bids', values: mk(stats.total_bids / Math.max(1, days/3)) });
      if (reportMetrics.revenue) series.push({ label: 'Revenue', values: mk((stats.revenue||1000) / Math.max(1, days/2)) });
      setReportSeries(series);
    } catch (e) {
      console.error(e);
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    fetchDynamicReportData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportRange, reportMetrics.activity, reportMetrics.auctions, reportMetrics.bids, reportMetrics.revenue, recentActivity.length, myAuctions.length, stats.total_bids, stats.revenue]);

  // Generate synthetic performance trend data (placeholder until real API endpoint)
  useEffect(() => {
    const days = performanceRange === '7d' ? 7 : performanceRange === '30d' ? 30 : 90;
    const today = new Date();
    const baseRev = stats.revenue || 1000;
    const baseBids = stats.total_bids || 200;
    const baseUsers = stats.total_users || 50;
    const newData: any[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 86400000);
      const factor = 1 + Math.sin(i / 3) * 0.05 + (Math.random() - 0.5) * 0.08;
      newData.push({
        date: d.toISOString().split('T')[0].slice(5),
        revenue: Math.max(0, Math.round((baseRev / days) * factor)),
        bids: Math.max(0, Math.round((baseBids / days) * (factor + 0.05))),
        users: Math.max(0, Math.round((baseUsers / days) * (factor + 0.02)))
      });
    }
    setPerformanceData(newData);
  }, [performanceRange, stats.revenue, stats.total_bids, stats.total_users]);

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

  useEffect(() => {
    const sock = socketService.getSocket();
    if (!sock) return;
    const payReq = (d:any) => {
      if (user && d.userId === user.id) {
        const activity: RecentActivity = {
          id: `payreq-${d.auctionId}`,
          type: 'payment',
          title: `Payment required for ${d.title}`,
          user: user.full_name || 'You',
          amount: d.amount,
          time: new Date().toLocaleTimeString(),
          status: 'pending'
        };
        setRecentActivity(prev => [activity, ...prev].slice(0,20));
      }
    };
    const payComp = (d:any) => {
      if (user && d.userId === user.id) {
        const activity: RecentActivity = {
          id: `paycomp-${d.auctionId}`,
          type: 'payment',
          title: `Payment completed for ${d.auctionId}`,
          user: user.full_name || 'You',
          amount: d.amount,
          time: new Date().toLocaleTimeString(),
          status: 'success'
        };
        setRecentActivity(prev => [activity, ...prev].slice(0,20));
      }
    };
    sock.on('payment-required', payReq);
    sock.on('payment-completed', payComp);
    return () => { sock.off('payment-required', payReq); sock.off('payment-completed', payComp); };
  }, [user]);

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
              <CardTitle className="text-xl flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-yellow-600" /> Performance Overview
              </CardTitle>
              <div className="flex items-center gap-2">
                <select
                  value={performanceRange}
                  onChange={e => setPerformanceRange(e.target.value as any)}
                  className="text-sm border rounded px-2 py-1 bg-white"
                >
                  <option value="7d">7d</option>
                  <option value="30d">30d</option>
                  <option value="90d">90d</option>
                </select>
                <Button variant="outline" size="sm" onClick={() => setChartType(t => t==='line'?'area':'line')}>
                  {chartType === 'line' ? 'Area' : 'Line'}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPerformanceData(p => [...p])}>
                  <RefreshCw className="h-4 w-4 mr-1" /> Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-4 text-xs">
                  <button onClick={() => setActiveSeries(s => ({ ...s, revenue: !s.revenue }))} className={`flex items-center gap-1 px-2 py-1 rounded border ${activeSeries.revenue ? 'bg-yellow-100 border-yellow-300' : 'opacity-40'}`}>
                    <span className="w-3 h-3 rounded-full bg-yellow-500"></span> Revenue
                  </button>
                  <button onClick={() => setActiveSeries(s => ({ ...s, bids: !s.bids }))} className={`flex items-center gap-1 px-2 py-1 rounded border ${activeSeries.bids ? 'bg-blue-100 border-blue-300' : 'opacity-40'}`}>
                    <span className="w-3 h-3 rounded-full bg-blue-500"></span> Bids
                  </button>
                  <button onClick={() => setActiveSeries(s => ({ ...s, users: !s.users }))} className={`flex items-center gap-1 px-2 py-1 rounded border ${activeSeries.users ? 'bg-green-100 border-green-300' : 'opacity-40'}`}>
                    <span className="w-3 h-3 rounded-full bg-green-500"></span> Users
                  </button>
                </div>
                <div className="relative">
                  <svg
                    viewBox="0 0 400 180"
                    className="w-full h-72 bg-gradient-to-br from-yellow-50 via-yellow-100 to-orange-100 rounded-lg border"
                    onMouseLeave={() => setHoverPoint(null)}
                  >
                    {/* Horizontal grid */}
                    {Array.from({ length: 6 }).map((_, i) => (
                      <line key={i} x1={0} x2={400} y1={i * 30} y2={i * 30} stroke="#ffffff33" strokeWidth={1} />
                    ))}
                    {(['revenue','bids','users'] as const).map(series => {
                      if (!activeSeries[series]) return null;
                      const color = series === 'revenue' ? '#eab308' : series === 'bids' ? '#3b82f6' : '#10b981';
                      const maxVal = Math.max(...performanceData.map(d => d[series]), 1);
                      // Build smooth path
                      const pts = performanceData.map((d, idx) => {
                        const x = (idx / Math.max(1, performanceData.length - 1)) * 380 + 10;
                        const y = 170 - (d[series] / maxVal) * 140;
                        return { x, y, raw: d };
                      });
                      if (!pts.length) return null;
                      const dPath = pts.map((p,i) => {
                        if (i===0) return `M ${p.x} ${p.y}`;
                        const prev = pts[i-1];
                        const cx = (prev.x + p.x)/2;
                        return `Q ${prev.x} ${prev.y} ${cx} ${ (prev.y + p.y)/2 } T ${p.x} ${p.y}`;
                      }).join(' ');
                      const areaPath = chartType==='area' ? dPath + ` L ${pts[pts.length-1].x} 170 L ${pts[0].x} 170 Z` : null;
                      return (
                        <g key={series}>
                          {chartType==='area' && <path d={areaPath!} fill={color+ '33'} stroke="none" />}
                          <path d={dPath} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />
                          {pts.map((p,i)=>(<circle key={i} cx={p.x} cy={p.y} r={3} fill={color} stroke="#fff" strokeWidth={1} onMouseEnter={()=> setHoverPoint({ ...p.raw, idx:i, x:p.x, series })} />))}
                        </g>
                      );
                    })}
                    {/* hover vertical line */}
                    {hoverPoint && (
                      <line x1={hoverPoint.x} x2={hoverPoint.x} y1={0} y2={180} stroke="#00000022" />
                    )}
                  </svg>
                  {hoverPoint && (
                    <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded shadow px-3 py-2 text-xs space-y-1">
                      <div className="font-medium">{hoverPoint.date}</div>
                      {activeSeries.revenue && <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-yellow-500"></span>Rev: {hoverPoint.revenue} {hoverPoint.idx>0 && <span className={ (performanceData[hoverPoint.idx].revenue - performanceData[hoverPoint.idx-1].revenue)>=0? 'text-green-600':'text-red-600'}>({(performanceData[hoverPoint.idx].revenue - performanceData[hoverPoint.idx-1].revenue)>=0?'+':''}{performanceData[hoverPoint.idx].revenue - performanceData[hoverPoint.idx-1].revenue})</span>}</div>}
                      {activeSeries.bids && <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500"></span>Bids: {hoverPoint.bids} {hoverPoint.idx>0 && <span className={ (performanceData[hoverPoint.idx].bids - performanceData[hoverPoint.idx-1].bids)>=0? 'text-green-600':'text-red-600'}>({(performanceData[hoverPoint.idx].bids - performanceData[hoverPoint.idx-1].bids)>=0?'+':''}{performanceData[hoverPoint.idx].bids - performanceData[hoverPoint.idx-1].bids})</span>}</div>}
                      {activeSeries.users && <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500"></span>Users: {hoverPoint.users} {hoverPoint.idx>0 && <span className={ (performanceData[hoverPoint.idx].users - performanceData[hoverPoint.idx-1].users)>=0? 'text-green-600':'text-red-600'}>({(performanceData[hoverPoint.idx].users - performanceData[hoverPoint.idx-1].users)>=0?'+':''}{performanceData[hoverPoint.idx].users - performanceData[hoverPoint.idx-1].users})</span>}</div>}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-4 text-center text-xs">
                  <div className="p-3 bg-white rounded border">
                    <p className="text-gray-500">Avg Rev / day</p>
                    <p className="font-semibold">{performanceData.length ? Math.round(performanceData.reduce((a,c)=>a+c.revenue,0)/performanceData.length) : 0}</p>
                  </div>
                  <div className="p-3 bg-white rounded border">
                    <p className="text-gray-500">Avg Bids / day</p>
                    <p className="font-semibold">{performanceData.length ? Math.round(performanceData.reduce((a,c)=>a+c.bids,0)/performanceData.length) : 0}</p>
                  </div>
                  <div className="p-3 bg-white rounded border">
                    <p className="text-gray-500">Avg Users / day</p>
                    <p className="font-semibold">{performanceData.length ? Math.round(performanceData.reduce((a,c)=>a+c.users,0)/performanceData.length) : 0}</p>
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
            <Button variant="outline" size="sm" onClick={() => setShowAllActivity(prev => !prev)}>
              {showAllActivity ? 'Show Less' : 'View All'}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length === 0 && (
                <div className="text-sm text-gray-500 p-3">No recent activity yet.</div>
              )}
              {(showAllActivity ? recentActivity : recentActivity.slice(0, 6)).map((activity) => (
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
        {/* Removed for user dashboard as per request */}
      </div>

      {/* Reports Card (replaces removed Quick Actions & System) */}
      <div className="mt-6 grid grid-cols-1">
        <Card>
          <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl flex items-center gap-2"><SlidersHorizontal className="h-5 w-5 text-yellow-600" /> Dynamic Reports</CardTitle>
              {reportLoading && <RefreshCw className="h-4 w-4 animate-spin text-yellow-600" />}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={reportRange}
                onChange={e => setReportRange(e.target.value as any)}
                className="text-sm border rounded px-2 py-1 bg-white"
              >
                <option value="7d">7d</option>
                <option value="30d">30d</option>
                <option value="90d">90d</option>
              </select>
              <input type="date" value={customStart} onChange={e=>setCustomStart(e.target.value)} className="text-sm border rounded px-2 py-1" />
              <span className="text-xs text-gray-400">to</span>
              <input type="date" value={customEnd} onChange={e=>setCustomEnd(e.target.value)} className="text-sm border rounded px-2 py-1" />
              <select value={filteredType} onChange={e=>setFilteredType(e.target.value as any)} className="text-sm border rounded px-2 py-1">
                <option value="all">All Types</option>
                <option value="bid">Bids</option>
                <option value="auction">Auctions</option>
                <option value="user">Users</option>
                <option value="payment">Payments</option>
              </select>
              <Button variant="outline" size="sm" onClick={fetchDynamicReportData}>Run</Button>
              <Button variant="outline" size="sm" onClick={handleReports}>Open</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-4 text-xs">
              {(['activity','auctions','bids','revenue'] as const).map(k => (
                <button key={k} onClick={()=>toggleReportMetric(k)} className={`px-2 py-1 rounded border ${reportMetrics[k]? 'bg-yellow-100 border-yellow-300':'opacity-40 border-gray-300'}`}>{k}</button>
              ))}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
              {reportSeries.map(s => {
                const total = s.values.reduce((a,c)=>a+c,0);
                const avg = Math.round(total / Math.max(1, s.values.length));
                return (
                  <div key={s.label} className="p-3 bg-white rounded border text-center">
                    <p className="text-xs text-gray-500 mb-1 flex items-center justify-center gap-1">{s.label}<span className="text-[10px] text-gray-400">avg</span></p>
                    <p className="font-semibold text-gray-900 mb-1">{avg}</p>
                    {/* sparkline */}
                    <svg viewBox="0 0 120 30" className="w-full h-6 text-yellow-600">
                      {s.values.length>1 && (
                        <polyline
                          fill="none"
                          stroke="#eab308"
                          strokeWidth="2"
                          points={s.values.map((v,i)=>{
                            const x = (i/(s.values.length-1))*118+1;
                            const max = Math.max(...s.values,1);
                            const y = 28 - (v/max)*24;
                            return `${x},${y}`;
                          }).join(' ')}
                        />
                      )}
                    </svg>
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-3 mb-4">
              <Button variant="outline" size="sm" onClick={handleExportData}>
                <Download className="h-4 w-4 mr-1" /> JSON
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportCSV}>
                <FileText className="h-4 w-4 mr-1" /> CSV
              </Button>
              <Button variant="outline" size="sm" onClick={handleGeneratePDF}>
                <Printer className="h-4 w-4 mr-1" /> PDF
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowAllActivity(true)}>Full Activity</Button>
              <Button variant="outline" size="sm" onClick={handleScheduleReport}>Schedule</Button>
            </div>
            <div className="text-xs text-gray-500 flex flex-wrap gap-4 mb-4">
              <span>Preset: {reportRange}</span>
              {customStart && <span>From: {customStart}</span>}
              {customEnd && <span>To: {customEnd}</span>}
              {lastExportAt && <span>Last export: {lastExportAt.toLocaleTimeString()}</span>}
            </div>
            <div className="text-xs text-gray-400">Filtered Activity Count: {recentActivity.filter(a => filteredType==='all' || a.type===filteredType).length}</div>
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
