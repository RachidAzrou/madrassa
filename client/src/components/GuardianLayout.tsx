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
  Search
} from "lucide-react";
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
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState<string>("");

  // Data fetching - admin interface copy
  const { data: notifications = [] } = useQuery<any[]>({
    queryKey: ['/api/notifications/user/1'],
    staleTime: 30000,
  });

  const { data: profile } = useQuery<any>({
    queryKey: ['/api/profile'],
    staleTime: 60000,
  });

  // Fetch guardian's children
  const { data: childrenData } = useQuery<{ children: Child[] }>({
    queryKey: ['/api/guardian/children'],
    retry: false,
  });

  const children_list = childrenData?.children || [];
  const selectedChild = children_list.find(child => child.id.toString() === selectedChildId);

  // Auto-select first child if none selected
  useEffect(() => {
    if (children_list.length > 0 && !selectedChildId) {
      setSelectedChildId(children_list[0].id.toString());
    }
  }, [children_list, selectedChildId]);

  const navigation = [
    {
      name: "Dashboard",
      href: "/",
      icon: Home,
      current: location === "/",
      disabled: !selectedChild
    },
    ...(children_list.length > 1 ? [{
      name: "Mijn Kinderen",
      href: "/guardian/children",
      icon: Users,
      current: location === "/guardian/children",
      disabled: false
    }] : []),
    {
      name: "Aanwezigheid",
      href: "/guardian/attendance",
      icon: ClipboardList,
      current: location === "/guardian/attendance",
      disabled: !selectedChild
    },
    {
      name: "Cijfers",
      href: "/guardian/grades",
      icon: GraduationCap,
      current: location === "/guardian/grades",
      disabled: !selectedChild
    },
    {
      name: "Rapportages",
      href: "/guardian/reports",
      icon: FileText,
      current: location === "/guardian/reports",
      disabled: !selectedChild
    },
    {
      name: "Communicatie",
      href: "/guardian/communications",
      icon: MessageCircle,
      current: location === "/guardian/communications",
      disabled: false
    },
    {
      name: "Betalingen",
      href: "/guardian/payments",
      icon: CreditCard,
      current: location === "/guardian/payments",
      disabled: false
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
                <Badge className="bg-[#8b5cf6] text-white text-xs px-2 py-0.5">
                  Voogd
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

        {/* Child selection - Admin Style */}
        {children_list.length > 0 && (
          <div className="px-6 py-4 border-b border-[#e5e7eb] bg-[#f8fafc]">
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Selecteer kind:
            </label>
            <Select value={selectedChildId} onValueChange={setSelectedChildId}>
              <SelectTrigger className="w-full border-[#e5e7eb]">
                <SelectValue placeholder="Kies een kind" />
              </SelectTrigger>
              <SelectContent className="bg-white border-[#e5e7eb]">
                {children_list.map((child) => (
                  <SelectItem key={child.id} value={child.id.toString()} className="focus:bg-blue-200 hover:bg-blue-100">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span>{child.firstName} {child.lastName}</span>
                      <span className="text-sm text-gray-500">({child.class})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedChild && (
              <div className="mt-2 text-sm text-gray-600">
                Student ID: {selectedChild.studentId} • Klas: {selectedChild.class}
              </div>
            )}
          </div>
        )}

        {/* Navigation - Admin Style */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.name} href={item.disabled ? "#" : item.href} className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                item.disabled 
                  ? 'text-gray-400 cursor-not-allowed'
                  : item.current
                    ? 'bg-[#1e40af] text-white shadow-sm'
                    : 'text-gray-700 hover:bg-[#f1f5f9] hover:text-[#1e40af]'
              }`}>
                <Icon className={`mr-3 h-4 w-4 ${
                  item.disabled
                    ? 'text-gray-300'
                    : item.current 
                      ? 'text-white' 
                      : 'text-gray-500 group-hover:text-[#1e40af]'
                }`} />
                <span className="truncate">{item.name}</span>
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
          {children_list.length === 0 ? (
            <div>
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Geen kinderen gevonden</h3>
                <p className="text-gray-600">
                  Er zijn geen kinderen gekoppeld aan dit account. Neem contact op met de school om uw kinderen te koppelen.
                </p>
              </div>
            </div>
          ) : !selectedChild ? (
            <div className="p-6">
              <div className="text-center py-12">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Selecteer een kind</h3>
                <p className="text-gray-600">
                  Kies een kind uit de lijst om de informatie te bekijken.
                </p>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}