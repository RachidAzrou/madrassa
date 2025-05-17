import { useState } from "react";
import { Bell, Menu, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

type HeaderProps = {
  onMenuClick: () => void;
  title: string; // We behouden de prop maar gebruiken hem niet in de weergave
};

const Header = ({ onMenuClick }: HeaderProps) => {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Nieuwe inschrijving",
      message: "Zaina El Mouden is ingeschreven voor Arabisch",
      time: "5 minuten geleden",
      read: false
    },
    {
      id: 2,
      title: "Aanwezigheid bijgewerkt",
      message: "Aanwezigheid voor Groep 3A is bijgewerkt",
      time: "1 uur geleden",
      read: false
    },
    {
      id: 3,
      title: "Nieuw bericht",
      message: "U heeft een nieuw bericht van Ahmed Hassan",
      time: "3 uur geleden",
      read: true
    }
  ]);

  // Aantal ongelezen meldingen berekenen
  const unreadCount = notifications.filter(n => !n.read).length;

  // Functie om een melding als gelezen te markeren
  const markAsRead = (id: number) => {
    setNotifications(notifications.map(notification => 
      notification.id === id 
        ? { ...notification, read: true }
        : notification
    ));
  };

  // Functie om alle meldingen als gelezen te markeren
  const markAllAsRead = () => {
    setNotifications(notifications.map(notification => ({ ...notification, read: true })));
  };

  return (
    <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuClick}
        className="md:hidden bg-blue-50 hover:bg-blue-100 text-blue-800 shadow-sm"
      >
        <Menu className="h-5 w-5" />
      </Button>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="bg-blue-50 hover:bg-blue-100 text-blue-800 relative shadow-sm">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge 
                className="absolute -top-1 -right-1 px-1.5 py-0.5 h-5 min-w-[20px] flex items-center justify-center bg-red-500 text-white"
              >
                {unreadCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="end">
          <div className="p-3 border-b flex items-center justify-between">
            <h3 className="font-medium">Meldingen</h3>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={markAllAsRead} 
                className="text-xs h-8 px-2 py-1"
              >
                Alles als gelezen markeren
              </Button>
            )}
          </div>
          <ScrollArea className="max-h-[300px]">
            {notifications.length > 0 ? (
              <div className="divide-y">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`p-3 hover:bg-gray-50 ${notification.read ? '' : 'bg-blue-50'}`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-sm">{notification.title}</h4>
                      <span className="text-xs text-gray-500">{notification.time}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">
                Geen meldingen
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>
      
      <Button variant="ghost" size="icon" className="bg-blue-50 hover:bg-blue-100 text-blue-800 shadow-sm" asChild>
        <Link href="/settings">
          <Settings className="h-5 w-5" />
        </Link>
      </Button>
    </div>
  );
};

export default Header;
