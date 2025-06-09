import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
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

  School,
  ClipboardCheck,
  MessageCircle,
  Percent
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
      icon: LayoutDashboard,
      current: location === "/"
    },
    {
      name: "Mijn Klas",
      href: "/student/class",
      icon: School,
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
      icon: ClipboardCheck,
      current: location === "/student/attendance"
    },
    {
      name: "Cijfers",
      href: "/student/grades",
      icon: Percent,
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
      icon: MessageCircle,
      current: location === "/student/communications"
    }
  ];


  const [readMessages, setReadMessages] = useState<Set<number>>(new Set());

  // Haal ongelezen berichten op van de echte Messages API
  const { data: unreadMessagesData } = useQuery({
    queryKey: [`/api/messages/unread/${profile?.id}/${profile?.role}`],
    enabled: !!profile?.id && !!profile?.role,
    refetchInterval: 30000, // Auto-refresh elke 30 seconden
  });

  // Haal daadwerkelijke berichten op voor de inbox
  const { data: inboxMessages } = useQuery({
    queryKey: [`/api/messages/receiver/${profile?.id}/${profile?.role}`],
    enabled: !!profile?.id && !!profile?.role,
    refetchInterval: 30000,
  });

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
    window.location.href = `/student/communications?messageId=${messageId}`;
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      // Call API to mark all notifications as read
      // This would normally update the backend
      console.log('Marking all notifications as read');
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };



  // Generate user display data from profile data (preferred) or authenticated user
  const getUserDisplayData = () => {
    const userData = profile || user;
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
    const role = (user?.role && roleMap[user.role as keyof typeof roleMap]) || user?.role || 'Student';
    const avatar = `${userData.firstName?.[0] || ''}${userData.lastName?.[0] || ''}`.toUpperCase();
    
    return { name, role, avatar };
  };

  const userDisplayData = getUserDisplayData();

  // Bereken het aantal ongelezen notificaties
  const unreadCount = notifications?.filter((n: any) => !n.isRead).length || 0;

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-25 z-40 lg:hidden transition-opacity duration-200"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Top bar - Modern SaaS Header */}
      <div className="w-full h-16 border-b border-slate-200 bg-white px-4 sm:px-6 flex items-center justify-between fixed top-0 left-0 right-0 z-50 shadow-sm">
        {/* Menu voor mobiel (links) */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="mr-2 lg:hidden h-12 w-12 rounded-xl hover:bg-slate-100 transition-colors duration-200"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-6 w-6 text-slate-600" />
        </Button>
        
        {/* Logo sectie - links */}
        <Link href="/student" className="flex items-center h-full">
          <img src={myMadrassaLogo} alt="myMadrassa Logo" className="h-10 lg:h-12" />
        </Link>



        {/* Acties - rechts */}
        <div className="flex items-center space-x-2">
          {/* Berichten knop */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-12 w-12 rounded-xl hover:bg-slate-100 transition-colors duration-200">
                <Mail className="h-6 w-6 text-slate-600" />
                {unreadMessages.length > 0 && (
                  <Badge 
                    className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center bg-blue-600 text-white text-xs font-medium border-2 border-white"
                    variant="default"
                  >
                    {unreadMessages.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-96 p-0 mx-2 shadow-xl border-slate-200 rounded-2xl">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-base">Berichten</h3>
                  <button 
                    className="text-sm text-[#1e40af] hover:underline touch-manipulation"
                    onClick={() => window.location.href = "/student/communications"}
                  >
                    Alle berichten
                  </button>
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {unreadMessages.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-base text-gray-500">Geen nieuwe berichten</p>
                  </div>
                ) : (
                  unreadMessages.map((message) => (
                    <div 
                      key={message.id}
                      className="py-4 px-4 hover:bg-gray-50 active:bg-gray-100 cursor-pointer border-b border-gray-100 touch-manipulation"
                      onClick={() => handleMessageClick(message.id)}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10 mt-1">
                          <AvatarFallback className={`${message.bgColor} ${message.textColor}`}>
                            {message.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm truncate">{message.sender}</p>
                            <span className="text-xs text-gray-500 ml-2">{message.time}</span>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2 mt-1">{message.preview}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <Button 
                  className="w-full bg-[#1e40af] hover:bg-[#1e40af]/90 text-white text-base h-10 touch-manipulation"
                  onClick={() => window.location.href = "/student/communications"}
                >
                  <Mail className="h-4 w-4 mr-2" /> Naar Berichten
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Notificaties */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-10 w-10 touch-manipulation">
                <Bell className="h-5 w-5 text-gray-600" />
                {unreadCount > 0 && (
                  <Badge 
                    className="absolute -top-1 -right-1 w-4 h-4 p-0 flex items-center justify-center bg-[#1e40af] text-xs"
                    variant="default"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[95vw] max-w-sm p-0 mx-2">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-base">Notificaties</h3>
                  <button 
                    className="text-sm text-[#1e40af] hover:underline touch-manipulation"
                    onClick={() => window.location.href = "/notificaties"}
                  >
                    Alle notificaties
                  </button>
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {!notifications || notifications.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-base text-gray-500">Geen notificaties</p>
                  </div>
                ) : (
                  notifications.slice(0, 5).map((notification: any) => (
                    <div 
                      key={notification.id} 
                      className={`py-4 px-4 hover:bg-gray-50 active:bg-gray-100 cursor-pointer border-b border-gray-100 touch-manipulation ${!notification.isRead ? 'bg-blue-50' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`h-3 w-3 mt-2 rounded-full ${
                          notification.type === 'info' ? 'bg-blue-500' : 
                          notification.type === 'warning' ? 'bg-amber-500' : 
                          notification.type === 'success' ? 'bg-green-500' : 
                          'bg-red-500'
                        }`}></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm truncate">{notification.title}</p>
                            <span className="text-xs text-gray-500 ml-2">
                              {new Date(notification.timestamp).toLocaleTimeString([], {
                                hour: '2-digit', 
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <Button 
                  variant="outline" 
                  className="w-full text-base h-10 touch-manipulation"
                  onClick={handleMarkAllNotificationsRead}
                  disabled={unreadCount === 0}
                >
                  Markeer alles als gelezen
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Gebruiker profiel */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 pl-2 pr-1 ml-0.5 sm:ml-1 touch-manipulation">
                <Avatar className="h-7 w-7 sm:h-6 sm:w-6">
                  <AvatarFallback className="bg-[#1e40af] text-white text-xs">
                    {userDisplayData.avatar}
                  </AvatarFallback>
                </Avatar>
                <span className="ml-1.5 text-sm font-medium hidden sm:inline-block truncate max-w-20">{userDisplayData.name}</span>
                <ChevronDown className="h-4 w-4 ml-0.5 sm:ml-1.5 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 mx-2">
              <div className="px-3 py-3 flex flex-col">
                <span className="text-base font-medium truncate">{userDisplayData.name}</span>
                <span className="text-sm text-gray-500">{userDisplayData.role}</span>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => window.location.href = '/student/profile'}
                className="py-3 px-3 text-base touch-manipulation"
              >
                <User className="mr-3 h-5 w-5" />
                <span>Mijn Profiel</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleLogout}
                className="py-3 px-3 text-base touch-manipulation"
              >
                <LogOut className="mr-3 h-5 w-5" />
                <span>Uitloggen</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Modern SaaS Sidebar */}
      <div className={`fixed top-16 bottom-0 left-0 z-50 w-72 bg-white shadow-xl border-r border-slate-200 transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:fixed lg:top-16`}>
        
        {/* Mobile close button */}
        <div className="lg:hidden p-4 border-b border-slate-200">
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors duration-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modern Navigation */}
        <nav className="mt-6 flex-1 px-4 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl cursor-pointer transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-blue-600 active:bg-slate-200'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className={`mr-4 flex-shrink-0 h-5 w-5 ${
                    isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-600'
                  }`} />
                  <span className="font-medium">{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Modern Main Content Area */}
      <div className="pt-16 lg:pl-72">
        <main className="bg-slate-50 min-h-screen p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}