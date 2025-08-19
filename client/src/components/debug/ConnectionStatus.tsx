import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, RefreshCw, CheckCircle, XCircle } from 'lucide-react';

interface ConnectionStatusProps {
  className?: string;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ className = '' }) => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkConnection = async () => {
    setIsChecking(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

      const response = await fetch('/api/auth/profile', {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      setIsConnected(response.status < 500); // Any response < 500 means backend is reachable
      setLastCheck(new Date());
    } catch (error) {
      setIsConnected(false);
      setLastCheck(new Date());
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    // Check connection on mount
    checkConnection();

    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000);

    return () => clearInterval(interval);
  }, []);

  if (isConnected === null && !isChecking) {
    return null; // Still loading initial check
  }

  const getStatusColor = () => {
    if (isChecking) return 'text-blue-500';
    return isConnected ? 'text-green-500' : 'text-red-500';
  };

  const getStatusIcon = () => {
    if (isChecking) return <RefreshCw className="w-4 h-4 animate-spin" />;
    return isConnected ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />;
  };

  return (
    <div className={`${className}`}>
      {!isConnected && (
        <Alert variant="destructive" className="mb-4">
          <WifiOff className="h-4 w-4" />
          <AlertDescription>
            Cannot connect to backend server. Please check if the server is running on port 3002.
            <Button 
              variant="outline" 
              size="sm" 
              onClick={checkConnection}
              disabled={isChecking}
              className="ml-2"
            >
              {isChecking ? <RefreshCw className="w-3 h-3 animate-spin mr-1" /> : null}
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div className={`flex items-center gap-1 ${getStatusColor()}`}>
          {getStatusIcon()}
          <span>
            {isChecking ? 'Checking...' : isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        {lastCheck && (
          <span className="text-xs">
            Last check: {lastCheck.toLocaleTimeString()}
          </span>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={checkConnection}
          disabled={isChecking}
          className="h-6 px-2"
        >
          <RefreshCw className={`w-3 h-3 ${isChecking ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    </div>
  );
};

export default ConnectionStatus;
