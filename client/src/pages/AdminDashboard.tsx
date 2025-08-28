import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import BidApproval from '@/components/admin/BidApproval';
import {
  Users, Gavel, DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight,
  BarChart3, RefreshCw, Download, Calendar, Package, Star, Bell,
  AlertTriangle
} from 'lucide-react';
import { apiService } from '@/services/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

const AdminDashboard = () => {
  const { user } = useAuth();

  // State (real data)
  const [stats, setStats] = useState<DashboardStats>({
    total_users: 0,
    active_auctions: 0,
    pending_auctions: 0,
    total_bids: 0,
    revenue: 0,
    daily_change: { users: 0, auctions: 0, bids: 0, revenue: 0 }
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);
  const [loading, setLoading] = useState(true);

  // Performance overview state (built from activity)
  const [performanceRange, setPerformanceRange] = useState<'7d'|'30d'|'90d'>('30d');
  const [performanceData, setPerformanceData] = useState<Array<{ date: string; revenue: number; bids: number; users: number }>>([]);
  const [activeSeries, setActiveSeries] = useState<{ revenue: boolean; bids: boolean; users: boolean }>({ revenue: true, bids: true, users: true });
  const [hoverPoint, setHoverPoint] = useState<any>(null);
  const [chartType, setChartType] = useState<'line'|'area'>('line');

  // Reports & Moderation state (new feature)
  const [reports, setReports] = useState<any[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);

  const rangeDays = useMemo(() => performanceRange === '7d' ? 7 : performanceRange === '30d' ? 30 : 90, [performanceRange]);

  const buildPerformanceFromActivity = useMemo(() => {
    return (activities: RecentActivity[], days: number) => {
      // Build date buckets for last N days
      const now = new Date();
      const buckets: Record<string, { revenue: number; bids: number; users: number }> = {};
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 86400000);
        const key = d.toISOString().split('T')[0];
        buckets[key] = { revenue: 0, bids: 0, users: 0 };
      }
      activities.forEach(a => {
        // Normalize to day key
        const dt = new Date(a.time);
        const key = new Date(Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate())).toISOString().split('T')[0];
        if (!(key in buckets)) return; // out of range
        if (a.type === 'payment') buckets[key].revenue += typeof a.amount === 'number' ? a.amount : 0;
        if (a.type === 'bid') buckets[key].bids += 1;
        if (a.type === 'user') buckets[key].users += 1;
      });
      const points = Object.entries(buckets).map(([key, v]) => ({
        date: key.slice(5),
        revenue: Math.round(v.revenue),
        bids: v.bids,
        users: v.users
      }));
      return points;
    };
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const [s, act, perf] = await Promise.all([
        apiService.getAdminStats(),
        apiService.getAdminActivity(1, 50),
        apiService.getTopPerformers()
      ]);

      setStats(s);

      // Map activity to UI shape
      const mapped: RecentActivity[] = (act?.data || act || []).map((a: any) => ({
        id: String(a.id),
        type: (a.type === 'bid' || a.type === 'auction' || a.type === 'user' || a.type === 'payment') ? a.type : 'auction',
        title: a.title || 'Activity',
        user: a.user_name || 'User',
        amount: typeof a.amount === 'number' ? a.amount : (a.amount ? Number(a.amount) : undefined),
        time: a.created_at || new Date().toISOString(),
        status: a.type === 'payment' ? 'success' : a.type === 'auction' ? 'pending' : 'success'
      }));
      setRecentActivity(mapped.slice(0, 50));

      // Top performers
      setTopPerformers(Array.isArray(perf) ? perf : []);

      // Build performance series from activity
      setPerformanceData(buildPerformanceFromActivity(mapped, rangeDays));
    } catch (e) {
      console.error('Failed to load admin dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      setReportsLoading(true);
      const data = await apiService.get('/admin/reports');
      setReports(Array.isArray(data) ? data.slice(0, 8) : (data?.data || []).slice(0, 8));
    } catch (e) {
      console.error('Failed to load reports:', e);
    } finally {
      setReportsLoading(false);
    }
  };

  const updateReportStatus = async (id: string, status: 'investigating'|'resolved'|'dismissed') => {
    try {
      await apiService.post(`/admin/reports/${id}/status`, { status });
      setReports(prev => prev.map((r: any) => r.id === id ? { ...r, status, resolved_at: (status==='resolved'||status==='dismissed') ? new Date().toISOString() : r.resolved_at } : r));
    } catch (e) {
      console.error('Failed to update report status:', e);
    }
  };

  // Load initial data
  useEffect(() => {
    fetchDashboard();
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When range changes, refetch more activity and rebuild chart to ensure visible change
  useEffect(() => {
    let cancelled = false;
    const loadForRange = async () => {
      try {
        const perPage = performanceRange === '7d' ? 120 : performanceRange === '30d' ? 400 : 800;
        const act = await apiService.getAdminActivity(1, perPage);
        const mapped: RecentActivity[] = (act?.data || act || []).map((a: any) => ({
          id: String(a.id),
          type: (a.type === 'bid' || a.type === 'auction' || a.type === 'user' || a.type === 'payment') ? a.type : 'auction',
          title: a.title || 'Activity',
          user: a.user_name || 'User',
          amount: typeof a.amount === 'number' ? a.amount : (a.amount ? Number(a.amount) : undefined),
          time: a.created_at || new Date().toISOString(),
          status: a.type === 'payment' ? 'success' : a.type === 'auction' ? 'pending' : 'success'
        }));
        if (cancelled) return;
        setRecentActivity(mapped.slice(0, 100));
        setPerformanceData(buildPerformanceFromActivity(mapped, rangeDays));
      } catch (e) {
        console.error('Failed to refresh performance for range:', e);
        // Still rebuild with what we have so UI updates
        setPerformanceData(buildPerformanceFromActivity(recentActivity, rangeDays));
      }
    };
    loadForRange();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [performanceRange]);

  const StatCard = ({ 
    title, value, change, icon: Icon, color = 'blue'
  }: { title: string; value: string | number; change: number; icon: any; color?: string; }) => {
    const isPositive = change >= 0;
    const colorClasses = {
      blue: 'bg-blue-50 text-blue-700 border-blue-200',
      green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      purple: 'bg-purple-50 text-purple-700 border-purple-200'
    } as const;

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
            <Button 
              variant="outline" size="sm" className="hover:bg-yellow-50"
              onClick={async () => {
                try {
                  const reports = await apiService.getAdminReports('full_export?range='+performanceRange);
                  const blob = new Blob([JSON.stringify(reports, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a'); a.href = url; a.download = `admin_report_${performanceRange}.json`; a.click();
                  URL.revokeObjectURL(url);
                } catch (e) { console.error('Export failed', e); }
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" className="hover:bg-yellow-50">
              <Calendar className="h-4 w-4 mr-2" />
              Last {performanceRange.replace('d',' days')}
            </Button>
            <Button onClick={() => { fetchDashboard(); fetchReports(); }} variant="outline" size="sm" className="hover:bg-yellow-50">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Bid Approval Section - keep functionality, update placement/style */}
      <div className="mb-8">
        <BidApproval />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Users" value={stats.total_users.toLocaleString()} change={stats.daily_change.users} icon={Users} color="blue" />
        <StatCard title="Active Auctions" value={stats.active_auctions} change={stats.daily_change.auctions} icon={Gavel} color="green" />
        <StatCard title="Total Bids" value={stats.total_bids.toLocaleString()} change={stats.daily_change.bids} icon={TrendingUp} color="purple" />
        <StatCard title="Revenue" value={`$${stats.revenue.toLocaleString()}`} change={stats.daily_change.revenue} icon={DollarSign} color="yellow" />
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
                {/* Compact time range dropdown to match design */}
                <div className="w-24">
                  <Select value={performanceRange} onValueChange={(v) => {
                    // instant preview using existing activity
                    const days = v === '7d' ? 7 : v === '30d' ? 30 : 90;
                    setPerformanceRange(v as any);
                    setPerformanceData(buildPerformanceFromActivity(recentActivity, days));
                  }}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="30d" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7d">7d</SelectItem>
                      <SelectItem value="30d">30d</SelectItem>
                      <SelectItem value="90d">90d</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" size="sm" onClick={() => setChartType((t) => (t === 'line' ? 'area' : 'line'))}>
                  {chartType === 'line' ? 'Area' : 'Line'}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPerformanceData((p) => [...p])}>
                  <RefreshCw className="h-4 w-4 mr-1" /> Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-4 text-xs">
                  <button onClick={() => setActiveSeries((s) => ({ ...s, revenue: !s.revenue }))} className={`flex items-center gap-1 px-2 py-1 rounded border ${activeSeries.revenue ? 'bg-yellow-100 border-yellow-300' : 'opacity-40'}`}>
                    <span className="w-3 h-3 rounded-full bg-yellow-500"></span> Revenue
                  </button>
                  <button onClick={() => setActiveSeries((s) => ({ ...s, bids: !s.bids }))} className={`flex items-center gap-1 px-2 py-1 rounded border ${activeSeries.bids ? 'bg-blue-100 border-blue-300' : 'opacity-40'}`}>
                    <span className="w-3 h-3 rounded-full bg-blue-500"></span> Bids
                  </button>
                  <button onClick={() => setActiveSeries((s) => ({ ...s, users: !s.users }))} className={`flex items-center gap-1 px-2 py-1 rounded border ${activeSeries.users ? 'bg-green-100 border-green-300' : 'opacity-40'}`}>
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
                    {(['revenue', 'bids', 'users'] as const).map((series) => {
                      if (!activeSeries[series]) return null;
                      const color = series === 'revenue' ? '#eab308' : series === 'bids' ? '#3b82f6' : '#10b981';
                      const maxVal = Math.max(...performanceData.map((d) => d[series]), 1);
                      const pts = performanceData.map((d, idx) => {
                        const x = (idx / Math.max(1, performanceData.length - 1)) * 380 + 10;
                        const y = 170 - (d[series] / maxVal) * 140;
                        return { x, y, raw: d };
                      });
                      if (!pts.length) return null;
                      const dPath = pts
                        .map((p, i) => {
                          if (i === 0) return `M ${p.x} ${p.y}`;
                          const prev = pts[i - 1];
                          const cx = (prev.x + p.x) / 2;
                          return `Q ${prev.x} ${prev.y} ${cx} ${(prev.y + p.y) / 2} T ${p.x} ${p.y}`;
                        })
                        .join(' ');
                      const areaPath = chartType === 'area' ? dPath + ` L ${pts[pts.length - 1].x} 170 L ${pts[0].x} 170 Z` : null;
                      return (
                        <g key={series}>
                          {chartType === 'area' && <path d={areaPath!} fill={color + '33'} stroke="none" />}
                          <path d={dPath} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />
                          {pts.map((p, i) => (
                            <circle
                              key={i}
                              cx={p.x}
                              cy={p.y}
                              r={3}
                              fill={color}
                              stroke="#fff"
                              strokeWidth={1}
                              onMouseEnter={() => setHoverPoint({ ...p.raw, idx: i, x: p.x, series })}
                            />
                          ))}
                        </g>
                      );
                    })}
                    {hoverPoint && <line x1={hoverPoint.x} x2={hoverPoint.x} y1={0} y2={180} stroke="#00000022" />}
                  </svg>
                  {hoverPoint && (
                    <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded shadow px-3 py-2 text-xs space-y-1">
                      <div className="font-medium">{hoverPoint.date}</div>
                      {activeSeries.revenue && (
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-yellow-500"></span>Rev: {hoverPoint.revenue}{' '}
                          {hoverPoint.idx > 0 && (
                            <span
                              className={
                                performanceData[hoverPoint.idx].revenue - performanceData[hoverPoint.idx - 1].revenue >= 0
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              }
                            >
                              (
                              {performanceData[hoverPoint.idx].revenue - performanceData[hoverPoint.idx - 1].revenue >= 0 ? '+' : ''}
                              {performanceData[hoverPoint.idx].revenue - performanceData[hoverPoint.idx - 1].revenue})
                            </span>
                          )}
                        </div>
                      )}
                      {activeSeries.bids && (
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-500"></span>Bids: {hoverPoint.bids}{' '}
                          {hoverPoint.idx > 0 && (
                            <span
                              className={
                                performanceData[hoverPoint.idx].bids - performanceData[hoverPoint.idx - 1].bids >= 0
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              }
                            >
                              (
                              {performanceData[hoverPoint.idx].bids - performanceData[hoverPoint.idx - 1].bids >= 0 ? '+' : ''}
                              {performanceData[hoverPoint.idx].bids - performanceData[hoverPoint.idx - 1].bids})
                            </span>
                          )}
                        </div>
                      )}
                      {activeSeries.users && (
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-500"></span>Users: {hoverPoint.users}{' '}
                          {hoverPoint.idx > 0 && (
                            <span
                              className={
                                performanceData[hoverPoint.idx].users - performanceData[hoverPoint.idx - 1].users >= 0
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              }
                            >
                              (
                              {performanceData[hoverPoint.idx].users - performanceData[hoverPoint.idx - 1].users >= 0 ? '+' : ''}
                              {performanceData[hoverPoint.idx].users - performanceData[hoverPoint.idx - 1].users})
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-4 text-center text-xs">
                  <div className="p-3 bg-white rounded border">
                    <p className="text-gray-500">Avg Rev / day</p>
                    <p className="font-semibold">{performanceData.length ? Math.round(performanceData.reduce((a, c) => a + c.revenue, 0) / performanceData.length) : 0}</p>
                  </div>
                  <div className="p-3 bg-white rounded border">
                    <p className="text-gray-500">Avg Bids / day</p>
                    <p className="font-semibold">{performanceData.length ? Math.round(performanceData.reduce((a, c) => a + c.bids, 0) / performanceData.length) : 0}</p>
                  </div>
                  <div className="p-3 bg-white rounded border">
                    <p className="text-gray-500">Avg Users / day</p>
                    <p className="font-semibold">{performanceData.length ? Math.round(performanceData.reduce((a, c) => a + c.users, 0) / performanceData.length) : 0}</p>
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
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center mr-3 ${
                        index === 0
                          ? 'bg-yellow-100 border-2 border-yellow-300'
                          : index === 1
                          ? 'bg-gray-100 border-2 border-gray-300'
                          : 'bg-orange-100 border-2 border-orange-300'
                      }`}
                    >
                      {performer.type === 'category' && (
                        <Package className={`h-6 w-6 ${index === 0 ? 'text-yellow-600' : index === 1 ? 'text-gray-600' : 'text-orange-600'}`} />
                      )}
                      {performer.type === 'user' && (
                        <Users className={`h-6 w-6 ${index === 0 ? 'text-yellow-600' : index === 1 ? 'text-gray-600' : 'text-orange-600'}`} />
                      )}
                      {performer.type === 'auction' && (
                        <Gavel className={`h-6 w-6 ${index === 0 ? 'text-yellow-600' : index === 1 ? 'text-gray-600' : 'text-orange-600'}`} />
                      )}
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
              {topPerformers.length === 0 && (
                <div className="text-sm text-gray-500">No performers to display.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl">Recent Activity</CardTitle>
            <Button variant="outline" size="sm" onClick={() => setRecentActivity((r) => r)}>View All</Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-auto pr-1">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      activity.status === 'success' ? 'bg-green-100' : activity.status === 'pending' ? 'bg-yellow-100' : 'bg-red-100'
                    }`}
                  >
                    {activity.type === 'bid' && (
                      <TrendingUp
                        className={`h-5 w-5 ${
                          activity.status === 'success' ? 'text-green-600' : activity.status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                        }`}
                      />
                    )}
                    {activity.type === 'auction' && (
                      <Gavel
                        className={`h-5 w-5 ${
                          activity.status === 'success' ? 'text-green-600' : activity.status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                        }`}
                      />
                    )}
                    {activity.type === 'user' && (
                      <Users
                        className={`h-5 w-5 ${
                          activity.status === 'success' ? 'text-green-600' : activity.status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                        }`}
                      />
                    )}
                    {activity.type === 'payment' && (
                      <DollarSign
                        className={`h-5 w-5 ${
                          activity.status === 'success' ? 'text-green-600' : activity.status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                        }`}
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{activity.title}</p>
                    <p className="text-sm text-gray-500">by {activity.user}</p>
                  </div>
                  <div className="text-right">
                    {activity.amount && <p className="font-medium text-gray-900">${activity.amount}</p>}
                    <p className="text-sm text-gray-500">{new Date(activity.time).toLocaleString()}</p>
                  </div>
                </div>
              ))}
              {recentActivity.length === 0 && (
                <div className="text-sm text-gray-500">No recent activity.</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Reports & Moderation (replaces Quick Actions & System Status) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl">Reports & Moderation</CardTitle>
            <Button variant="outline" size="sm" onClick={fetchReports}>Reload</Button>
          </CardHeader>
          <CardContent>
            {reportsLoading ? (
              <div className="text-center py-6 text-sm text-gray-500">Loading reports...</div>
            ) : (
              <div className="space-y-3">
                {reports.map((r: any) => (
                  <div key={r.id} className="p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">{r.title || 'User Report'}</p>
                          <Badge variant="outline" className={`${r.status==='resolved' ? 'text-green-700 border-green-200 bg-green-50' : r.status==='dismissed' ? 'text-gray-700 border-gray-200 bg-gray-50' : 'text-yellow-700 border-yellow-200 bg-yellow-50'}`}>{r.status || 'pending'}</Badge>
                        </div>
                        <p className="text-sm text-gray-600">{r.message || r.description || 'Reported content'}</p>
                        <div className="text-xs text-gray-500 mt-1">
                          {r.auction_title ? <>Auction: <span className="font-medium">{r.auction_title}</span></> : null}
                          {r.reporter_name ? <span className="ml-2">by {r.reporter_name}</span> : null}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {r.status !== 'investigating' && r.status !== 'resolved' && (
                          <Button size="sm" variant="outline" onClick={() => updateReportStatus(String(r.id), 'investigating')}>Investigate</Button>
                        )}
                        {r.status !== 'resolved' && (
                          <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => updateReportStatus(String(r.id), 'resolved')}>
                            Resolve
                          </Button>
                        )}
                        {r.status !== 'dismissed' && (
                          <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" onClick={() => updateReportStatus(String(r.id), 'dismissed')}>
                            Dismiss
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {reports.length === 0 && (
                  <div className="text-sm text-gray-500">No reports found.</div>
                )}
              </div>
            )}
            <div className="mt-4 text-xs text-gray-500 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              Handle sensitive reports according to policy.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications */}
      <div className="fixed bottom-6 right-6">
        <Button size="lg" className="bg-yellow-600 hover:bg-yellow-700 text-white rounded-full shadow-lg">
          <Bell className="h-5 w-5" />
          <Badge className="ml-2 bg-red-500 text-white">3</Badge>
        </Button>
      </div>
    </div>
  );
};

export default AdminDashboard;
