import React, { useState } from 'react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuGroup, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Check, BellOff, Info, AlertTriangle, AlertCircle, CheckCircle, Trash2 } from 'lucide-react';
import { useNotifications, type Notification } from '@/contexts/NotificationContext';
import NotificationBell from './NotificationBell';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { useLocation } from 'wouter';

const NotificationDropdown: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { notifications, markAsRead, markAllAsRead, deleteNotification, unreadCount } = useNotifications();
  const [showAll, setShowAll] = useState(false);
  const visibleNotifications = showAll ? notifications : notifications.slice(0, 3);
  const [, setLocation] = useLocation();

  const handleMarkAsRead = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    markAsRead(id);
  };

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNotification(id);
  };

  const handleItemClick = (notification: Notification) => {
    // Alleen naar de notificatiepagina navigeren, niet automatisch als gelezen markeren
    setLocation('/notifications');
    setOpen(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'info':
        return <div className="bg-blue-100 p-2 rounded-full"><Info className="h-4 w-4 text-blue-600" /></div>;
      case 'warning':
        return <div className="bg-amber-100 p-2 rounded-full"><AlertTriangle className="h-4 w-4 text-amber-600" /></div>;
      case 'error':
        return <div className="bg-red-100 p-2 rounded-full"><AlertCircle className="h-4 w-4 text-red-600" /></div>;
      case 'success':
        return <div className="bg-green-100 p-2 rounded-full"><CheckCircle className="h-4 w-4 text-green-600" /></div>;
      default:
        return <div className="bg-blue-100 p-2 rounded-full"><Info className="h-4 w-4 text-blue-600" /></div>;
    }
  };
  
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: nl });
    } catch (error) {
      return 'Onbekende datum';
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <div>
          <NotificationBell onClick={() => setOpen(!open)} />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 p-0 shadow-lg border-gray-200 overflow-hidden" align="end">
        <div className="bg-primary py-2 px-3">
          <DropdownMenuLabel className="flex justify-between items-center p-0 text-primary-foreground">
            <span className="font-medium">Notificaties</span>
            {/* Alles gelezen knop verwijderd */}
          </DropdownMenuLabel>
        </div>
        <div className="max-h-[350px] overflow-y-auto">
          <DropdownMenuGroup>
            {notifications.length === 0 ? (
              <div className="py-6 px-3 text-center text-muted-foreground">
                <BellOff className="h-6 w-6 mx-auto mb-2 text-primary/40" />
                <p className="text-sm text-muted-foreground">Geen notificaties</p>
              </div>
            ) : (
              <>
                {visibleNotifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className={`p-0 cursor-pointer hover:bg-gray-50 group relative ${!notification.isRead ? 'bg-blue-50' : ''}`}
                    onClick={() => handleItemClick(notification)}
                  >
                    <div className="flex items-start gap-3 p-3 border-b border-gray-100 w-full">
                      <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>
                      <div className="flex-1 pr-7">
                        <div className="flex justify-between items-start w-full">
                          <h4 className="font-medium text-sm text-gray-800">{notification.title}</h4>
                          <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                            {formatDate(notification.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        
                        {/* Gelezen-knop verwijderd */}
                      </div>
                    </div>
                    <div className="absolute top-3 right-3 flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => handleDelete(notification.id, e)}
                        className="invisible group-hover:visible h-5 w-5 p-0 text-primary hover:bg-primary/10 rounded-full"
                        title="Verwijderen"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </DropdownMenuItem>
                ))}
                {notifications.length > 3 && !showAll && (
                  <div className="p-2 text-center">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowAll(true)}
                      className="w-full text-xs text-primary hover:bg-primary/10"
                    >
                      Meer weergeven ({notifications.length - 3})
                    </Button>
                  </div>
                )}
                {showAll && notifications.length > 3 && (
                  <div className="p-2 text-center">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowAll(false)}
                      className="w-full text-xs text-blue-600 hover:bg-blue-50"
                    >
                      Minder weergeven
                    </Button>
                  </div>
                )}
              </>
            )}
          </DropdownMenuGroup>
        </div>
        <DropdownMenuSeparator />
        <div className="p-2 bg-gray-50">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              setLocation('/notifications');
              setOpen(false);
            }}
            className="w-full text-sm font-medium text-primary hover:bg-primary/10"
          >
            Bekijk alles →
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationDropdown;