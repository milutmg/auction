import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, Gavel, DollarSign, TrendingUp, BarChart3,
  ArrowUpRight, Package, RefreshCw, Download, Calendar, Bell
} from 'lucide-react';

const TestModernDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">🎯 Modern Analytics Dashboard</h1>
            <div className="flex items-center mt-2">
              <p className="text-gray-600">Welcome to the new dashboard design!</p>
              <Badge className="ml-3 bg-green-100 text-green-800">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Active
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl">Performance Overview</CardTitle>
              <Button variant="outline" size="sm">
                Settings
              </Button>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gradient-to-br from-yellow-50 via-yellow-100 to-orange-100 rounded-lg flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-4 left-4 w-16 h-16 bg-yellow-400 rounded-full"></div>
                  <div className="absolute top-12 right-8 w-8 h-8 bg-orange-400 rounded-full"></div>
                  <div className="absolute bottom-8 left-12 w-12 h-12 bg-yellow-500 rounded-full"></div>
                </div>
                
                <div className="text-center z-10">
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg">
                    <BarChart3 className="h-16 w-16 text-yellow-600 mx-auto mb-4" />
                    <p className="text-gray-800 font-semibold">🎯 NEW MODERN DESIGN</p>
                    <p className="text-sm text-gray-600 mt-2">Charts will be integrated here</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900">✅ Dashboard Active</h3>
                <p className="text-sm text-gray-600">Modern design is working!</p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Database</span>
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Online
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Design Status</span>
                  <Badge className="bg-yellow-100 text-yellow-800">
                    🎨 Modern
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Success Message */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6">
          <div className="text-center">
            <h2 className="text-xl font-bold text-green-800 mb-2">🎉 Modern Dashboard Successfully Loaded!</h2>
            <p className="text-green-700">
              If you can see this page, the modern dashboard design has been successfully implemented and is working correctly.
            </p>
            <div className="mt-4 flex justify-center">
              <Button className="bg-yellow-600 hover:bg-yellow-700 text-white">
                <Bell className="h-4 w-4 mr-2" />
                Dashboard is Active
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
          <Badge className="ml-2 bg-red-500 text-white">NEW</Badge>
        </Button>
      </div>
    </div>
  );
};

export default TestModernDashboard;
