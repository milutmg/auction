import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Users, Gavel, DollarSign, TrendingUp, BarChart3,
  ArrowUpRight, Bell, RefreshCw, Download, Calendar
} from 'lucide-react';

const SimpleModernDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Success Banner */}
      <div className="mb-6 p-4 bg-green-100 border border-green-400 rounded-lg">
        <h2 className="text-xl font-bold text-green-800">✅ Modern Dashboard Active!</h2>
        <p className="text-green-700">The modern dashboard is successfully loading</p>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">🎯 Modern Analytics Dashboard</h1>
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
        {/* Total Users */}
        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">1,234</p>
                <div className="flex items-center mt-2">
                  <ArrowUpRight className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium text-green-600">12%</span>
                  <span className="text-sm text-gray-500 ml-1">from yesterday</span>
                </div>
              </div>
              <div className="p-3 rounded-full bg-blue-50 text-blue-700 border-blue-200">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Auctions */}
        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Auctions</p>
                <p className="text-2xl font-bold text-gray-900">89</p>
                <div className="flex items-center mt-2">
                  <ArrowUpRight className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium text-green-600">8%</span>
                  <span className="text-sm text-gray-500 ml-1">from yesterday</span>
                </div>
              </div>
              <div className="p-3 rounded-full bg-emerald-50 text-emerald-700 border-emerald-200">
                <Gavel className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Bids */}
        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Bids</p>
                <p className="text-2xl font-bold text-gray-900">5,678</p>
                <div className="flex items-center mt-2">
                  <ArrowUpRight className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium text-green-600">15%</span>
                  <span className="text-sm text-gray-500 ml-1">from yesterday</span>
                </div>
              </div>
              <div className="p-3 rounded-full bg-purple-50 text-purple-700 border-purple-200">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Revenue */}
        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Revenue</p>
                <p className="text-2xl font-bold text-gray-900">$89,234</p>
                <div className="flex items-center mt-2">
                  <ArrowUpRight className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium text-green-600">23%</span>
                  <span className="text-sm text-gray-500 ml-1">from yesterday</span>
                </div>
              </div>
              <div className="p-3 rounded-full bg-yellow-50 text-yellow-700 border-yellow-200">
                <DollarSign className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Overview */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl">Performance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gradient-to-br from-yellow-50 via-yellow-100 to-orange-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg">
                <BarChart3 className="h-16 w-16 text-yellow-600 mx-auto mb-4" />
                <p className="text-gray-800 font-semibold">🎯 Modern Dashboard Active</p>
                <p className="text-sm text-gray-600 mt-2">Analytics and charts will be here</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Success Confirmation */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6">
          <div className="text-center">
            <h2 className="text-xl font-bold text-green-800 mb-2">🎉 Dashboard Successfully Loaded!</h2>
            <p className="text-green-700 mb-4">
              The modern admin dashboard is now active and working correctly.
            </p>
            <div className="flex justify-center gap-4">
              <Button className="bg-yellow-600 hover:bg-yellow-700 text-white">
                <Bell className="h-4 w-4 mr-2" />
                Dashboard Active
              </Button>
              <Button variant="outline" className="border-green-300 text-green-700 hover:bg-green-100">
                View Analytics
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Floating notification */}
      <div className="fixed bottom-6 right-6">
        <Button 
          size="lg" 
          className="bg-yellow-600 hover:bg-yellow-700 text-white rounded-full shadow-lg"
        >
          <Bell className="h-5 w-5" />
          <Badge className="ml-2 bg-green-500 text-white">ACTIVE</Badge>
        </Button>
      </div>
    </div>
  );
};

export default SimpleModernDashboard;
