import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import BidApproval from '@/components/admin/BidApproval';

const AdminDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">
            Welcome back, {user?.full_name}! Here's your admin overview.
          </p>
        </div>

        {/* Bid Approval Section - Priority */}
        <div className="mb-8">
          <BidApproval />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Users</h3>
            <p className="text-3xl font-bold text-blue-600">1,234</p>
            <p className="text-sm text-gray-500 mt-1">+12% from last month</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Active Auctions</h3>
            <p className="text-3xl font-bold text-green-600">89</p>
            <p className="text-sm text-gray-500 mt-1">+5% from last week</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Revenue</h3>
            <p className="text-3xl font-bold text-purple-600">$45,678</p>
            <p className="text-sm text-gray-500 mt-1">+18% from last month</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Pending Approvals</h3>
            <p className="text-3xl font-bold text-orange-600">23</p>
            <p className="text-sm text-gray-500 mt-1">Requires attention</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="text-sm text-gray-600">New user registration</span>
                <span className="text-xs text-gray-500">2 hours ago</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="text-sm text-gray-600">Auction approval needed</span>
                <span className="text-xs text-gray-500">4 hours ago</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="text-sm text-gray-600">Payment processed</span>
                <span className="text-xs text-gray-500">6 hours ago</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors">
                Approve Pending Auctions
              </button>
              <button className="w-full text-left p-3 bg-green-50 hover:bg-green-100 rounded border border-green-200 transition-colors">
                Review User Reports
              </button>
              <button className="w-full text-left p-3 bg-purple-50 hover:bg-purple-100 rounded border border-purple-200 transition-colors">
                Generate Revenue Report
              </button>
              <button className="w-full text-left p-3 bg-orange-50 hover:bg-orange-100 rounded border border-orange-200 transition-colors">
                Manage Categories
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
