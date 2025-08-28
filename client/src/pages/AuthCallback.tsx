import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const userParam = urlParams.get('user');
    const error = urlParams.get('error');
    const otpSent = urlParams.get('otp_sent');

    if (error) {
      toast({
        title: "Authentication Failed",
        description: "Google sign-in failed. Please try again.",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }

    if (token && userParam) {
      try {
        const userData = JSON.parse(decodeURIComponent(userParam));
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        toast({
          title: "Welcome!",
          description: "You have successfully signed in with Google.",
        });
        
        if (otpSent === '1') {
          toast({
            title: 'Temporary password sent',
            description: 'We emailed you a one-time password for future email logins. Check your inbox.',
          });
        }
        
        // Redirect admin users to dashboard, regular users to home
        if (userData.role === 'admin') {
          navigate('/dashboard');
        } else {
          navigate('/');
        }
      } catch (error) {
        console.error('Failed to parse OAuth callback data:', error);
        toast({
          title: "Error",
          description: "Failed to process authentication data.",
          variant: "destructive"
        });
        navigate('/auth');
      }
    } else {
      navigate('/auth');
    }
  }, [navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-4">Completing sign-in...</h2>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
      </div>
    </div>
  );
};

export default AuthCallback;
