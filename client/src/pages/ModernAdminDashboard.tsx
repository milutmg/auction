import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Users, Gavel, DollarSign, TrendingUp, Activity, Shield, 
  Eye, AlertTriangle, Package, BarChart3, Clock, Star,
  ArrowUpRight, ArrowDownRight, Bell, RefreshCw, Download, 
  Calendar, Search, Filter, Settings, Plus, Minus
} from 'lucide-react';

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

const ModernAdminDashboard = () => {
  const { user } = useAuth();
  // Note: Removed useToast to prevent any potential loading issues

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

  // Initialize dashboard data immediately (no API calls for faster loading)
  useEffect(() => {
    initializeDashboardData();
  }, []);

  const initializeDashboardData = () => {
    // Set mock stats data immediately
    setStats({
      total_users: 1247,
      active_auctions: 23,
      pending_auctions: 8,
      total_bids: 5892,
      revenue: 45670,
      daily_change: {
        users: 8,
        auctions: 3,
        bids: 15,
        revenue: 12
      }
    });

    // Set recent activity data
    setRecentActivity([
      {
        id: '1',
        type: 'bid',
        title: 'New bid on Vintage Clock',
        user: 'John Doe',
        amount: 250,
        time: '2 minutes ago',
        status: 'success'
      },
      {
        id: '2',
        type: 'auction',
        title: 'New auction created',
        user: 'Jane Smith',
        amount: 150,
        time: '5 minutes ago',
        status: 'pending'
      },
      {
        id: '3',
        type: 'payment',
        title: 'Payment completed',
        user: 'Mike Johnson',
        amount: 500,
        time: '10 minutes ago',
        status: 'success'
      },
      {
        id: '4',
        type: 'user',
        title: 'New user registered',
        user: 'Sarah Wilson',
        time: '15 minutes ago',
        status: 'success'
      }
    ]);

    // Set top performers
    setTopPerformers([
      { name: 'Vintage Antiques', category: 'Category', value: 15420, change: 12.5, type: 'category' },
      { name: 'John Smith', category: 'Top Bidder', value: 8950, change: -2.1, type: 'user' },
      { name: 'Royal Clock Collection', category: 'Auction', value: 3200, change: 8.7, type: 'auction' }
    ]);

    // Set loading to false immediately
    setLoading(false);
  };

  const fetchDashboardData = async () => {
    // Simulate refresh with updated mock data (no API calls)
    setLoading(true);
    
    // Simulate a quick refresh delay
    setTimeout(() => {
      setStats(prev => ({
        ...prev,
        total_users: prev.total_users + Math.floor(Math.random() * 5),
        total_bids: prev.total_bids + Math.floor(Math.random() * 20),
        daily_change: {
          users: Math.floor(Math.random() * 20) - 10,
          auctions: Math.floor(Math.random() * 10) - 5,
          bids: Math.floor(Math.random() * 50) - 25,
          revenue: Math.floor(Math.random() * 30) - 15
        }
      }));
      setLoading(false);
    }, 300);
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
            <Button variant="outline" size="sm" className="hover:bg-yellow-50">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" className="hover:bg-yellow-50">
              <Calendar className="h-4 w-4 mr-2" />
              Last 30 days
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
                <Button className="bg-yellow-600 hover:bg-yellow-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  New Auction
                </Button>
                <Button variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Users
                </Button>
                <Button variant="outline">
                  <Shield className="h-4 w-4 mr-2" />
                  Moderation
                </Button>
                <Button variant="outline">
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

export default ModernAdminDashboard;
