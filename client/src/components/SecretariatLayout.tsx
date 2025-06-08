import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { 
  Users, 
  UserCheck, 
  GraduationCap, 
  School,
  MessageSquare, 
  CreditCard, 
  BarChart3, 
  Calendar, 
  BookOpen, 
  Settings, 
  LogOut, 
  X, 
  Home,
  Menu,
  Search,
  Bell,
  Mail,
  User,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import myMadrassaLogo from '@assets/myMadrassa.png';

interface SecretariatLayoutProps {
  children: React.ReactNode;
}

export default function SecretariatLayout({ children }: SecretariatLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();

  // Data fetching - admin interface copy
  const { data: profileData } = useQuery({
    queryKey: ['/api/profile'],
    retry: 1
  });

  const { data: notificationsData } = useQuery({
    queryKey: ['/api/notifications'],
    staleTime: 30000,
  });

  const { data: inboxMessages } = useQuery({
    queryKey: ['/api/messages/inbox'],
    staleTime: 30000,
  });

  const allNavigationItems = [
    {
      name: 'Dashboard',
      href: '/secretariat',
      icon: Home,
      current: location === '/secretariat',
      resource: 'dashboard' as const
    },
    {
      name: 'Studenten',
      href: '/secretariat/students',
      icon: Users,
      current: location.startsWith('/secretariat/students'),
      resource: 'student' as const
    },
    {
      name: 'Docenten',
      href: '/secretariat/teachers',
      icon: UserCheck,
      current: location.startsWith('/secretariat/teachers'),
      resource: 'teacher' as const
    },
    {
      name: 'Voogden',
      href: '/secretariat/guardians',
      icon: Users,
      current: location.startsWith('/secretariat/guardians'),
      resource: 'guardian' as const
    },
    {
      name: 'Klassen',
      href: '/secretariat/classes',
      icon: School,
      current: location.startsWith('/secretariat/classes'),
      resource: 'class' as const
    },
    {
      name: 'Cursussen',
      href: '/secretariat/courses',
      icon: BookOpen,
      current: location.startsWith('/secretariat/courses'),
      resource: 'course' as const
    },
    {
      name: 'Roosterbeheer',
      href: '/secretariat/schedule',
      icon: Calendar,
      current: location.startsWith('/secretariat/schedule'),
      resource: 'schedule' as const
    },
    {
      name: 'Rapporten',
      href: '/secretariat/reports',
      icon: BarChart3,
      current: location.startsWith('/secretariat/reports'),
      resource: 'report' as const
    },
    {
      name: 'Betalingsbeheer',
      href: '/secretariat/payments',
      icon: CreditCard,
      current: location.startsWith('/secretariat/payments'),
      resource: 'payment' as const
    },
    {
      name: 'Communicatie',
      href: '/secretariat/communications',
      icon: MessageSquare,
      current: location.startsWith('/secretariat/communications'),
      resource: 'communication' as const
    },
  ];

  // Filter ongelezen berichten en formatteer voor weergave
  const unreadMessages = Array.isArray(inboxMessages) 
    ? inboxMessages
        .filter((msg: any) => !msg.isRead)
        .slice(0, 5)
        .map((msg: any) => ({
          id: msg.id,
          sender: `${msg.senderFirstName || ''} ${msg.senderLastName || ''}`.trim(),
          initials: `${msg.senderFirstName?.[0] || ''}${msg.senderLastName?.[0] || ''}`,
          time: new Date(msg.createdAt).toLocaleDateString(),
          preview: msg.content?.substring(0, 60) + (msg.content?.length > 60 ? '...' : ''),
          bgColor: msg.senderRole === 'admin' ? 'bg-red-100' : 
                   msg.senderRole === 'secretariaat' ? 'bg-orange-100' :
                   msg.senderRole === 'docent' ? 'bg-green-100' :
                   msg.senderRole === 'voogd' ? 'bg-purple-100' : 'bg-blue-100',
          textColor: msg.senderRole === 'admin' ? 'text-red-800' : 
                     msg.senderRole === 'secretariaat' ? 'text-orange-800' :
                     msg.senderRole === 'docent' ? 'text-green-800' :
                     msg.senderRole === 'voogd' ? 'text-purple-800' : 'text-blue-800'
        }))
    : [];

  const handleMessageClick = (messageId: number) => {
    setLocation(`/messages?messageId=${messageId}`);
  };

  // Generate user display data from profile data (preferred) or authenticated user
  const getUserDisplayData = () => {
    const userData = profileData || user;
    if (!userData) return { name: 'Gebruiker', role: 'Onbekend', avatar: 'G' };
    
    const name = `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.name || userData.email || 'Gebruiker';
    const roleMap: { [key: string]: string } = {
      'administrator': 'Beheerder',
      'docent': 'Docent', 
      'teacher': 'Docent',
      'student': 'Student',
      'voogd': 'Voogd',
      'guardian': 'Voogd',
      'secretariaat': 'Secretariaat'
    };
    const role = roleMap[user?.role || ''] || user?.role || 'Onbekend';
    const avatar = `${userData.firstName?.[0] || ''}${userData.lastName?.[0] || ''}`.toUpperCase();
    
    return { name, role, avatar };
  };

  const userDisplayData = getUserDisplayData();

  // Bereken het aantal ongelezen notificaties
  const notifications = notificationsData?.notifications || [];
  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  // Show all navigation items for secretariat role
  const navigation = allNavigationItems;

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
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="relative h-8 w-8 p-0">
                  <Bell className="h-4 w-4 text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 bg-white border border-[#e5e7eb]">
                <div className="p-3 border-b border-[#e5e7eb]">
                  <h3 className="font-semibold text-gray-900">Meldingen</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      Geen nieuwe meldingen
                    </div>
                  ) : (
                    notifications.slice(0, 5).map((notification: any) => (
                      <div key={notification.id} className="p-3 border-b border-gray-100 hover:bg-gray-50">
                        <p className="text-sm text-gray-900">{notification.title}</p>
                        <p className="text-xs text-gray-500 mt-1">{notification.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* Messages */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="relative h-8 w-8 p-0">
                  <Mail className="h-4 w-4 text-gray-600" />
                  {unreadMessages.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadMessages.length}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 bg-white border border-[#e5e7eb]">
                <div className="p-3 border-b border-[#e5e7eb]">
                  <h3 className="font-semibold text-gray-900">Berichten</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {unreadMessages.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      Geen nieuwe berichten
                    </div>
                  ) : (
                    unreadMessages.map((message) => (
                      <div 
                        key={message.id} 
                        className="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleMessageClick(message.id)}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`w-8 h-8 rounded-full ${message.bgColor} flex items-center justify-center`}>
                            <span className={`text-xs font-medium ${message.textColor}`}>
                              {message.initials}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {message.sender}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {message.preview}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {message.time}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* Profile dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-[#1e40af] text-white text-xs">
                      {userDisplayData.avatar}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-white border border-[#e5e7eb]" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{userDisplayData.name}</p>
                    <p className="w-[200px] truncate text-sm text-muted-foreground">
                      {userDisplayData.role}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLocation('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profiel</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Instellingen</span>
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
                {userDisplayData.avatar}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {userDisplayData.name}
              </p>
              <div className="flex items-center space-x-2 mt-1">
                <Badge className="bg-[#3b82f6] text-white text-xs px-2 py-0.5">
                  {userDisplayData.role}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation - Admin Style */}
        <nav className="flex-1 px-3 py-4 space-y-1">
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
        <main className="overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}