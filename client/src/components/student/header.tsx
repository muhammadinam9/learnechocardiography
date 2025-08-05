import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Icons } from "@/components/icons";
import { Link, useLocation } from "wouter";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function StudentHeader() {
  const { user, logoutMutation } = useAuth();
  const [, navigate] = useLocation();
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  const handleLogout = () => {
    logoutMutation.mutate();
    navigate('/auth');
  };
  
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="px-4 sm:px-6 lg:px-8 mx-auto max-w-7xl">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link href="/">
              <a className="text-primary font-bold text-xl flex items-center">
                <Icons.topic className="mr-2 h-6 w-6" />
                MCQ Practice
              </a>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700 hidden sm:block">
              {user?.fullName}
            </span>
            <Avatar>
              <AvatarFallback className="bg-primary text-white">
                {user?.fullName ? getInitials(user.fullName) : 'ST'}
              </AvatarFallback>
            </Avatar>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
            >
              <Icons.logout className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline-block">Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
