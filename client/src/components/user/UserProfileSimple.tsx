import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Settings, 
  LogOut, 
  LayoutDashboard,
  Shield
} from 'lucide-react';

interface UserProfileProps {
  className?: string;
}

const UserProfileSimple: React.FC<UserProfileProps> = ({ className = '' }) => {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  console.log('UserProfileSimple component - Current user:', user);

  if (!user) {
    console.log('UserProfileSimple: No user found, component will not render');
    return null;
  }

  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      console.log('Signing out user...');
      setIsOpen(false); // Close dropdown immediately
      await signOut();
      console.log('User signed out successfully');
    } catch (error) {
      console.error('Error during sign out:', error);
    }
  };

  const handleMenuItemClick = () => {
    setIsOpen(false); // Close dropdown when navigating
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'premium':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className={`relative h-10 w-10 rounded-full focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 ${className}`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <Avatar className="h-10 w-10">
            <AvatarImage 
              src={user.avatar_url || user.profile_picture} 
              alt={user.full_name || user.email} 
            />
            <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-500 text-white font-semibold">
              {getInitials(user.full_name || user.email)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-56 mr-4 mt-2" 
        align="end" 
        side="bottom"
        forceMount
        sideOffset={5}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.full_name || 'User'}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
            {user.role && (
              <Badge 
                variant="secondary" 
                className={`w-fit text-xs mt-1 ${getRoleBadgeColor(user.role)}`}
              >
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </Badge>
            )}
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {/* Essential Navigation */}
        <DropdownMenuItem asChild>
          <Link to="/account" className="cursor-pointer" onClick={handleMenuItemClick}>
            <User className="mr-2 h-4 w-4" />
            <span>My Account</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link to="/dashboard" className="cursor-pointer" onClick={handleMenuItemClick}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </Link>
        </DropdownMenuItem>

        {user.role === 'admin' && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/admin" className="cursor-pointer" onClick={handleMenuItemClick}>
                <Shield className="mr-2 h-4 w-4 text-red-500" />
                <span className="text-red-600 font-medium">Admin Dashboard</span>
              </Link>
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />
        
        <DropdownMenuItem asChild>
          <Link to="/settings" className="cursor-pointer" onClick={handleMenuItemClick}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* PROMINENT LOGOUT BUTTON */}
        <DropdownMenuItem 
          className="cursor-pointer text-red-600 focus:text-red-600 hover:bg-red-50 font-medium"
          onClick={handleSignOut}
          onSelect={(e) => e.preventDefault()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserProfileSimple;
