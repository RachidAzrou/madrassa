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
import { Check, Trash2, BellOff, ExternalLink } from 'lucide-react';
import { useNotifications, type Notification } from '@/contexts/NotificationContext';
import NotificationBell from './NotificationBell';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { useLocation } from 'wouter';

const NotificationDropdown: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { notifications, markAsRead, markAllAsRead, deleteNotification, unreadCount } = useNotifications();
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
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    
    if (notification.link) {
      setLocation(notification.link);
      setOpen(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'info':
        return <div className="bg-blue-100 text-blue-500 p-2 rounded-full" />;
      case 'warning':
        return <div className="bg-amber-100 text-amber-500 p-2 rounded-full" />;
      case 'error':
        return <div className="bg-red-100 text-red-500 p-2 rounded-full" />;
      case 'success':
        return <div className="bg-green-100 text-green-500 p-2 rounded-full" />;
      default:
        return <div className="bg-gray-100 text-gray-500 p-2 rounded-full" />;
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
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Notificaties</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsRead()}
              className="text-xs"
            >
              <Check className="h-4 w-4 mr-1" />
              Alles gelezen
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-[400px] overflow-y-auto">
          <DropdownMenuGroup>
            {notifications.length === 0 ? (
              <div className="py-4 px-2 text-center text-muted-foreground">
                <BellOff className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p>Geen notificaties</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={`p-3 cursor-pointer ${!notification.isRead ? 'bg-muted/50' : ''}`}
                  onClick={() => handleItemClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div>{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start w-full">
                        <h4 className="font-medium text-sm">{notification.title}</h4>
                        <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                          {formatDate(notification.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <div className="flex justify-end mt-2 gap-2">
                        {!notification.isRead && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => handleMarkAsRead(notification.id, e)}
                            className="h-7 text-xs px-2"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Gelezen
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDelete(notification.id, e)}
                          className="h-7 text-xs px-2 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Verwijderen
                        </Button>
                        {notification.link && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs px-2"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Bekijken
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuGroup>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationDropdown;