import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  BookOpen,
  Building,
  Calendar,
  ClipboardCheck,
  GraduationCap as Medal,
  BarChart3,
  LogOut,
  Menu,
  X,
  CreditCard,
  UserPlus,
  Settings,
  School,
  FileText,
  Clock,
} from "lucide-react";

type SidebarLinkProps = {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick?: () => void;
};

const SidebarLink = ({ href, icon, label, isActive, onClick }: SidebarLinkProps) => {
  return (
    <Link href={href}>
      <div
        onClick={onClick}
        className={cn(
          "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors cursor-pointer",
          isActive
            ? "bg-primary text-white"
            : "text-gray-600 hover:text-primary hover:bg-gray-100"
        )}
      >
        {icon}
        <span>{label}</span>
      </div>
    </Link>
  );
};

type SidebarProps = {
  isMobile?: boolean;
  onClose?: () => void;
};

const Sidebar = ({ isMobile = false, onClose }: SidebarProps) => {
  const [location] = useLocation();
  const [expanded, setExpanded] = useState(!isMobile);

  // Adjust sidebar on window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setExpanded(true);
      } else if (isMobile) {
        setExpanded(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMobile]);

  // Handle click on mobile
  const handleLinkClick = () => {
    if (isMobile && onClose) {
      onClose();
    }
  };

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 bg-white border-r border-gray-200",
        "w-64 transition-transform duration-300 ease-in-out",
        isMobile && !expanded && "-translate-x-full",
        "flex flex-col"
      )}
    >
      {/* Logo and header */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <GraduationCap className="text-white h-5 w-5" />
          </div>
          <span className="text-xl font-semibold text-gray-800">EduManage</span>
        </div>
        {isMobile && (
          <button 
            onClick={onClose} 
            className="p-1 rounded-full text-gray-500 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation links */}
      <nav className="flex-1 py-6 px-3 overflow-y-auto">
        <div className="space-y-1.5">
          <SidebarLink
            href="/"
            icon={<LayoutDashboard className="h-5 w-5" />}
            label="Dashboard"
            isActive={location === "/"}
            onClick={handleLinkClick}
          />
          <SidebarLink
            href="/students"
            icon={<Users className="h-5 w-5" />}
            label="Students"
            isActive={location === "/students"}
            onClick={handleLinkClick}
          />
          <SidebarLink
            href="/courses"
            icon={<BookOpen className="h-5 w-5" />}
            label="Courses"
            isActive={location === "/courses"}
            onClick={handleLinkClick}
          />
          <SidebarLink
            href="/programs"
            icon={<Building className="h-5 w-5" />}
            label="Programs"
            isActive={location === "/programs"}
            onClick={handleLinkClick}
          />
          <SidebarLink
            href="/calendar"
            icon={<Calendar className="h-5 w-5" />}
            label="Calendar"
            isActive={location === "/calendar"}
            onClick={handleLinkClick}
          />
          <SidebarLink
            href="/attendance"
            icon={<ClipboardCheck className="h-5 w-5" />}
            label="Attendance"
            isActive={location === "/attendance"}
            onClick={handleLinkClick}
          />
          <SidebarLink
            href="/grading"
            icon={<Medal className="h-5 w-5" />}
            label="Grading"
            isActive={location === "/grading"}
            onClick={handleLinkClick}
          />
          <SidebarLink
            href="/reports"
            icon={<BarChart3 className="h-5 w-5" />}
            label="Reports"
            isActive={location === "/reports"}
            onClick={handleLinkClick}
          />
        </div>
      </nav>

      {/* User profile */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
            <span className="font-semibold">JD</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">Admin User</p>
            <p className="text-xs text-gray-500 truncate">admin@edumanage.com</p>
          </div>
          <button className="p-1.5 rounded text-gray-500 hover:bg-gray-100">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
