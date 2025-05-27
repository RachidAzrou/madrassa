import { useState } from 'react';
import { Link } from 'wouter';
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
  // Haal de notificaties op
  const { data: notificationsData } = useQuery({
    queryKey: ['/api/notifications/user/1'],
  });

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
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Mijn Profiel</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Instellingen</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => {
              localStorage.removeItem('user');
              window.location.href = '/login';
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