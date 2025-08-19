import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Mail, 
  Lock, 
  User,
  Eye, 
  EyeOff, 
  Loader2,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Shield
} from 'lucide-react';

const registerSchema = z.object({
  fullName: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
  email: z.string()
    .email('Please enter a valid email address')
    .toLowerCase(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  onSubmit: (data: RegisterFormData) => Promise<void>;
  loading?: boolean;
  className?: string;
}

const RegisterForm: React.FC<RegisterFormProps> = ({
  onSubmit,
  loading = false,
  className = ''
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid, touchedFields }
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: ''
    }
  });

  const password = watch('password');
  const confirmPassword = watch('confirmPassword');

  // Password strength indicator
  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, text: '', color: '' };
    
    let strength = 0;
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    
    strength = Object.values(checks).filter(Boolean).length;
    
    const strengthData = {
      0: { text: '', color: '' },
      1: { text: 'Very Weak', color: 'text-red-500' },
      2: { text: 'Weak', color: 'text-red-500' },
      3: { text: 'Fair', color: 'text-yellow-500' },
      4: { text: 'Good', color: 'text-green-500' },
      5: { text: 'Strong', color: 'text-green-500' }
    };
    
    return { 
      strength, 
      ...strengthData[strength as keyof typeof strengthData]
    };
  };

  const handleFormSubmit = async (data: RegisterFormData) => {
    try {
      // Transform the data to match API expectations
      const submitData = {
        fullName: data.fullName.trim(),
        email: data.email.trim().toLowerCase(),
        password: data.password
      };
      
      await onSubmit(submitData);
    } catch (error: any) {
      toast({
        title: 'Registration Failed',
        description: error.message || 'An error occurred during registration',
        variant: 'destructive'
      });
    }
  };

  const passwordStrength = getPasswordStrength(password);

  return (
    <form 
      onSubmit={handleSubmit(handleFormSubmit)} 
      className={`space-y-4 ${className}`}
    >
      {/* Full Name Field */}
      <div className="space-y-2">
        <Label htmlFor="fullName" className="text-sm font-medium">
          Full Name
        </Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="fullName"
            type="text"
            {...register('fullName')}
            placeholder="Enter your full name"
            className={`pl-10 ${errors.fullName ? 'border-red-500' : ''}`}
            disabled={loading}
          />
        </div>
        {errors.fullName && (
          <p className="text-sm text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.fullName.message}
          </p>
        )}
      </div>

      {/* Email Field */}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium">
          Email Address
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            {...register('email')}
            placeholder="Enter your email address"
            className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
            disabled={loading}
          />
        </div>
        {errors.email && (
          <p className="text-sm text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium">
          Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            {...register('password')}
            placeholder="Create a strong password"
            className={`pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
            disabled={loading}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-sm text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.password.message}
          </p>
        )}
        
        {/* Password Strength Indicator */}
        {password && (
          <div className="space-y-2">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((level) => (
                <div
                  key={level}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    level <= passwordStrength.strength
                      ? passwordStrength.strength <= 2
                        ? 'bg-red-500'
                        : passwordStrength.strength <= 3
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                      : 'bg-muted'
                  }`}
                />
              ))}
            </div>
            {passwordStrength.text && (
              <p className={`text-xs ${passwordStrength.color}`}>
                {passwordStrength.text}
              </p>
            )}
            
            {/* Password Requirements */}
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium">Password must contain:</p>
              <ul className="space-y-1 ml-2">
                <li className={password.length >= 8 ? 'text-green-600' : ''}>
                  • At least 8 characters
                </li>
                <li className={/[a-z]/.test(password) ? 'text-green-600' : ''}>
                  • One lowercase letter
                </li>
                <li className={/[A-Z]/.test(password) ? 'text-green-600' : ''}>
                  • One uppercase letter
                </li>
                <li className={/\d/.test(password) ? 'text-green-600' : ''}>
                  • One number
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Confirm Password Field */}
      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-sm font-medium">
          Confirm Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            {...register('confirmPassword')}
            placeholder="Confirm your password"
            className={`pl-10 pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
            disabled={loading}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-sm text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.confirmPassword.message}
          </p>
        )}
        {password && confirmPassword && password === confirmPassword && !errors.confirmPassword && (
          <p className="text-sm text-green-500 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Passwords match
          </p>
        )}
      </div>

      {/* Terms Agreement */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription className="text-xs">
          By creating an account, you agree to our{' '}
          <button 
            type="button"
            className="text-gold hover:underline"
            onClick={() => {
              // TODO: Open terms modal or navigate to terms page
              toast({
                title: "Terms of Service",
                description: "Terms of service page coming soon.",
              });
            }}
          >
            Terms of Service
          </button>{' '}
          and{' '}
          <button 
            type="button"
            className="text-gold hover:underline"
            onClick={() => {
              // TODO: Open privacy modal or navigate to privacy page
              toast({
                title: "Privacy Policy",
                description: "Privacy policy page coming soon.",
              });
            }}
          >
            Privacy Policy
          </button>.
        </AlertDescription>
      </Alert>

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full mt-6"
        disabled={loading || !isValid}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating Account...
          </>
        ) : (
          <>
            Create Account
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
    </form>
  );
};

export default RegisterForm;
