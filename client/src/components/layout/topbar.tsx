import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { 
  Bell, 
  MessageSquare, 
  User, 
  Search, 
  Settings,
  LogOut,
  ChevronDown,
  Mail,
  Menu,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { useMobile } from "@/hooks/use-mobile";
import { useAuth } from '@/contexts/AuthContext';

// Import logo
import myMadrassaLogo from '@/assets/mymadrassa_logo.png';

// Notificatie type definitie
type Notification = {
  id: number;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  type: 'info' | 'warning' | 'success' | 'error';
};

interface TopbarProps {
  onMenuClick?: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps = {}) {
  const isMobile = useMobile();
  const [, setLocation] = useLocation();
  const [readMessages, setReadMessages] = useState<Set<number>>(new Set());
  const { user } = useAuth();
  
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
    refetchInterval: 30000, // Auto-refresh elke 30 seconden
  });

  // Haal daadwerkelijke berichten op voor de inbox
  const { data: inboxMessages } = useQuery({
    queryKey: [`/api/messages/receiver/${profileData?.id}/${profileData?.role}`],
    enabled: !!profileData?.id && !!profileData?.role,
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

  // State voor het tonen van de zoekbalk
  const [showSearch, setShowSearch] = useState(false);

  // Bereken het aantal ongelezen notificaties
  const notifications = notificationsData?.notifications || [];
  const unreadCount = notifications.filter((n: Notification) => !n.isRead).length;

  return (
    <div className="w-full h-12 border-b border-gray-200 bg-white px-4 flex items-center justify-between">
      {/* Menu voor mobiel (links) */}
      {isMobile && (
        <Button 
          variant="ghost" 
          size="icon" 
          className="mr-2"
          onClick={onMenuClick}
        >
          <Menu className="h-6 w-6 text-gray-600" />
        </Button>
      )}
      
      {/* Logo sectie - links */}
      <Link href="/dashboard" className="flex items-center h-full">
        <img src={myMadrassaLogo} alt="myMadrassa Logo" className="h-10 sm:h-11" />
      </Link>

      {/* Zoekbalk - midden (optioneel) */}
      {showSearch && (
        <div className="mx-4 flex-1 max-w-md relative hidden md:block">
          <input
            type="text"
            placeholder="Zoeken..."
            className="w-full pl-9 pr-4 py-1.5 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1e40af] focus:border-transparent"
          />
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
      )}

      {/* Acties - rechts */}
      <div className="flex items-center space-x-1">
        {/* Zoekknop voor mobiel */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden"
          onClick={() => setShowSearch(!showSearch)}
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
                  className="absolute -top-1 -right-1 w-4 h-4 p-0 flex items-center justify-center bg-[#1e40af]"
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
                  className="text-xs text-[#1e40af] hover:underline"
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
                className="w-full bg-[#1e40af] hover:bg-[#1e40af]/90 text-white text-xs h-8"
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
                  className="absolute -top-1 -right-1 w-4 h-4 p-0 flex items-center justify-center bg-[#1e40af]"
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
                <Link href="/notifications">
                  <a className="text-xs text-[#1e40af] hover:underline">Alle notificaties</a>
                </Link>
              </div>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-sm text-gray-500">Geen notificaties</p>
                </div>
              ) : (
                notifications.slice(0, 5).map((notification: Notification) => (
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
                <AvatarFallback className="bg-[#1e40af] text-white text-xs">
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
              // Wis alle gebruikersgegevens en navigeer naar login
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
  );
}