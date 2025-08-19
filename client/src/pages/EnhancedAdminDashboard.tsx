import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, Gavel, DollarSign, TrendingUp, Activity, Shield, 
  Eye, AlertTriangle, Package, BarChart3, Clock, Star,
  ArrowUpRight, ArrowDownRight, Minus, Plus, Settings,
  Bell, RefreshCw, Download, Calendar, Search, Filter
} from 'lucide-react';

interface BidRequest {
  id: string;
  title: string;
  description: string;
  starting_bid: number;
  estimated_value: string;
  category: string;
  condition: string;
  provenance: string;
  user_name: string;
  user_email: string;
  status: string;
  created_at: string;
  image_url?: string;
}

interface AdminStats {
  total_users: number;
  active_auctions: number;
  pending_auctions: number;
  total_bids: number;
  revenue: number;
}

interface UserAnalytics {
  user_growth: Array<{date: string, new_users: number}>;
  active_users: number;
  activity_by_category: Array<{category: string, bid_count: number, unique_users: number}>;
  top_users: Array<{full_name: string, email: string, total_bids: number, total_bid_amount: number}>;
}

interface FinancialReport {
  daily_revenue: Array<{date: string, daily_revenue: number, orders_count: number}>;
  commission_summary: {total_commission: number, total_orders: number};
  revenue_by_category: Array<{category: string, revenue: number, orders: number, avg_order_value: number}>;
  payment_methods: Array<{payment_method: string, transaction_count: number, total_amount: number}>;
}

interface SystemMonitoring {
  database_status: string;
  active_sessions: number;
  recent_errors: number;
  auction_activity: {active_auctions: number, recently_ended: number, newly_created: number};
  recent_bid_activity: number;
}

interface AuctionModeration {
  id: string;
  title: string;
  seller_name: string;
  seller_email: string;
  category_name: string;
  approval_status: string;
  bid_count: number;
  report_count: number;
  created_at: string;
  starting_bid: number;
}

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  total_bids?: number;
  total_spent?: number;
}

interface Dispute {
  id: string;
  reporter_name: string;
  reported_user_name: string;
  auction_title: string;
  type: string;
  description: string;
  status: string;
  created_at: string;
}

interface BiddingRules {
  min_starting_bid: number;
  max_auction_duration_hours: number;
  min_bid_increment_percentage: number;
  auto_extend_minutes: number;
  payment_deadline_hours: number;
  max_bids_per_user_per_auction: number;
  bid_sniping_protection_minutes: number;
}

interface AuctionBids {
  auction: {
    id: string;
    title: string;
    seller_name: string;
    current_bid: number;
  };
  bids: Array<{
    id: string;
    bidder_name: string;
    bidder_email: string;
    amount: number;
    created_at: string;
    bidder_total_bids: number;
  }>;
}

const EnhancedAdminDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // State management
  const [adminStats, setAdminStats] = useState<AdminStats>({
    total_users: 0,
    active_auctions: 0,
    pending_auctions: 0,
    total_bids: 0,
    revenue: 0
  });
  const [userAnalytics, setUserAnalytics] = useState<UserAnalytics | null>(null);
  const [financialReport, setFinancialReport] = useState<FinancialReport | null>(null);
  const [systemMonitoring, setSystemMonitoring] = useState<SystemMonitoring | null>(null);
  const [auctions, setAuctions] = useState<AuctionModeration[]>([]);
  const [bidRequests, setBidRequests] = useState<BidRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [biddingRules, setBiddingRules] = useState<BiddingRules | null>(null);
  const [selectedAuctionBids, setSelectedAuctionBids] = useState<AuctionBids | null>(null);

  // Form states
  const [emailAlert, setEmailAlert] = useState({
    recipient_type: 'all',
    subject: '',
    message: '',
    priority: 'normal'
  });
  const [disputeResolution, setDisputeResolution] = useState({
    resolution: '',
    action_taken: '',
    compensation: '',
    send_notifications: true
  });

  // Loading states
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('requests'); // Start with requests tab
  
  // Dialog states for bid requests
  const [selectedBidRequest, setSelectedBidRequest] = useState<BidRequest | null>(null);
  const [editingBidRequest, setEditingBidRequest] = useState<BidRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Fetch data functions
  const fetchAdminStats = async () => {
    try {
      const response = await fetch('/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAdminStats(data);
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    }
  };

  const fetchUserAnalytics = async (period = '30') => {
    try {
      const response = await fetch(`/api/admin/analytics/users?period=${period}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUserAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching user analytics:', error);
    }
  };

  const fetchFinancialReport = async (period = '30') => {
    try {
      const response = await fetch(`/api/admin/reports/financial?period=${period}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setFinancialReport(data);
      }
    } catch (error) {
      console.error('Error fetching financial report:', error);
    }
  };

  const fetchSystemMonitoring = async () => {
    try {
      const response = await fetch('/api/admin/monitoring/system', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSystemMonitoring(data);
      }
    } catch (error) {
      console.error('Error fetching system monitoring:', error);
    }
  };

  const fetchAuctionsForModeration = async (status = 'all') => {
    try {
      const response = await fetch(`/api/admin/moderation/auctions?status=${status}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAuctions(data);
      }
    } catch (error) {
      console.error('Error fetching auctions:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users/enhanced', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchDisputes = async (status = 'all') => {
    try {
      const response = await fetch(`/api/admin/disputes?status=${status}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setDisputes(data);
      }
    } catch (error) {
      console.error('Error fetching disputes:', error);
    }
  };

  const fetchBiddingRules = async () => {
    try {
      const response = await fetch('/api/admin/settings/bidding-rules', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setBiddingRules(data.rules);
      }
    } catch (error) {
      console.error('Error fetching bidding rules:', error);
    }
  };

  const fetchAuctionBids = async (auctionId: string) => {
    try {
      const response = await fetch(`/api/admin/auction/${auctionId}/bids`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSelectedAuctionBids(data);
      }
    } catch (error) {
      console.error('Error fetching auction bids:', error);
    }
  };

  const fetchBidRequests = async (status = 'pending') => {
    try {
      const response = await fetch(`/api/admin/bid-requests?status=${status}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setBidRequests(data);
      }
    } catch (error) {
      console.error('Error fetching bid requests:', error);
    }
  };

  // Action functions
  const handleAuctionDecision = async (auctionId: string, decision: string, feedback: string, qualityScore: number) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/moderation/auction/${auctionId}/decision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          decision,
          feedback,
          quality_score: qualityScore,
          send_notification: true
        })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Auction ${decision} successfully`,
        });
        fetchAuctionsForModeration();
      } else {
        throw new Error('Failed to process auction decision');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process auction decision",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId: string, action: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          is_active: action === 'activate'
        })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `User ${action}d successfully`,
        });
        fetchUsers();
      } else {
        throw new Error(`Failed to ${action} user`);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${action} user`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmailAlert = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/alerts/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(emailAlert)
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Email Alert Sent",
          description: `Alert sent to ${data.recipient_count} users`,
        });
        setEmailAlert({
          recipient_type: 'all',
          subject: '',
          message: '',
          priority: 'normal'
        });
      } else {
        throw new Error('Failed to send email alert');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send email alert",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResolveDispute = async (disputeId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/disputes/${disputeId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(disputeResolution)
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Dispute resolved successfully",
        });
        fetchDisputes();
        setDisputeResolution({
          resolution: '',
          action_taken: '',
          compensation: '',
          send_notifications: true
        });
      } else {
        throw new Error('Failed to resolve dispute');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resolve dispute",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBiddingRules = async () => {
    if (!biddingRules) return;

    try {
      setLoading(true);
      const response = await fetch('/api/admin/settings/bidding-rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(biddingRules)
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Bidding rules updated successfully",
        });
      } else {
        throw new Error('Failed to update bidding rules');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update bidding rules",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSuspiciousBid = async (bidId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/bids/${bidId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Suspicious bid removed successfully",
        });
        if (selectedAuctionBids) {
          fetchAuctionBids(selectedAuctionBids.auction.id);
        }
      } else {
        throw new Error('Failed to remove bid');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove suspicious bid",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveBidRequest = async (requestId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/bid-requests/${requestId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Product request approved successfully",
        });
        fetchBidRequests();
      } else {
        throw new Error('Failed to approve product request');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve product request",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRejectBidRequest = async (requestId: string, reason: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/bid-requests/${requestId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Product request rejected",
        });
        fetchBidRequests();
        setIsRejectDialogOpen(false);
        setRejectionReason('');
        setSelectedBidRequest(null);
      } else {
        throw new Error('Failed to reject product request');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject product request",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchAdminStats();
    fetchSystemMonitoring();
    fetchBiddingRules();
  }, []);

  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchUserAnalytics();
    } else if (activeTab === 'financial') {
      fetchFinancialReport();
    } else if (activeTab === 'moderation') {
      fetchAuctionsForModeration();
    } else if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'disputes') {
      fetchDisputes();
    } else if (activeTab === 'requests') {
      fetchBidRequests();
    }
  }, [activeTab]);

  // Auto-refresh system monitoring
  useEffect(() => {
    const interval = setInterval(fetchSystemMonitoring, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Enhanced Admin Dashboard</h1>
        <div className="flex items-center gap-4">
          <Button onClick={() => window.location.reload()} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Badge variant="secondary" className="text-sm">
            {user?.full_name} - Admin
          </Badge>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{adminStats.total_users}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Auctions</p>
                <p className="text-3xl font-bold text-gray-900">{adminStats.active_auctions}</p>
              </div>
              <Gavel className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
                <p className="text-3xl font-bold text-gray-900">{adminStats.pending_auctions}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Bids</p>
                <p className="text-3xl font-bold text-gray-900">{adminStats.total_bids}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Revenue</p>
                <p className="text-3xl font-bold text-gray-900">NPR {adminStats.revenue.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-gold" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Monitoring Alert */}
      {systemMonitoring && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              System Health Monitoring
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Database</p>
                <Badge variant={systemMonitoring.database_status === 'healthy' ? 'default' : 'destructive'}>
                  {systemMonitoring.database_status}
                </Badge>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Active Sessions</p>
                <p className="text-lg font-semibold">{systemMonitoring.active_sessions}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Recent Errors</p>
                <p className="text-lg font-semibold text-red-600">{systemMonitoring.recent_errors}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Active Auctions</p>
                <p className="text-lg font-semibold">{systemMonitoring.auction_activity.active_auctions}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Recent Bids</p>
                <p className="text-lg font-semibold">{systemMonitoring.recent_bid_activity}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-9">
          <TabsTrigger value="requests">Product Requests</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="moderation">Moderation</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="disputes">Disputes</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Product Requests Tab */}
        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Product Requests Management
                </span>
                <Badge variant="secondary">{bidRequests.length} Pending</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {bidRequests.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">All Requests Processed!</h3>
                  <p className="text-muted-foreground">No pending product requests.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product Details</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Starting Bid</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bidRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium">{request.title}</p>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {request.description}
                            </p>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {request.condition}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                Est. Value: {request.estimated_value}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium text-sm">{request.user_name}</p>
                            <p className="text-xs text-muted-foreground">{request.user_email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold">${request.starting_bid}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{request.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {new Date(request.created_at).toLocaleDateString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {/* Edit */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingBidRequest(request);
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>

                            {/* Approve */}
                            <Button
                              size="sm"
                              onClick={() => handleApproveBidRequest(request.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>

                            {/* Reject */}
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedBidRequest(request);
                                setIsRejectDialogOpen(true);
                              }}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>New user registrations today</span>
                    <Badge variant="secondary">12</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Auctions ending soon</span>
                    <Badge variant="secondary">8</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Pending dispute resolutions</span>
                    <Badge variant="destructive">3</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Button onClick={() => setActiveTab('moderation')} className="h-20">
                    <div className="text-center">
                      <Shield className="w-6 h-6 mx-auto mb-2" />
                      Review Auctions
                    </div>
                  </Button>
                  <Button onClick={() => setActiveTab('users')} variant="outline" className="h-20">
                    <div className="text-center">
                      <Users className="w-6 h-6 mx-auto mb-2" />
                      Manage Users
                    </div>
                  </Button>
                  <Button onClick={() => setActiveTab('disputes')} variant="outline" className="h-20">
                    <div className="text-center">
                      <Flag className="w-6 h-6 mx-auto mb-2" />
                      Resolve Disputes
                    </div>
                  </Button>
                  <Button onClick={() => setActiveTab('alerts')} variant="outline" className="h-20">
                    <div className="text-center">
                      <Bell className="w-6 h-6 mx-auto mb-2" />
                      Send Alerts
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* User Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          {userAnalytics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Growth (Last 30 Days)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    Chart visualization would go here
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Active Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {userAnalytics.top_users.slice(0, 5).map((user, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{user.full_name}</p>
                          <p className="text-sm text-gray-600">{user.total_bids} bids</p>
                        </div>
                        <Badge variant="secondary">
                          NPR {user.total_bid_amount.toLocaleString()}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Activity by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Category</TableHead>
                        <TableHead>Total Bids</TableHead>
                        <TableHead>Unique Users</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userAnalytics.activity_by_category.map((category, index) => (
                        <TableRow key={index}>
                          <TableCell>{category.category}</TableCell>
                          <TableCell>{category.bid_count}</TableCell>
                          <TableCell>{category.unique_users}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Product Moderation Tab */}
        <TabsContent value="moderation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Auction Moderation
                <div className="flex gap-2">
                  <Button onClick={() => fetchAuctionsForModeration('pending')} variant="outline" size="sm">
                    Pending Only
                  </Button>
                  <Button onClick={() => fetchAuctionsForModeration('all')} variant="outline" size="sm">
                    Show All
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Auction</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Starting Bid</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Bids</TableHead>
                    <TableHead>Reports</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auctions.map((auction) => (
                    <TableRow key={auction.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{auction.title}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(auction.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p>{auction.seller_name}</p>
                          <p className="text-sm text-gray-600">{auction.seller_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{auction.category_name}</TableCell>
                      <TableCell>NPR {auction.starting_bid}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            auction.approval_status === 'approved' ? 'default' :
                            auction.approval_status === 'rejected' ? 'destructive' : 'secondary'
                          }
                        >
                          {auction.approval_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="link"
                          onClick={() => fetchAuctionBids(auction.id)}
                          className="p-0"
                        >
                          {auction.bid_count} bids
                        </Button>
                      </TableCell>
                      <TableCell>
                        {auction.report_count > 0 && (
                          <Badge variant="destructive">{auction.report_count}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {auction.approval_status === 'pending' && (
                            <>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="default">
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Approve
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Approve Auction</DialogTitle>
                                    <DialogDescription>
                                      Provide feedback and quality score for this auction.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label>Admin Feedback</Label>
                                      <Textarea placeholder="Optional feedback for the seller..." />
                                    </div>
                                    <div>
                                      <Label>Quality Score (1-10)</Label>
                                      <Input type="number" min="1" max="10" defaultValue="8" />
                                    </div>
                                    <Button 
                                      onClick={() => handleAuctionDecision(auction.id, 'approved', '', 8)}
                                      disabled={loading}
                                    >
                                      Approve Auction
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleAuctionDecision(auction.id, 'rejected', 'Quality issues', 3)}
                                disabled={loading}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Auction Bids Modal */}
          {selectedAuctionBids && (
            <Dialog open={!!selectedAuctionBids} onOpenChange={() => setSelectedAuctionBids(null)}>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>All Bids for: {selectedAuctionBids.auction.title}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Seller:</span> {selectedAuctionBids.auction.seller_name}
                    </div>
                    <div>
                      <span className="font-medium">Current Bid:</span> NPR {selectedAuctionBids.auction.current_bid}
                    </div>
                    <div>
                      <span className="font-medium">Total Bids:</span> {selectedAuctionBids.bids.length}
                    </div>
                  </div>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Bidder</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Bidder Stats</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedAuctionBids.bids.map((bid) => (
                        <TableRow key={bid.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{bid.bidder_name}</p>
                              <p className="text-sm text-gray-600">{bid.bidder_email}</p>
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold">NPR {bid.amount}</TableCell>
                          <TableCell>{new Date(bid.created_at).toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {bid.bidder_total_bids} total bids
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRemoveSuspiciousBid(bid.id)}
                              disabled={loading}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </TabsContent>

        {/* User Management Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total Bids</TableHead>
                    <TableHead>Total Spent</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{user.full_name}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.is_active ? 'default' : 'destructive'}>
                          {user.is_active ? 'Active' : 'Suspended'}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.total_bids || 0}</TableCell>
                      <TableCell>NPR {user.total_spent?.toLocaleString() || '0'}</TableCell>
                      <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {user.is_active ? (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleUserAction(user.id, 'suspend')}
                              disabled={loading}
                            >
                              <UserX className="w-4 h-4 mr-1" />
                              Suspend
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleUserAction(user.id, 'activate')}
                              disabled={loading}
                            >
                              <UserCheck className="w-4 h-4 mr-1" />
                              Activate
                            </Button>
                          )}
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dispute Resolution Tab */}
        <TabsContent value="disputes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Dispute Resolution
                <div className="flex gap-2">
                  <Button onClick={() => fetchDisputes('pending')} variant="outline" size="sm">
                    Pending Only
                  </Button>
                  <Button onClick={() => fetchDisputes('all')} variant="outline" size="sm">
                    Show All
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reporter</TableHead>
                    <TableHead>Reported User</TableHead>
                    <TableHead>Auction</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {disputes.map((dispute) => (
                    <TableRow key={dispute.id}>
                      <TableCell>{dispute.reporter_name}</TableCell>
                      <TableCell>{dispute.reported_user_name}</TableCell>
                      <TableCell>{dispute.auction_title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{dispute.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            dispute.status === 'resolved' ? 'default' :
                            dispute.status === 'investigating' ? 'secondary' : 'outline'
                          }
                        >
                          {dispute.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(dispute.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {dispute.status === 'pending' && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm">
                                Resolve
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Resolve Dispute</DialogTitle>
                                <DialogDescription>
                                  {dispute.description}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Resolution Details</Label>
                                  <Textarea
                                    value={disputeResolution.resolution}
                                    onChange={(e) => setDisputeResolution({
                                      ...disputeResolution,
                                      resolution: e.target.value
                                    })}
                                    placeholder="Describe how this dispute was resolved..."
                                  />
                                </div>
                                <div>
                                  <Label>Action Taken</Label>
                                  <Select onValueChange={(value) => setDisputeResolution({
                                    ...disputeResolution,
                                    action_taken: value
                                  })}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select action taken" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="warning_issued">Warning Issued</SelectItem>
                                      <SelectItem value="user_suspended">User Suspended</SelectItem>
                                      <SelectItem value="auction_removed">Auction Removed</SelectItem>
                                      <SelectItem value="refund_issued">Refund Issued</SelectItem>
                                      <SelectItem value="no_action">No Action Required</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label>Compensation (if any)</Label>
                                  <Input
                                    type="number"
                                    value={disputeResolution.compensation}
                                    onChange={(e) => setDisputeResolution({
                                      ...disputeResolution,
                                      compensation: e.target.value
                                    })}
                                    placeholder="Amount in NPR"
                                  />
                                </div>
                                <Button 
                                  onClick={() => handleResolveDispute(dispute.id)}
                                  disabled={loading}
                                >
                                  Resolve Dispute
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financial Reporting Tab */}
        <TabsContent value="financial" className="space-y-6">
          {financialReport && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Commission</span>
                      <span className="font-bold">NPR {financialReport.commission_summary.total_commission?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Orders</span>
                      <span className="font-bold">{financialReport.commission_summary.total_orders}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payment Methods</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {financialReport.payment_methods.map((method, index) => (
                      <div key={index} className="flex justify-between">
                        <span>{method.payment_method}</span>
                        <div className="text-right">
                          <p className="font-medium">NPR {method.total_amount.toLocaleString()}</p>
                          <p className="text-sm text-gray-600">{method.transaction_count} transactions</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Revenue by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Category</TableHead>
                        <TableHead>Revenue</TableHead>
                        <TableHead>Orders</TableHead>
                        <TableHead>Avg Order Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {financialReport.revenue_by_category.map((category, index) => (
                        <TableRow key={index}>
                          <TableCell>{category.category}</TableCell>
                          <TableCell>NPR {category.revenue.toLocaleString()}</TableCell>
                          <TableCell>{category.orders}</TableCell>
                          <TableCell>NPR {category.avg_order_value.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Email Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Send Email Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Recipient Type</Label>
                  <Select 
                    value={emailAlert.recipient_type}
                    onValueChange={(value) => setEmailAlert({...emailAlert, recipient_type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="active_bidders">Active Bidders</SelectItem>
                      <SelectItem value="sellers">Sellers Only</SelectItem>
                      <SelectItem value="specific">Specific Users</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Priority</Label>
                  <Select 
                    value={emailAlert.priority}
                    onValueChange={(value) => setEmailAlert({...emailAlert, priority: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Subject</Label>
                  <Input
                    value={emailAlert.subject}
                    onChange={(e) => setEmailAlert({...emailAlert, subject: e.target.value})}
                    placeholder="Email subject"
                  />
                </div>

                <div>
                  <Label>Message</Label>
                  <Textarea
                    value={emailAlert.message}
                    onChange={(e) => setEmailAlert({...emailAlert, message: e.target.value})}
                    placeholder="Email message content"
                    rows={5}
                  />
                </div>

                <Button 
                  onClick={handleSendEmailAlert}
                  disabled={loading || !emailAlert.subject || !emailAlert.message}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Email Alert
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bidding Rules Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              {biddingRules && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Minimum Starting Bid (NPR)</Label>
                    <Input
                      type="number"
                      value={biddingRules.min_starting_bid}
                      onChange={(e) => setBiddingRules({
                        ...biddingRules,
                        min_starting_bid: parseFloat(e.target.value)
                      })}
                    />
                  </div>

                  <div>
                    <Label>Maximum Auction Duration (Hours)</Label>
                    <Input
                      type="number"
                      value={biddingRules.max_auction_duration_hours}
                      onChange={(e) => setBiddingRules({
                        ...biddingRules,
                        max_auction_duration_hours: parseInt(e.target.value)
                      })}
                    />
                  </div>

                  <div>
                    <Label>Minimum Bid Increment (%)</Label>
                    <Input
                      type="number"
                      value={biddingRules.min_bid_increment_percentage}
                      onChange={(e) => setBiddingRules({
                        ...biddingRules,
                        min_bid_increment_percentage: parseInt(e.target.value)
                      })}
                    />
                  </div>

                  <div>
                    <Label>Auto-Extend Minutes</Label>
                    <Input
                      type="number"
                      value={biddingRules.auto_extend_minutes}
                      onChange={(e) => setBiddingRules({
                        ...biddingRules,
                        auto_extend_minutes: parseInt(e.target.value)
                      })}
                    />
                  </div>

                  <div>
                    <Label>Payment Deadline (Hours)</Label>
                    <Input
                      type="number"
                      value={biddingRules.payment_deadline_hours}
                      onChange={(e) => setBiddingRules({
                        ...biddingRules,
                        payment_deadline_hours: parseInt(e.target.value)
                      })}
                    />
                  </div>

                  <div>
                    <Label>Max Bids per User per Auction</Label>
                    <Input
                      type="number"
                      value={biddingRules.max_bids_per_user_per_auction}
                      onChange={(e) => setBiddingRules({
                        ...biddingRules,
                        max_bids_per_user_per_auction: parseInt(e.target.value)
                      })}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Button 
                      onClick={handleUpdateBiddingRules}
                      disabled={loading}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Update Bidding Rules
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Bid Request Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Product Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this product request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Reason for rejection..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsRejectDialogOpen(false);
                  setRejectionReason('');
                  setSelectedBidRequest(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (selectedBidRequest) {
                    handleRejectBidRequest(selectedBidRequest.id, rejectionReason);
                  }
                }}
                disabled={!rejectionReason.trim()}
              >
                Reject Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bid Request Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Product Request</DialogTitle>
            <DialogDescription>
              Modify the product request details before approval
            </DialogDescription>
          </DialogHeader>
          {editingBidRequest && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <Input
                    value={editingBidRequest.title}
                    onChange={(e) => setEditingBidRequest({...editingBidRequest, title: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Starting Bid ($)</Label>
                  <Input
                    type="number"
                    value={editingBidRequest.starting_bid}
                    onChange={(e) => setEditingBidRequest({...editingBidRequest, starting_bid: parseFloat(e.target.value)})}
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Input
                    value={editingBidRequest.category}
                    onChange={(e) => setEditingBidRequest({...editingBidRequest, category: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Condition</Label>
                  <Input
                    value={editingBidRequest.condition}
                    onChange={(e) => setEditingBidRequest({...editingBidRequest, condition: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label>Description</Label>
                  <Textarea
                    rows={3}
                    value={editingBidRequest.description}
                    onChange={(e) => setEditingBidRequest({...editingBidRequest, description: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Estimated Value</Label>
                  <Input
                    value={editingBidRequest.estimated_value}
                    onChange={(e) => setEditingBidRequest({...editingBidRequest, estimated_value: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Image URL</Label>
                  <Input
                    value={editingBidRequest.image_url || ''}
                    onChange={(e) => setEditingBidRequest({...editingBidRequest, image_url: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Provenance</Label>
                  <Textarea
                    rows={2}
                    value={editingBidRequest.provenance}
                    onChange={(e) => setEditingBidRequest({...editingBidRequest, provenance: e.target.value})}
                  />
                </div>
              </div>
              <div className="col-span-1 md:col-span-2 flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setEditingBidRequest(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    // Here you would call an API to update the bid request
                    toast({
                      title: "Success",
                      description: "Product request updated successfully",
                    });
                    setIsEditDialogOpen(false);
                    setEditingBidRequest(null);
                    fetchBidRequests();
                  }}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedAdminDashboard;
