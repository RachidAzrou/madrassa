import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Users,
  Calendar,
  BookText,
  ClipboardCheck,
  School,
  BookMarked,
  Percent,
  LogOut,
  Menu,
  X,
  Bell,
  ChevronDown,
  User,
  MessageCircle,
  Search,
  Settings,
  Mail
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import myMadrassaLogo from "@assets/myMadrassa.png";

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

  const mainNavigation = [
    {
      name: 'Dashboard',
      href: '/teacher/dashboard',
      icon: LayoutDashboard,
      current: location === '/teacher/dashboard'
    }
  ];

  const studentManagement = [
    {
      name: 'Mijn Klassen',
      href: '/teacher/classes',
      icon: Users,
      current: location.startsWith('/teacher/classes')
    },
    {
      name: 'Aanwezigheid',
      href: '/teacher/attendance',
      icon: ClipboardCheck,
      current: location.startsWith('/teacher/attendance')
    }
  ];

  const academic = [
    {
      name: 'Lessen',
      href: '/teacher/lessons',
      icon: BookText,
      current: location.startsWith('/teacher/lessons')
    },
    {
      name: 'Vakken',
      href: '/teacher/subjects',
      icon: School,
      current: location.startsWith('/teacher/subjects')
    },
    {
      name: 'Cijfers',
      href: '/teacher/grades',
      icon: Percent,
      current: location.startsWith('/teacher/grades')
    },
    {
      name: 'Rapporten',
      href: '/teacher/reports',
      icon: BookMarked,
      current: location.startsWith('/teacher/reports')
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
              src={myMadrassaLogo} 
              alt="myMadrassa Logo" 
              className="w-6 h-6"
            />
            <span className="text-lg font-bold text-[#1e40af]">myMadrassa</span>
          </div>



          {/* Top bar actions - Right */}
          <div className="flex items-center space-x-3">

            {/* Messages button */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Mail className="h-5 w-5 text-gray-600" />
                  {notifications.length > 0 && (
                    <Badge 
                      className="absolute -top-1 -right-1 w-4 h-4 p-0 flex items-center justify-center bg-[#1e40af]"
                      variant="default"
                    >
                      {notifications.length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-sm">Berichten</h3>
                    <button 
                      className="text-xs text-[#1e40af] hover:underline"
                      onClick={() => window.location.href = "/teacher/communications"}
                    >
                      Alle berichten
                    </button>
                  </div>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  <div className="py-6 text-center">
                    <p className="text-sm text-gray-500">Geen nieuwe berichten</p>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Notifications */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5 text-gray-600" />
                  {notifications.length > 0 && (
                    <Badge 
                      className="absolute -top-1 -right-1 w-4 h-4 p-0 flex items-center justify-center bg-[#1e40af]"
                      variant="default"
                    >
                      {notifications.length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-sm">Notificaties</h3>
                    <button className="text-xs text-[#1e40af] hover:underline">
                      Alle notificaties
                    </button>
                  </div>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  <div className="py-6 text-center">
                    <p className="text-sm text-gray-500">Geen notificaties</p>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* User profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 pl-2 pr-1 ml-1">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="bg-[#1e40af] text-white text-xs">
                      {profile?.firstName?.[0] || 'D'}{profile?.lastName?.[0] || 'T'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="ml-1.5 text-sm font-medium hidden md:inline-block">
                    {profile?.firstName} {profile?.lastName}
                  </span>
                  <ChevronDown className="h-4 w-4 ml-0.5 md:ml-1.5 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 flex flex-col">
                  <span className="text-sm font-medium">{profile?.firstName} {profile?.lastName}</span>
                  <span className="text-xs text-gray-500">Docent</span>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => window.location.href = '/teacher/profile'}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Mijn Profiel</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Uitloggen</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Sidebar - Admin Interface Copy - Starts below topbar */}
      <div className={`fixed top-12 bottom-0 left-0 z-50 w-52 bg-white shadow-lg transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:fixed lg:top-12 border-r border-[#e5e7eb]`}>
        
        {/* Mobile close button */}
        <div className="lg:hidden p-3 border-b border-[#e5e7eb]">
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
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
      </div>

      {/* Main content - Admin Style */}
      <div className="pt-12 lg:pl-52">
        <main className="bg-[#f7f9fc] min-h-screen p-6">
          {children}
        </main>
      </div>
    </div>
  );
}