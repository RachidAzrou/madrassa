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
  Calendar,
  BookOpen,
  UserCheck,
  GraduationCap,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  ChevronDown,
  User,
  MessageCircle,
  Search
} from "lucide-react";
import logoPath from "@assets/myMadrassa.png";

interface TeacherLayoutProps {
  children: React.ReactNode;
}

export default function TeacherLayout({ children }: TeacherLayoutProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Data fetching for notifications
  const { data: notifications = [] } = useQuery<any[]>({
    queryKey: ['/api/notifications/user/1'],
    staleTime: 30000,
  });

  const { data: profile } = useQuery<any>({
    queryKey: ['/api/profile'],
    staleTime: 60000,
  });

  // Navigation sections - Admin style structure
  const mainNavigation = [
    {
      name: 'Dashboard',
      href: '/teacher',
      icon: Home,
      current: location === '/teacher' || location === '/teacher/'
    }
  ];

  const studentManagement = [
    {
      name: 'Studenten',
      href: '/teacher/students',
      icon: Users,
      current: location.startsWith('/teacher/students')
    },
    {
      name: 'Klassen',
      href: '/teacher/classes',
      icon: GraduationCap,
      current: location.startsWith('/teacher/classes')
    },
    {
      name: 'Aanwezigheid',
      href: '/teacher/attendance',
      icon: UserCheck,
      current: location.startsWith('/teacher/attendance')
    }
  ];

  const academic = [
    {
      name: 'Cijfers',
      href: '/teacher/grades',
      icon: FileText,
      current: location.startsWith('/teacher/grades')
    },
    {
      name: 'Vakken',
      href: '/teacher/subjects',
      icon: BookOpen,
      current: location.startsWith('/teacher/subjects')
    },
    {
      name: 'Agenda',
      href: '/teacher/calendar',
      icon: Calendar,
      current: location.startsWith('/teacher/calendar')
    }
  ];

  const communication = [
    {
      name: 'Berichten',
      href: '/teacher/communications',
      icon: MessageCircle,
      current: location.startsWith('/teacher/communications')
    }
  ];

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-[#f7f9fc] lg:flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Admin Interface Copy */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:relative lg:flex lg:flex-col border-r border-[#e5e7eb]`}>
        
        {/* Logo - Admin Style */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-[#e5e7eb] bg-white">
          <div className="flex items-center space-x-3">
            <img 
              src={logoPath} 
              alt="myMadrassa Logo" 
              className="w-8 h-8"
            />
            <span className="text-xl font-bold text-[#1e40af]">myMadrassa</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
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
                <Badge className="bg-[#10b981] text-white text-xs px-2 py-0.5">
                  Docent
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

        {/* Navigation - Admin Style with grouped sections */}
        <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
          {/* Main Navigation */}
          <div className="space-y-1">
            {mainNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link 
                  key={item.name} 
                  href={item.href} 
                  className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                    item.current
                      ? 'bg-[#1e40af] text-white shadow-sm'
                      : 'text-gray-700 hover:bg-[#f1f5f9] hover:text-[#1e40af]'
                  }`}
                >
                  <Icon className={`mr-3 h-4 w-4 ${
                    item.current ? 'text-white' : 'text-gray-500 group-hover:text-[#1e40af]'
                  }`} />
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Student Management */}
          <div className="space-y-1">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Studentenbeheer
            </div>
            {studentManagement.map((item) => {
              const Icon = item.icon;
              return (
                <Link 
                  key={item.name} 
                  href={item.href} 
                  className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                    item.current
                      ? 'bg-[#1e40af] text-white shadow-sm'
                      : 'text-gray-700 hover:bg-[#f1f5f9] hover:text-[#1e40af]'
                  }`}
                >
                  <Icon className={`mr-3 h-4 w-4 ${
                    item.current ? 'text-white' : 'text-gray-500 group-hover:text-[#1e40af]'
                  }`} />
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Academic */}
          <div className="space-y-1">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Academisch
            </div>
            {academic.map((item) => {
              const Icon = item.icon;
              return (
                <Link 
                  key={item.name} 
                  href={item.href} 
                  className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                    item.current
                      ? 'bg-[#1e40af] text-white shadow-sm'
                      : 'text-gray-700 hover:bg-[#f1f5f9] hover:text-[#1e40af]'
                  }`}
                >
                  <Icon className={`mr-3 h-4 w-4 ${
                    item.current ? 'text-white' : 'text-gray-500 group-hover:text-[#1e40af]'
                  }`} />
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Communication */}
          <div className="space-y-1">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Communicatie
            </div>
            {communication.map((item) => {
              const Icon = item.icon;
              return (
                <Link 
                  key={item.name} 
                  href={item.href} 
                  className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                    item.current
                      ? 'bg-[#1e40af] text-white shadow-sm'
                      : 'text-gray-700 hover:bg-[#f1f5f9] hover:text-[#1e40af]'
                  }`}
                >
                  <Icon className={`mr-3 h-4 w-4 ${
                    item.current ? 'text-white' : 'text-gray-500 group-hover:text-[#1e40af]'
                  }`} />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Logout button - Admin Style */}
        <div className="p-3 border-t border-[#e5e7eb]">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start text-gray-700 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="mr-3 h-4 w-4" />
            Uitloggen
          </Button>
        </div>
      </div>

      {/* Main content - Admin Style */}
      <div className="flex-1 lg:flex lg:flex-col">
        {/* Top bar - Admin Style */}
        <div className="bg-white shadow-sm border-b border-[#e5e7eb] sticky top-0 z-40">
          <div className="flex items-center justify-between h-16 px-4 lg:px-6">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            {/* Mobile logo */}
            <div className="lg:hidden flex items-center space-x-2">
              <img 
                src={logoPath} 
                alt="myMadrassa Logo" 
                className="w-6 h-6"
              />
              <span className="font-semibold text-[#1e40af]">myMadrassa</span>
            </div>

            {/* Search bar - Desktop */}
            <div className="hidden lg:flex flex-1 max-w-md ml-4">
              <div className="relative w-full">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Zoeken..."
                  className="w-full pl-9 pr-4 py-2 text-sm border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e40af] focus:border-transparent"
                />
              </div>
            </div>

            {/* User actions - Admin Style */}
            <div className="flex items-center space-x-3">
              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5 text-gray-600" />
                {notifications?.length > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 bg-red-500 text-xs text-white flex items-center justify-center">
                    {notifications.length}
                  </Badge>
                )}
              </Button>

              {/* User menu */}
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-[#1e40af] text-white text-sm">
                    {profile?.firstName?.[0] || user?.firstName?.[0]}{profile?.lastName?.[0] || user?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-900">
                    {profile?.firstName || user?.firstName} {profile?.lastName || user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500">Docent</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}