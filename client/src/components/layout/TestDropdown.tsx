import React, { useState, useRef, useEffect } from 'react';
import { Bell, User, ChevronDown } from 'lucide-react';

const TestDropdown = () => {
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="flex items-center gap-4 p-4 bg-white border-b">
      <h1 className="text-xl font-bold">Test Dropdowns</h1>
      
      {/* Test Notification Dropdown */}
      <div className="relative" ref={notificationRef}>
        <button
          onClick={() => {
            console.log('Notification clicked, current state:', notificationOpen);
            setNotificationOpen(!notificationOpen);
          }}
          className="relative p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1 rounded-full">
            3
          </span>
        </button>
        
        {notificationOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-[9999]">
            <div className="p-4">
              <h3 className="font-semibold mb-2">Notifications</h3>
              <div className="space-y-2">
                <div className="p-2 bg-gray-50 rounded">
                  <p className="text-sm">Test notification 1</p>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <p className="text-sm">Test notification 2</p>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <p className="text-sm">Test notification 3</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Test Profile Dropdown */}
      <div className="relative" ref={profileRef}>
        <button
          onClick={() => {
            console.log('Profile clicked, current state:', profileOpen);
            setProfileOpen(!profileOpen);
          }}
          className="flex items-center gap-2 p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          <User size={20} />
          <span>Test User</span>
          <ChevronDown size={16} className={`transform transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {profileOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-[9999]">
            <div className="p-2">
              <div className="p-2 hover:bg-gray-50 rounded cursor-pointer">
                View Profile
              </div>
              <div className="p-2 hover:bg-gray-50 rounded cursor-pointer">
                Settings
              </div>
              <hr className="my-1" />
              <div className="p-2 hover:bg-gray-50 rounded cursor-pointer text-red-600">
                Sign Out
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestDropdown;
