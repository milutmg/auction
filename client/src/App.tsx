import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { Toaster } from './components/ui/toaster';
import PaymentNotification from './components/notifications/PaymentNotification';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Import pages
import Index from './pages/Index';
import Auth from './pages/Auth';
import AuthCallback from './pages/AuthCallback';
import Auctions from './pages/Auctions';
import EnhancedAuctions from './pages/EnhancedAuctions';
import AuctionsFixed from './pages/AuctionsFixed';
import SimpleAuctions from './pages/SimpleAuctions';
import AuctionDetail from './pages/AuctionDetail';
import CreateAuction from './pages/CreateAuction';
import LiveBidding from './pages/LiveBidding';
import UserDashboard from './pages/UserDashboard';
import Account from './pages/Account';
import About from './pages/About';
import Categories from './pages/Categories';
import CategoryDetail from './pages/CategoryDetail';
import PrivacyPolicy, { route as privacyRoute } from './pages/PrivacyPolicy';
import CookiesPolicy, { route as cookiesRoute } from './pages/CookiesPolicy';
import TermsOfService, { route as termsRoute } from './pages/TermsOfService';
import Contact, { route as contactRoute } from './pages/Contact';

import NotFound from './pages/NotFound';
import NotificationDemo from './components/demo/NotificationDemo';
import Debug from './pages/Debug';
import OrderDetails from './pages/OrderDetails';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentFailed from './pages/PaymentFailed';
import PaymentCheckout from './pages/PaymentCheckout';
import PaymentSuccessV2 from './pages/PaymentSuccessV2';
import PaymentFailedV2 from './pages/PaymentFailedV2';
import PaymentDashboard from './pages/PaymentDashboard';
import PaymentDashboardFixed from './pages/PaymentDashboardFixed';
import PaymentForm from './pages/PaymentForm';
import QuickPay from './pages/QuickPay';
// import ModernAdminDashboard from './pages/ModernAdminDashboard';
// import EnhancedAdminDashboard from './pages/EnhancedAdminDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminManageAuctions from './pages/AdminManageAuctions';

// Import layout components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/auctions" element={<SimpleAuctions />} />
                <Route path="/auctions/classic" element={<Auctions />} />
                <Route path="/auctions/:id" element={<AuctionDetail />} />
                <Route path="/live-bidding" element={<LiveBidding />} />
                <Route path="/about" element={<About />} />
                {/* Categories now protected below */}
                <Route path="/categories" element={<Categories />} />
                <Route path="/categories/:categoryName" element={<CategoryDetail />} />
                <Route path="/demo/notifications" element={<NotificationDemo />} />
                <Route path="/debug" element={<Debug />} />
                <Route path={privacyRoute} element={<PrivacyPolicy />} />
                <Route path={cookiesRoute} element={<CookiesPolicy />} />
                <Route path={termsRoute} element={<TermsOfService />} />
                <Route path={contactRoute} element={<Contact />} />
                
                {/* Protected routes (require authentication) */}
                <Route path="/auctions/:id/live" element={
                  <ProtectedRoute>
                    <LiveBidding />
                  </ProtectedRoute>
                } />

                <Route path="/create-auction" element={
                  <ProtectedRoute>
                    <CreateAuction />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <UserDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/account" element={
                  <ProtectedRoute>
                    <Account />
                  </ProtectedRoute>
                } />
                <Route path="/orders/:orderId" element={
                  <ProtectedRoute>
                    <OrderDetails />
                  </ProtectedRoute>
                } />
                
                {/* Payment routes */}
                <Route path="/payment/success" element={<PaymentSuccessV2 />} />
                <Route path="/payment/failed" element={<PaymentFailedV2 />} />
                <Route path="/payment/checkout/:orderId" element={<ProtectedRoute><PaymentCheckout /></ProtectedRoute>} />
                
                {/* Legacy payment routes */}
                <Route path="/payment-success" element={<PaymentSuccess />} />
                <Route path="/payment-failed" element={<PaymentFailed />} />
                <Route path="/payments" element={
                  <ProtectedRoute>
                    <PaymentDashboardFixed />
                  </ProtectedRoute>
                } />
                <Route path="/payment-form" element={
                  <ProtectedRoute>
                    <PaymentForm />
                  </ProtectedRoute>
                } />
                <Route path="/quick-pay" element={<QuickPay />} />
                
                {/* Admin routes */}
                <Route path="/admin" element={
                  <ProtectedRoute adminOnly>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/admin/modern" element={
                  <ProtectedRoute adminOnly>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/admin/enhanced" element={
                  <ProtectedRoute adminOnly>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/admin/manage-auctions" element={
                  <ProtectedRoute adminOnly>
                    <AdminManageAuctions />
                  </ProtectedRoute>
                } />
                
                {/* 404 route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
          <Toaster />
          <PaymentNotification />
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
};

export default App;
