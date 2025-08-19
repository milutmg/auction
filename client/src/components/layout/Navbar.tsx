import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User, Settings, LogOut, Bell, ChevronDown, Search, Menu, X, Check, Clock, AlertCircle, MessageSquare } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

// Notification Dropdown Component
const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'message',
      title: 'New message from Sarah',
      message: 'Hey! The project deadline has been moved to next week.',
      time: '2 min ago',
      unread: true
    },
    {
      id: 2,
      type: 'alert',
      title: 'System maintenance',
      message: 'Scheduled maintenance will begin at 2:00 AM UTC.',
      time: '1 hour ago',
      unread: true
    },
    {
      id: 3,
      type: 'success',
      title: 'Task completed',
      message: 'Your report has been successfully generated.',
      time: '3 hours ago',
      unread: false
    },
    {
      id: 4,
      type: 'message',
      title: 'Team meeting reminder',
      message: 'Weekly standup meeting starts in 30 minutes.',
      time: '5 hours ago',
      unread: false
    }
  ]);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter(n => n.unread).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, unread: false } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, unread: false }))
    );
  };

  const getIcon = (type) => {
    switch (type) {
      case 'message':
        return <MessageSquare size={16} className="text-gold" />;
      case 'alert':
        return <AlertCircle size={16} className="text-orange-500" />;
      case 'success':
        return <Check size={16} className="text-green-500" />;
      default:
        return <Bell size={16} className="text-gray-500" />;
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Notification Button */}
      <button
        onClick={toggleDropdown}
        className={`relative p-2 text-gold hover:text-gold-dark hover:bg-gold hover:bg-opacity-10 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gold focus:ring-opacity-20 ${isOpen ? 'bg-gold bg-opacity-10' : ''}`}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-semibold px-1.5 py-0.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-[9999]"
          style={{ minWidth: '320px' }}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-gold hover:text-gold-dark font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500 text-sm">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${
                    notification.unread ? 'bg-gold bg-opacity-5' : ''
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <p className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </p>
                        {notification.unread && (
                          <div className="w-2 h-2 bg-gold rounded-full flex-shrink-0 mt-1.5 ml-2"></div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-1 mt-2">
                        <Clock size={12} className="text-gray-400" />
                        <span className="text-xs text-gray-500">{notification.time}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-100">
            <button className="text-sm text-gold hover:text-gold-dark font-medium w-full text-center">
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Profile Dropdown Component
const ProfileDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleMenuClick = (action: string) => {
    setIsOpen(false);
    switch (action) {
      case 'View Profile':
        navigate('/account');
        break;
      case 'Settings':
        navigate('/account');
        break;
      case 'Logout':
        signOut();
        navigate('/');
        break;
      default:
        break;
    }
  };

  // If no user is logged in, show login button
  if (!user) {
    return (
      <Link
        to="/auth"
        className="px-4 py-2 text-sm font-medium text-white bg-gold hover:bg-gold-dark rounded-lg transition-colors"
      >
        Sign In
      </Link>
    );
  }

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Profile Button */}
      <button
        onClick={toggleDropdown}
        className={`flex items-center gap-2 px-3 py-2 text-gold hover:text-gold-dark hover:bg-gold hover:bg-opacity-10 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gold focus:ring-opacity-20 ${isOpen ? 'bg-gold bg-opacity-10' : ''}`}
      >
        <img
          src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || user.email)}&background=c5a028&color=fff`}
          alt="Profile"
          className="w-8 h-8 rounded-full object-cover border-2 border-gold-light"
        />
        <span className="hidden md:block text-sm font-medium">{user.full_name || user.email}</span>
        <ChevronDown 
          size={16} 
          className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-xl z-[9999]"
          style={{ minWidth: '224px' }}
        >
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <img
                src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || user.email)}&background=c5a028&color=fff`}
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user.full_name || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <button
              onClick={() => handleMenuClick('View Profile')}
              className="flex items-center gap-3 w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <User size={16} />
              View Profile
            </button>

            <button
              onClick={() => handleMenuClick('Settings')}
              className="flex items-center gap-3 w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <Settings size={16} />
              Settings
            </button>
          </div>

          {/* Logout Section */}
          <div className="py-1 border-t border-gray-100">
            <button
              onClick={() => handleMenuClick('Logout')}
              className="flex items-center gap-3 w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Complete Navbar Component
