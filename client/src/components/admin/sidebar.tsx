import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SidebarLinkProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isActive: boolean;
}

function SidebarLink({ href, icon, children, isActive }: SidebarLinkProps) {
  return (
    <Link href={href}>
      <a
        className={cn(
          "flex items-center px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white transition",
          isActive && "bg-gray-800 text-white"
        )}
      >
        <span className="mr-3">{icon}</span>
        <span>{children}</span>
      </a>
    </Link>
  );
}

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const [location] = useLocation();

  return (
    <div
      className={cn(
        "fixed inset-y-0 left-0 w-64 bg-gray-900 text-white transform transition-transform duration-200 ease-in-out z-40 shrink-0",
        "lg:translate-x-0 lg:relative lg:inset-auto lg:h-auto",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-800">
        <div className="text-xl font-bold">Admin Panel</div>
        <button
          onClick={onClose}
          className="lg:hidden text-gray-400 hover:text-white focus:outline-none"
        >
          <Icons.close className="h-5 w-5" />
        </button>
      </div>

      <nav className="mt-4">
        <SidebarLink
          href="/admin"
          icon={<Icons.dashboard className="h-5 w-5" />}
          isActive={location === "/admin"}
        >
          Dashboard
        </SidebarLink>
        
        <SidebarLink
          href="/admin/manage-questions"
          icon={<Icons.questions className="h-5 w-5" />}
          isActive={location === "/admin/manage-questions"}
        >
          Manage Questions
        </SidebarLink>
        
        <SidebarLink
          href="/admin/manage-topics"
          icon={<Icons.tag className="h-5 w-5" />}
          isActive={location === "/admin/manage-topics"}
        >
          Manage Topics
        </SidebarLink>
        
        <SidebarLink
          href="/admin/upload-questions"
          icon={<Icons.upload className="h-5 w-5" />}
          isActive={location === "/admin/upload-questions"}
        >
          Upload Questions
        </SidebarLink>
        
        <SidebarLink
          href="/admin/manage-students"
          icon={<Icons.users className="h-5 w-5" />}
          isActive={location === "/admin/manage-students"}
        >
          Manage Students
        </SidebarLink>
        
        <SidebarLink
          href="/admin/user-approvals"
          icon={<Icons.check className="h-5 w-5" />}
          isActive={location === "/admin/user-approvals"}
        >
          User Approvals
        </SidebarLink>
        
        <SidebarLink
          href="/admin/analytics"
          icon={<Icons.chart className="h-5 w-5" />}
          isActive={location === "/admin/analytics"}
        >
          Analytics
        </SidebarLink>
        
        <SidebarLink
          href="/admin/backup-management"
          icon={<Icons.database className="h-5 w-5" />}
          isActive={location === "/admin/backup-management"}
        >
          Backup Management
        </SidebarLink>
      </nav>
    </div>
  );
}
