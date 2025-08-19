import React from 'react';

const DiagnosticDashboard = () => {
  return (
    <div className="min-h-screen bg-red-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 border-4 border-red-500">
          <h1 className="text-4xl font-bold text-red-600 mb-4">
            🚨 DIAGNOSTIC MODE: Dashboard Status
          </h1>
          
          <div className="space-y-4 text-lg">
            <div className="p-4 bg-green-100 border border-green-400 rounded">
              <strong className="text-green-800">✅ React Component Loaded Successfully</strong>
              <p className="text-green-700">This component is rendering correctly</p>
            </div>
            
            <div className="p-4 bg-blue-100 border border-blue-400 rounded">
              <strong className="text-blue-800">📍 Current Route Information:</strong>
              <p className="text-blue-700">URL: {window.location.href}</p>
              <p className="text-blue-700">Path: {window.location.pathname}</p>
            </div>
            
            <div className="p-4 bg-yellow-100 border border-yellow-400 rounded">
              <strong className="text-yellow-800">🔍 Dashboard Routes Available:</strong>
              <ul className="text-yellow-700 list-disc ml-6 mt-2">
                <li>/admin - Protected Modern Dashboard</li>
                <li>/modern-admin - Modern Dashboard (No Auth)</li>
                <li>/test-dashboard - Test Dashboard</li>
                <li>/admin/enhanced - Enhanced Dashboard</li>
                <li>/admin/basic - Basic Dashboard</li>
              </ul>
            </div>

            <div className="p-4 bg-purple-100 border border-purple-400 rounded">
              <strong className="text-purple-800">🎯 Quick Test Links:</strong>
              <div className="mt-2 space-y-2">
                <a href="/test-dashboard" className="block text-purple-700 underline hover:text-purple-900">
                  → Test Dashboard (No Auth Required)
                </a>
                <a href="/modern-admin" className="block text-purple-700 underline hover:text-purple-900">
                  → Modern Admin Dashboard (No Auth Required)
                </a>
                <a href="/admin" className="block text-purple-700 underline hover:text-purple-900">
                  → Protected Admin Dashboard (Login Required)
                </a>
              </div>
            </div>

            <div className="p-4 bg-gray-100 border border-gray-400 rounded">
              <strong className="text-gray-800">🔧 Troubleshooting:</strong>
              <ol className="text-gray-700 list-decimal ml-6 mt-2">
                <li>Clear browser cache (Ctrl+Shift+Delete)</li>
                <li>Try incognito/private mode</li>
                <li>Hard refresh (Ctrl+F5)</li>
                <li>Check browser console for errors</li>
              </ol>
            </div>
          </div>

          <div className="mt-8 text-center">
            <button 
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 font-semibold"
            >
              🔄 Reload Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticDashboard;
