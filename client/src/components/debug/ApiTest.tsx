import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

const ApiTest: React.FC = () => {
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');
  const [fullName, setFullName] = useState('Test User');
  const [loading, setLoading] = useState(false);
  const { signUp, signIn } = useAuth();
  const { toast } = useToast();

  const testSignup = async () => {
    setLoading(true);
    try {
      const result = await signUp(email, password, fullName);
      if (result.error) {
        toast({
          title: 'Signup Failed',
          description: result.error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Signup Success!',
          description: 'User created successfully',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Network error occurred',
        variant: 'destructive',
      });
    }
    setLoading(false);
  };

  const testSignin = async () => {
    setLoading(true);
    try {
      const result = await signIn(email, password);
      if (result.error) {
        toast({
          title: 'Signin Failed',
          description: result.error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Signin Success!',
          description: 'User signed in successfully',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Network error occurred',
        variant: 'destructive',
      });
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">API Test</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="test@example.com"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password123"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Full Name</label>
          <Input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Test User"
          />
        </div>
        
        <div className="flex space-x-2">
          <Button onClick={testSignup} disabled={loading} className="flex-1">
            {loading ? 'Loading...' : 'Test Signup'}
          </Button>
          <Button onClick={testSignin} disabled={loading} variant="outline" className="flex-1">
            {loading ? 'Loading...' : 'Test Signin'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ApiTest;
