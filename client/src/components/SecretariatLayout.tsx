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
  const [readMessages, setReadMessages] = useState<Set<number>>(new Set());

  // Haal de profiel gegevens op voor actuele user data
  const { data: profileData } = useQuery({
    queryKey: ['/api/profile'],
    retry: 1
  });

  // Haal de notificaties op
  const { data: notificationsData } = useQuery({
    queryKey: ['/api/notifications/user/1'],
  });

  // Haal ongelezen berichten op van de echte Messages API
  const { data: unreadMessagesData } = useQuery({
    queryKey: [`/api/messages/unread/${profileData?.id}/${profileData?.role}`],
    enabled: !!profileData?.id && !!profileData?.role,
    refetchInterval: 30000,
  });

  // Haal daadwerkelijke berichten op voor de inbox
  const { data: inboxMessages } = useQuery({
    queryKey: [`/api/messages/receiver/${profileData?.id}/${profileData?.role}`],
    enabled: !!profileData?.id && !!profileData?.role,
    refetchInterval: 30000,
  });

  // Define all navigation items with their RBAC resources
  const allNavigationItems = [
    {
      name: 'Studentenbeheer',
      href: '/secretariat/students',
      icon: Users,
      current: location.startsWith('/secretariat/students'),
      resource: 'student' as const
    },
    {
      name: 'Voogdenbeheer',
      href: '/secretariat/guardians',
      icon: UserCheck,
      current: location.startsWith('/secretariat/guardians'),
      resource: 'guardian' as const
    },
    {
      name: 'Docentenbeheer',
      href: '/secretariat/teachers',
      icon: GraduationCap,
      current: location.startsWith('/secretariat/teachers'),
      resource: 'teacher' as const
    },
    {
      name: 'Klassenbeheer',
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
        .filter(msg => !msg.isRead)
        .slice(0, 5)
        .map(msg => ({
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
    const roleMap = {
      'administrator': 'Beheerder',
      'docent': 'Docent', 
      'teacher': 'Docent',
      'student': 'Student',
      'voogd': 'Voogd',
      'guardian': 'Voogd',
      'secretariaat': 'Secretariaat'
    };
    const role = roleMap[user?.role] || user?.role || 'Onbekend';
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
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar - Admin Style */}
      <div className="fixed top-0 left-0 right-0 z-50 w-full h-12 border-b border-gray-200 bg-white px-4 flex items-center justify-between">
        {/* Menu voor mobiel (links) */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="mr-2 lg:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-6 w-6 text-gray-600" />
        </Button>
        
        {/* Logo sectie - links */}
        <Link href="/secretariat" className="flex items-center h-full">
          <img src={myMadrassaLogo} alt="myMadrassa Logo" className="h-10 sm:h-11" />
        </Link>

        {/* Acties - rechts */}
        <div className="flex items-center space-x-1">
          {/* Zoekknop voor mobiel */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
          >
            <Search className="h-5 w-5 text-gray-600" />
          </Button>

          {/* Berichten knop */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Mail className="h-5 w-5 text-gray-600" />
                {unreadMessages.length > 0 && (
                  <Badge 
                    className="absolute -top-1 -right-1 w-4 h-4 p-0 flex items-center justify-center bg-blue-600"
                    variant="default"
                  >
                    {unreadMessages.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-sm">Berichten</h3>
                  <button 
                    className="text-xs text-blue-600 hover:underline"
                    onClick={() => window.location.href = "/messages"}
                  >
                    Alle berichten
                  </button>
                </div>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {unreadMessages.length === 0 ? (
                  <div className="py-6 text-center">
                    <p className="text-sm text-gray-500">Geen nieuwe berichten</p>
                  </div>
                ) : (
                  unreadMessages.map((message) => (
                    <div 
                      key={message.id}
                      className="py-2 px-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                      onClick={() => handleMessageClick(message.id)}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-8 w-8 mt-1">
                          <AvatarFallback className={`${message.bgColor} ${message.textColor}`}>
                            {message.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm">{message.sender}</p>
                            <span className="text-xs text-gray-500">{message.time}</span>
                          </div>
                          <p className="text-xs text-gray-600 line-clamp-2">{message.preview}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-3 border-t border-gray-200 bg-gray-50">
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-600/90 text-white text-xs h-8"
                  onClick={() => window.location.href = "/messages"}
                >
                  <Mail className="h-4 w-4 mr-2" /> Naar Berichten
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Notificaties */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5 text-gray-600" />
                {unreadCount > 0 && (
                  <Badge 
                    className="absolute -top-1 -right-1 w-4 h-4 p-0 flex items-center justify-center bg-blue-600"
                    variant="default"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-sm">Notificaties</h3>
                  <button 
                    className="text-xs text-blue-600 hover:underline"
                    onClick={() => setLocation('/notificaties')}
                  >
                    Alle notificaties
                  </button>
                </div>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-6 text-center">
                    <p className="text-sm text-gray-500">Geen notificaties</p>
                  </div>
                ) : (
                  notifications.slice(0, 5).map((notification: any) => (
                    <div 
                      key={notification.id} 
                      className={`py-2 px-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${!notification.isRead ? 'bg-blue-50' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`h-2 w-2 mt-2 rounded-full ${
                          notification.type === 'info' ? 'bg-blue-500' : 
                          notification.type === 'warning' ? 'bg-amber-500' : 
                          notification.type === 'success' ? 'bg-green-500' : 
                          'bg-red-500'
                        }`}></div>
                        <div>
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm">{notification.title}</p>
                            <span className="text-xs text-gray-500">
                              {new Date(notification.timestamp).toLocaleTimeString([], {
                                hour: '2-digit', 
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600">{notification.message}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-3 border-t border-gray-200 bg-gray-50">
                <Button variant="outline" className="w-full text-xs h-8">
                  Markeer alles als gelezen
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Gebruiker profiel */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 pl-2 pr-1 ml-1">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="bg-blue-600 text-white text-xs">
                    {userDisplayData.avatar}
                  </AvatarFallback>
                </Avatar>
                <span className="ml-1.5 text-sm font-medium hidden md:inline-block">{userDisplayData.name}</span>
                <ChevronDown className="h-4 w-4 ml-0.5 md:ml-1.5 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5 flex flex-col">
                <span className="text-sm font-medium">{userDisplayData.name}</span>
                <span className="text-xs text-gray-500">{userDisplayData.role}</span>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setLocation('/profile')}>
                <User className="mr-2 h-4 w-4" />
                <span>Mijn Profiel</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => {
                localStorage.clear();
                sessionStorage.clear();
                setLocation('/login');
              }}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Uitloggen</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex pt-12">
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-gray-900 bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar - Admin Style */}
        <div className={`fixed top-12 bottom-0 left-0 z-50 w-64 bg-white shadow-xl transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col border-r border-gray-200`}>
          
          {/* Mobile header with close button */}
          <div className="lg:hidden p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <span className="text-lg font-bold text-gray-900">myMadrassa</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Dashboard link */}
          <div className="px-3 pt-3 pb-2 border-b border-gray-100">
            <div className="bg-gray-50 rounded-md overflow-hidden">
              <Link href="/secretariat">
                <div className={`flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-all duration-200 cursor-pointer ${
                  location === "/secretariat"
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105"
                    : "text-gray-700 hover:text-blue-600 hover:bg-blue-50 hover:transform hover:scale-105"
                }`}>
                  <div className="flex-shrink-0">
                    <Home className={`h-4 w-4 transition-colors ${
                      location === "/secretariat" ? 'text-white' : 'text-gray-400 hover:text-blue-600'
                    }`} />
                  </div>
                  <span className="truncate whitespace-nowrap">Dashboard</span>
                </div>
              </Link>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex flex-col flex-1">
            <div className="flex-1 py-2 px-3 overflow-y-auto">
              <div className="space-y-4">
                <div className="pt-2">
                  <p className="mb-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Beheer
                  </p>
                  <div className="space-y-1.5">
                    {navigation
                      .filter(item => ['Studentenbeheer', 'Voogdenbeheer', 'Docentenbeheer', 'Klassenbeheer'].includes(item.name))
                      .map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link key={item.name} href={item.href}>
                            <div className={`flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-all duration-200 cursor-pointer ${
                              item.current
                                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105"
                                : "text-gray-600 hover:text-blue-600 hover:bg-blue-50 hover:transform hover:scale-105"
                            }`}>
                              <div className="flex-shrink-0">
                                <Icon className={`h-4 w-4 transition-colors ${
                                  item.current ? 'text-white' : 'text-gray-400 group-hover:text-blue-600'
                                }`} />
                              </div>
                              <span className="truncate whitespace-nowrap">{item.name}</span>
                            </div>
                          </Link>
                        );
                      })}
                  </div>
                </div>

                <div className="pt-2">
                  <p className="mb-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Onderwijs
                  </p>
                  <div className="space-y-1.5">
                    {navigation
                      .filter(item => ['Cursussen', 'Roosterbeheer'].includes(item.name))
                      .map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link key={item.name} href={item.href}>
                            <div className={`flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-all duration-200 cursor-pointer ${
                              item.current
                                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105"
                                : "text-gray-600 hover:text-blue-600 hover:bg-blue-50 hover:transform hover:scale-105"
                            }`}>
                              <div className="flex-shrink-0">
                                <Icon className={`h-4 w-4 transition-colors ${
                                  item.current ? 'text-white' : 'text-gray-400 group-hover:text-blue-600'
                                }`} />
                              </div>
                              <span className="truncate whitespace-nowrap">{item.name}</span>
                            </div>
                          </Link>
                        );
                      })}
                  </div>
                </div>

                <div className="pt-2">
                  <p className="mb-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Evaluatie
                  </p>
                  <div className="space-y-1.5">
                    {navigation
                      .filter(item => ['Rapporten'].includes(item.name))
                      .map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link key={item.name} href={item.href}>
                            <div className={`flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-all duration-200 cursor-pointer ${
                              item.current
                                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105"
                                : "text-gray-600 hover:text-blue-600 hover:bg-blue-50 hover:transform hover:scale-105"
                            }`}>
                              <div className="flex-shrink-0">
                                <Icon className={`h-4 w-4 transition-colors ${
                                  item.current ? 'text-white' : 'text-gray-400 group-hover:text-blue-600'
                                }`} />
                              </div>
                              <span className="truncate whitespace-nowrap">{item.name}</span>
                            </div>
                          </Link>
                        );
                      })}
                  </div>
                </div>

                <div className="pt-2">
                  <p className="mb-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Financiën
                  </p>
                  <div className="space-y-1.5">
                    {navigation
                      .filter(item => ['Betalingsbeheer'].includes(item.name))
                      .map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link key={item.name} href={item.href}>
                            <div className={`flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-all duration-200 cursor-pointer ${
                              item.current
                                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105"
                                : "text-gray-600 hover:text-blue-600 hover:bg-blue-50 hover:transform hover:scale-105"
                            }`}>
                              <div className="flex-shrink-0">
                                <Icon className={`h-4 w-4 transition-colors ${
                                  item.current ? 'text-white' : 'text-gray-400 group-hover:text-blue-600'
                                }`} />
                              </div>
                              <span className="truncate whitespace-nowrap">{item.name}</span>
                            </div>
                          </Link>
                        );
                      })}
                  </div>
                </div>

                <div className="pt-2">
                  <p className="mb-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Communicatie
                  </p>
                  <div className="space-y-1.5">
                    {navigation
                      .filter(item => ['Communicatie'].includes(item.name))
                      .map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link key={item.name} href={item.href}>
                            <div className={`flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-all duration-200 cursor-pointer ${
                              item.current
                                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105"
                                : "text-gray-600 hover:text-blue-600 hover:bg-blue-50 hover:transform hover:scale-105"
                            }`}>
                              <div className="flex-shrink-0">
                                <Icon className={`h-4 w-4 transition-colors ${
                                  item.current ? 'text-white' : 'text-gray-400 group-hover:text-blue-600'
                                }`} />
                              </div>
                              <span className="truncate whitespace-nowrap">{item.name}</span>
                            </div>
                          </Link>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>
          </nav>

          {/* Settings & Logout Section */}
          <div className="px-3 border-t border-gray-300 py-3 bg-gray-50">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-all duration-200 cursor-pointer text-gray-600 hover:text-blue-600 hover:bg-blue-50">
                <div className="flex-shrink-0">
                  <Settings className="h-4 w-4 transition-colors text-gray-400 hover:text-blue-600" />
                </div>
                <span className="truncate whitespace-nowrap">Instellingen</span>
              </div>
              <div
                onClick={handleLogout}
                className="flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-all duration-200 cursor-pointer text-gray-600 hover:text-red-600 hover:bg-red-50"
              >
                <div className="flex-shrink-0">
                  <LogOut className="h-4 w-4 transition-colors text-gray-400 hover:text-red-600" />
                </div>
                <span className="truncate whitespace-nowrap">Afmelden</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col lg:ml-0">
          {/* Page Content - Full Height */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}