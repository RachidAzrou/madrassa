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
  
  // Haal de notificaties op
  const { data: notificationsData } = useQuery({
    queryKey: ['/api/notifications/user/1'],
  });

  // Hardcoded berichten voor demo (later vervangen door echte API data)
  const allMessages = [
    {
      id: 1,
      sender: "Karim Salhi",
      initials: "KS",
      time: "Vandaag, 10:42",
      preview: "Vraag over het huiswerk voor morgen, kunnen we bespreken?",
      bgColor: "bg-amber-100",
      textColor: "text-amber-800"
    },
    {
      id: 2,
      sender: "Fatima El Amrani", 
      initials: "FE",
      time: "Gisteren, 15:20",
      preview: "Goed nieuws! Het project is goedgekeurd. Laten we volgende week een vergadering plannen.",
      bgColor: "bg-green-100",
      textColor: "text-green-800"
    }
  ];

  // Filter uit gelezen berichten
  const unreadMessages = allMessages.filter(msg => !readMessages.has(msg.id));

  const handleMessageClick = (messageId: number) => {
    // Markeer bericht als gelezen
    setReadMessages(prev => new Set([...prev, messageId]));
    // Navigeer naar de berichtenpagina met het specifieke bericht
    setLocation(`/messages?messageId=${messageId}`);
  };

  // Gebruiker informatie (hardcoded voor nu)
  const user = {
    name: 'Admin',
    role: 'Beheerder',
    avatar: 'A'
  };

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
      <div className="flex items-center h-full">
        <Link href="/dashboard" className="flex items-center">
          <img src={myMadrassaLogo} alt="myMadrassa Logo" className="h-10 sm:h-11" />
        </Link>
      </div>

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
                <Link href="/notificaties">
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
                  {user.avatar}
                </AvatarFallback>
              </Avatar>
              <span className="ml-1.5 text-sm font-medium hidden md:inline-block">{user.name}</span>
              <ChevronDown className="h-4 w-4 ml-0.5 md:ml-1.5 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5 flex flex-col">
              <span className="text-sm font-medium">{user.name}</span>
              <span className="text-xs text-gray-500">{user.role}</span>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setLocation('/profiel')}>
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