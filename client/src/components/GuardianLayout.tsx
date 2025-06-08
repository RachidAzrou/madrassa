import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  CreditCard,
  LogOut,
  Menu,
  X,
  User,
  Bell,
  Settings,
  ChevronDown,
  MessageCircle,
  Search,
  Mail
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import logoPath from "@assets/myMadrassa.png";

interface GuardianLayoutProps {
  children: React.ReactNode;
}

interface Child {
  id: number;
  firstName: string;
  lastName: string;
  studentId: string;
  class: string;
}

export default function GuardianLayout({ children }: GuardianLayoutProps) {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState<string>("");

  // Data fetching - exact admin interface copy
  const { data: notifications = [] } = useQuery<any[]>({
    queryKey: ['/api/notifications/user/1'],
    staleTime: 30000,
  });

  const { data: profile } = useQuery<any>({
    queryKey: ['/api/profile'],
    staleTime: 60000,
  });

  const { data: children_list = [], isLoading: childrenLoading } = useQuery<Child[]>({
    queryKey: ['/api/guardian/children'],
    staleTime: 60000,
  });

  // Auto-select first child if none selected
  useEffect(() => {
    if (children_list.length > 0 && !selectedChildId) {
      setSelectedChildId(children_list[0].id.toString());
    }
  }, [children_list, selectedChildId]);

  const selectedChild = children_list.find(child => child.id.toString() === selectedChildId);

  // Navigation - exact admin interface structure
  const mainNavigation = [
    {
      name: 'Dashboard',
      href: '/guardian/dashboard',
      icon: Home,
      current: location === '/guardian/dashboard'
    }
  ];

  const studentInfo = [
    {
      name: 'Student Profiel',
      href: '/guardian/student-profile',
      icon: UserCheck,
      current: location.startsWith('/guardian/student-profile')
    },
    {
      name: 'Academische Prestaties',
      href: '/guardian/academic-performance',
      icon: GraduationCap,
      current: location.startsWith('/guardian/academic-performance')
    },
    {
      name: 'Aanwezigheid',
      href: '/guardian/attendance',
      icon: ClipboardList,
      current: location.startsWith('/guardian/attendance')
    }
  ];

  const financialManagement = [
    {
      name: 'Schoolgeld',
      href: '/guardian/fees',
      icon: CreditCard,
      current: location.startsWith('/guardian/fees')
    },
    {
      name: 'Betalingsgeschiedenis',
      href: '/guardian/payment-history',
      icon: FileText,
      current: location.startsWith('/guardian/payment-history')
    }
  ];

  const communication = [
    {
      name: 'Berichten',
      href: '/guardian/communications',
      icon: MessageCircle,
      current: location.startsWith('/guardian/communications')
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

      {/* Top bar - Exact Admin Style */}
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

          {/* Actions - Right */}
          <div className="flex items-center space-x-3">
            {/* Mobile search button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
            >
              <Search className="h-5 w-5 text-gray-600" />
            </Button>

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
                      onClick={() => window.location.href = "/guardian/communications"}
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
                      {profile?.firstName?.[0] || 'V'}{profile?.lastName?.[0] || 'G'}
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
                  <span className="text-xs text-gray-500">Voogd</span>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/guardian/profile" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>Mijn Profiel</span>
                  </Link>
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

      {/* Sidebar - Exact Admin Interface Copy */}
      <div className={`fixed top-12 bottom-0 left-0 z-50 w-64 bg-white shadow-lg transform ${
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

        {/* Child selector - Same styling as admin */}
        <div className="p-4 border-b border-[#e5e7eb]">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Kind selecteren
          </label>
          <Select value={selectedChildId} onValueChange={setSelectedChildId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecteer een kind" />
            </SelectTrigger>
            <SelectContent>
              {children_list.map((child) => (
                <SelectItem key={child.id} value={child.id.toString()}>
                  {child.firstName} {child.lastName} - {child.studentId}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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

          {/* Student Information */}
          <div className="space-y-1">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Student Informatie
            </div>
            {studentInfo.map((item) => {
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

          {/* Financial Management */}
          <div className="space-y-1">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Financieel Beheer
            </div>
            {financialManagement.map((item) => {
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
      <div className="pt-12 lg:pl-64">
        <main className="bg-[#f7f9fc] min-h-screen p-6">
          {childrenLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-[#1e40af] border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Kinderen laden...</p>
            </div>
          ) : !selectedChild ? (
            <div className="text-center py-12">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Selecteer een kind</h3>
              <p className="text-gray-600 mb-6">
                Kies een van uw kinderen uit de lijst in de sidebar om hun informatie te bekijken.
              </p>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}