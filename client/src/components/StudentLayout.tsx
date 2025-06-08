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
  ClipboardList,
  FileText,
  GraduationCap,
  LogOut,
  Menu,
  X,
  Bell,
  Settings,
  ChevronDown,
  MessageCircle,
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

  // Data fetching - admin interface copy
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
      name: "Mijn Docenten",
      href: "/student/teachers",
      icon: UserCheck,
      current: location === "/student/teachers"
    },
    {
      name: "Mijn Vakken",
      href: "/student/subjects",
      icon: BookOpen,
      current: location === "/student/subjects"
    },
    {
      name: "Aanwezigheid",
      href: "/student/attendance",
      icon: ClipboardList,
      current: location === "/student/attendance"
    },
    {
      name: "Cijfers",
      href: "/student/grades",
      icon: GraduationCap,
      current: location === "/student/grades"
    },
    {
      name: "Communicatie",
      href: "/student/communications",
      icon: MessageCircle,
      current: location === "/student/communications"
    },
    {
      name: "Rapportages",
      href: "/student/reports",
      icon: FileText,
      current: location === "/student/reports"
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

      {/* Top bar - Admin Style - Above everything */}
      <div className="bg-white shadow-sm border-b border-[#e5e7eb] fixed top-0 left-0 right-0 z-50 h-12">
        <div className="flex items-center justify-between h-12 px-4 lg:px-6">
          {/* Logo section - Left */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-700 mr-3"
            >
              <Menu className="w-5 h-5" />
            </button>
            <img 
              src={logoPath} 
              alt="myMadrassa Logo" 
              className="w-6 h-6"
            />
            <span className="text-lg font-bold text-[#1e40af]">myMadrassa</span>
          </div>

          {/* Search bar - Center */}
          <div className="hidden lg:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-2 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Zoeken..."
                className="w-full pl-9 pr-4 py-1.5 text-sm border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e40af] focus:border-transparent"
              />
            </div>
          </div>

          {/* Top bar actions - Right */}
          <div className="flex items-center space-x-3">
            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative h-8 w-8 p-0">
              <Bell className="h-4 w-4 text-gray-600" />
              {notifications?.length > 0 && (
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </Button>

            {/* Messages */}
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MessageCircle className="h-4 w-4 text-gray-600" />
            </Button>

            {/* Profile dropdown */}
            <div className="flex items-center space-x-2">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-[#1e40af] text-white text-xs">
                  {profile?.firstName?.[0] || user?.firstName?.[0]}{profile?.lastName?.[0] || user?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <ChevronDown className="h-3 w-3 text-gray-500 hidden lg:block" />
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar - Admin Interface Copy */}
      <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 border-r border-[#e5e7eb] pt-12`}>
        
        {/* Close button for mobile - Only visible on mobile */}
        <div className="lg:hidden flex justify-end p-3 border-b border-[#e5e7eb]">
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User info - Admin Style */}
        <div className="px-6 py-4 border-b border-[#e5e7eb] bg-[#f8fafc]">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-[#1e40af] text-white">
                {profile?.firstName?.[0] || user?.firstName?.[0]}{profile?.lastName?.[0] || user?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {profile?.firstName || user?.firstName} {profile?.lastName || user?.lastName}
              </p>
              <div className="flex items-center space-x-2 mt-1">
                <Badge className="bg-[#3b82f6] text-white text-xs px-2 py-0.5">
                  Student
                </Badge>
                {notifications?.length > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {notifications.length}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation - Admin Style */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.name} href={item.href} className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                item.current
                  ? 'bg-[#1e40af] text-white shadow-sm'
                  : 'text-gray-700 hover:bg-[#f1f5f9] hover:text-[#1e40af]'
              }`}>
                <Icon className={`mr-3 h-4 w-4 ${
                  item.current ? 'text-white' : 'text-gray-500 group-hover:text-[#1e40af]'
                }`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Logout button - Admin Style */}
        <div className="p-3 border-t border-[#e5e7eb]">
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg"
          >
            <LogOut className="mr-3 h-4 w-4" />
            Afmelden
          </Button>
        </div>
      </div>

      {/* Main content - Admin Style */}
      <div className="pt-12 lg:pl-64">
        <main className="bg-[#f7f9fc] min-h-screen p-6">
          {children}
        </main>
      </div>
    </div>
  );
}