const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const isActivePath = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Navigation Links */}
          <div className="flex items-center gap-8">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link to="/" className="text-xl font-bold text-gold hover:text-gold-dark transition-colors">
                Antique Bidderly
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline gap-6">
                <Link 
                  to="/auctions" 
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-all ${
                    isActivePath('/auctions') 
                      ? 'text-gold bg-gold bg-opacity-10' 
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Auctions
                </Link>
                <Link 
                  to="/categories" 
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-all ${
                    isActivePath('/categories') 
                      ? 'text-gold bg-gold bg-opacity-10' 
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Categories
                </Link>
                {user && (
                  <>
                    <Link 
                      to="/dashboard" 
                      className={`px-3 py-2 text-sm font-medium rounded-md transition-all ${
                        isActivePath('/dashboard') 
                          ? 'text-gold bg-gold bg-opacity-10' 
                          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      My Dashboard
                    </Link>
                    <Link 
                      to="/payments" 
                      className={`px-3 py-2 text-sm font-medium rounded-md transition-all ${
                        isActivePath('/payments') 
                          ? 'text-gold bg-gold bg-opacity-10' 
                          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      Payments
                    </Link>
                    {/* Admin-only: Manage Auctions */}
                    {user.role === 'admin' && (
                      <Link
                        to="/admin/manage-auctions"
                        className={`px-3 py-2 text-sm font-medium rounded-md transition-all ${
                          isActivePath('/admin/manage-auctions')
                            ? 'text-gold bg-gold bg-opacity-10'
                            : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        Manage Auctions
                      </Link>
                    )}
                    {/* Hide Pay Now & Create Auction for admin users */}
                    {user.role !== 'admin' && (
                      <>
                        <Link 
                          to="/payment-form" 
                          className={`px-3 py-2 text-sm font-medium rounded-md transition-all ${
                            isActivePath('/payment-form') 
                              ? 'text-gold bg-gold bg-opacity-10' 
                              : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                          }`}
                        >
                          Pay Now
                        </Link>
                        <Link 
                          to="/create-auction" 
                          className={`px-3 py-2 text-sm font-medium rounded-md transition-all ${
                            isActivePath('/create-auction') 
                              ? 'text-gold bg-gold bg-opacity-10' 
                              : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                          }`}
                        >
                          Create Auction
                        </Link>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="hidden md:block flex-1 max-w-lg mx-8">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gold" />
              </div>
              <input
                type="text"
                placeholder="Search..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold"
              />
            </div>
          </div>

          {/* Right Side - Notifications and Profile */}
          <div className="flex items-center gap-2">
            {/* Notifications - only show if user is logged in */}
            {user && <NotificationDropdown />}
            
            {/* Profile */}
            <ProfileDropdown />

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={toggleMobileMenu}
                className="p-2 text-gold hover:text-gold-dark hover:bg-gold hover:bg-opacity-10 rounded-lg transition-all duration-200"
              >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-gray-50">
              {/* Mobile Search */}
              <div className="relative mb-3">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gold" />
                </div>
                <input
                  type="text"
                  placeholder="Search..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold"
                />
              </div>
              
              {/* Mobile Links */}
              <Link 
                to="/auctions" 
                className={`block px-3 py-2 text-base font-medium rounded-md transition-all ${
                  isActivePath('/auctions') 
                    ? 'text-gold bg-gold bg-opacity-10' 
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Auctions
              </Link>
              <Link 
                to="/categories" 
                className={`block px-3 py-2 text-base font-medium rounded-md transition-all ${
                  isActivePath('/categories') 
                    ? 'text-gold bg-gold bg-opacity-10' 
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Categories
              </Link>
              {user && (
                <>
                  <Link 
                    to="/dashboard" 
                    className={`block px-3 py-2 text-base font-medium rounded-md transition-all ${
                      isActivePath('/dashboard') 
                        ? 'text-gold bg-gold bg-opacity-10' 
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    My Dashboard
                  </Link>
                  <Link 
                    to="/payments" 
                    className={`block px-3 py-2 text-base font-medium rounded-md transition-all ${
                      isActivePath('/payments') 
                        ? 'text-gold bg-gold bg-opacity-10' 
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Payments
                  </Link>
                  {/* Admin-only: Manage Auctions (mobile) */}
                  {user.role === 'admin' && (
                    <Link
                      to="/admin/manage-auctions"
                      className={`block px-3 py-2 text-base font-medium rounded-md transition-all ${
                        isActivePath('/admin/manage-auctions')
                          ? 'text-gold bg-gold bg-opacity-10'
                          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Manage Auctions
                    </Link>
                  )}
                  {/* Hide Pay Now & Create Auction for admin users (mobile) */}
                  {user.role !== 'admin' && (
                    <>
                      <Link 
                        to="/payment-form" 
                        className={`block px-3 py-2 text-base font-medium rounded-md transition-all ${
                          isActivePath('/payment-form') 
                            ? 'text-gold bg-gold bg-opacity-10' 
                            : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Pay Now
                      </Link>
                      <Link 
                        to="/create-auction" 
                        className={`block px-3 py-2 text-base font-medium rounded-md transition-all ${
                          isActivePath('/create-auction') 
                            ? 'text-gold bg-gold bg-opacity-10' 
                            : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Create Auction
                      </Link>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;