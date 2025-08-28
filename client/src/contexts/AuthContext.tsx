import React, { createContext, useContext, useEffect, useState } from 'react';
import apiService from '@/services/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface AuthContextType {
  user: any;
  session: any;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing auth session on mount
  useEffect(() => {
    const checkAuthSession = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (token && storedUser) {
        try {
          const data = await apiService.getProfile();
          setUser(data.user);
          setSession({ token });
        } catch (error) {
          console.error('Auth session check failed:', error);
          // Token is invalid, clear storage
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      
      setLoading(false);
    };

    checkAuthSession();

    // Handle OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const userParam = urlParams.get('user');
    
    if (token && userParam) {
      try {
        const userData = JSON.parse(decodeURIComponent(userParam));
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        setSession({ token });
        
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (error) {
        console.error('Failed to parse OAuth callback data:', error);
      }
    }
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const data = await apiService.signup({ email, password, fullName });
      
      // New signup flow: Don't auto-login, just return success
      // The user will need to sign in separately
      return { error: null, data };
    } catch (error: any) {
      return { error: { message: error.message || 'Signup failed' } };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const data = await apiService.signin({ email, password });
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      setSession({ token: data.token });
      return { error: null };
    } catch (error: any) {
      return { error: { message: error.message || 'Sign in failed' } };
    }
  };

  const signInWithGoogle = async () => {
    try {
      // Ask backend if Google OAuth is properly configured
      const res = await fetch(`${API_BASE_URL}/auth/google/config`, { credentials: 'include' }).catch(() => null);
      if (res && res.ok) {
        const cfg = await res.json();
        if (cfg.enabled) {
          window.location.href = `${API_BASE_URL}/auth/google`;
          return { error: null };
        }
        // If not enabled but not production, backend will serve mock at /auth/google
        if (cfg.environment !== 'production') {
          window.location.href = `${API_BASE_URL}/auth/google`;
          return { error: null };
        }
        return { error: { message: 'Google sign-in is not configured.' } };
      }
      // Fallback: try the endpoint (dev mock may still work)
      window.location.href = `${API_BASE_URL}/auth/google`;
      return { error: null };
    } catch (error) {
      return { error: { message: 'Failed to initiate Google sign-in' } };
    }
  };

  const signOut = async () => {
    try {
      // Clear all stored data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.clear();
      
      // Clear user state
      setUser(null);
      setSession(null);
      
      // Force page reload to clear any cached data
      window.location.reload();
    } catch (error) {
      console.error('Sign out error:', error);
      // Even if there's an error, clear the data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.clear();
      setUser(null);
      setSession(null);
      window.location.reload();
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signUp,
      signIn,
      signInWithGoogle,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
};
