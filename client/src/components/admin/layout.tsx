import { useState } from "react";
import { AdminSidebar } from "@/components/admin/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { useLocation } from "wouter";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logoutMutation } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
  
  // Get current page title based on pathname
  const [location] = useLocation();
  const getPageTitle = () => {
    if (location === '/admin') return 'Dashboard';
    if (location === '/admin/upload-questions') return 'Upload Questions';
    if (location === '/admin/manage-questions') return 'Manage Questions';
    if (location === '/admin/manage-students') return 'Manage Students';
    if (location === '/admin/analytics') return 'Analytics';
    return 'Admin Panel';
  };
  
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="flex flex-1">
        {/* Sidebar for larger screens and overlay for mobile */}
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-gray-900/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}
        
        {/* Left sidebar background (visible on larger screens) */}
        <div className="hidden lg:block lg:fixed lg:inset-y-0 lg:z-10 lg:w-64 bg-gray-800">
          {/* This div just provides the background for the sidebar area */}
        </div>
        
        {/* Main content */}
        <div className="lg:pl-64 flex-1 flex flex-col w-full">
          <header className="bg-white border-b border-gray-200 w-full">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16 items-center">
                <div className="flex items-center">
                  <button 
                    onClick={() => setSidebarOpen(true)} 
                    className="lg:hidden text-gray-500 hover:text-gray-700"
                  >
                    <Icons.menu className="h-6 w-6" />
                  </button>
                  <h1 className="ml-4 text-xl font-semibold text-gray-900">{getPageTitle()}</h1>
                </div>
                
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-gray-700 hidden sm:inline-block">
                    {user?.fullName}
                  </span>
                  <div className="flex items-center space-x-2">
                    <Avatar>
                      <AvatarFallback className="bg-primary text-white">
                        {user?.fullName ? getInitials(user.fullName) : 'AD'}
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
            </div>
          </header>
          
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
