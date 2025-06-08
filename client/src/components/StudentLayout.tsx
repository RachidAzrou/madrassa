import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import {
  Home,
  Users,
  UserCheck,
  BookOpen,
  User,
  FileText,
  GraduationCap,
  LogOut,
  Menu,
  X,
  Bell,
  Settings,
  ChevronDown,
  Mail,
  Search
} from "lucide-react";
import myMadrassaLogo from "@assets/myMadrassa.png";

interface StudentLayoutProps {
  children: React.ReactNode;
}

export default function StudentLayout({ children }: StudentLayoutProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: notifications = [] } = useQuery<any[]>({
    queryKey: ['/api/notifications/user/1'],
    staleTime: 30000,
  });

  const { data: profile } = useQuery<any>({
    queryKey: ['/api/profile'],
    staleTime: 60000,
  });

  const navigation = [
    {
      name: "Dashboard",
      href: "/",
      icon: Home,
      current: location === "/"
    },
    {
      name: "Mijn Klas",
      href: "/student/class",
      icon: Users,
      current: location === "/student/class"
    },
    {
      name: "Vakken",
      href: "/student/subjects",
      icon: BookOpen,
      current: location === "/student/subjects"
    },
    {
      name: "Aanwezigheid",
      href: "/student/attendance",
      icon: UserCheck,
      current: location === "/student/attendance"
    },
    {
      name: "Cijfers",
      href: "/student/grades",
      icon: GraduationCap,
      current: location === "/student/grades"
    },
    {
      name: "Docenten",
      href: "/student/teachers",
      icon: User,
      current: location === "/student/teachers"
    },
    {
      name: "Communicatie",
      href: "/student/communications",
      icon: Mail,
      current: location === "/student/communications"
    }
  ];

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-[#f7f9fc]">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Admin-Style Top bar */}
      <div className="bg-white shadow-sm border-b border-[#e5e7eb] fixed top-0 left-0 right-0 z-50 h-16">
        <div className="flex items-center justify-between h-full px-4 lg:px-6">
          {/* Left section - Logo */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <Menu className="h-5 w-5" />
            </button>
            
            <div className="flex items-center space-x-3">
              <img 
                src={myMadrassaLogo} 
                alt="myMadrassa" 
                className="h-8 w-8"
              />
              <span className="text-xl font-semibold text-gray-900">myMadrassa</span>
            </div>
          </div>

          {/* Center section - Search */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="Zoeken..."
              />
            </div>
          </div>

          {/* Right section - Actions */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button className="relative p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-md">
              <Bell className="h-5 w-5" />
              {notifications?.length > 0 && (
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white" />
              )}
            </button>

            {/* Settings */}
            <button className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-md">
              <Settings className="h-5 w-5" />
            </button>

            {/* Profile dropdown */}
            <div className="relative">
              <button className="flex items-center space-x-3 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <Avatar className="h-8 w-8">
                  {profile?.photoUrl ? (
                    <AvatarImage src={profile.photoUrl} alt={`${profile?.firstName} ${profile?.lastName}`} />
                  ) : (
                    <AvatarFallback className="bg-blue-600 text-white text-sm">
                      {profile?.firstName?.[0] || user?.firstName?.[0]}{profile?.lastName?.[0] || user?.lastName?.[0]}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="hidden lg:block text-left">
                  <p className="text-sm font-medium text-gray-700">
                    {profile?.firstName || user?.firstName} {profile?.lastName || user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500">Student</p>
                </div>
                <ChevronDown className="hidden lg:block h-4 w-4 text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Exact Admin-Style Sidebar */}
      <div className={`fixed top-16 bottom-0 left-0 z-50 w-64 bg-white shadow border-r border-gray-200 transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:fixed lg:top-16`}>
        
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200">
          <span className="text-lg font-semibold text-gray-900">Menu</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation - Exact Admin Style */}
        <nav className="mt-5 flex-1 px-2 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md cursor-pointer ${
                    isActive
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className={`mr-3 flex-shrink-0 h-5 w-5 ${
                    isActive ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500'
                  }`} />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main content - Admin Style */}
      <div className="lg:pl-64">
        <main className="bg-gray-50 min-h-screen pt-16 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}