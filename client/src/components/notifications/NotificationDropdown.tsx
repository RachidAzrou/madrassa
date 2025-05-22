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
import { Check, BellOff, Info, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';
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
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    
    if (notification.link) {
      setLocation(notification.link);
      setOpen(false);
    }
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
        <div className="bg-blue-500 py-2 px-3">
          <DropdownMenuLabel className="flex justify-between items-center p-0 text-white">
            <span className="font-medium">Notificaties</span>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAllAsRead()}
                className="h-7 text-xs px-2 bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white"
              >
                Alles gelezen
              </Button>
            )}
          </DropdownMenuLabel>
        </div>
        <div className="max-h-[350px] overflow-y-auto">
          <DropdownMenuGroup>
            {notifications.length === 0 ? (
              <div className="py-6 px-3 text-center text-muted-foreground">
                <BellOff className="h-6 w-6 mx-auto mb-2 text-blue-400 opacity-60" />
                <p className="text-sm text-gray-600">Geen notificaties</p>
              </div>
            ) : (
              <>
                {visibleNotifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className={`p-0 cursor-pointer hover:bg-gray-50 ${!notification.isRead ? 'bg-blue-50/20' : ''}`}
                    onClick={() => handleItemClick(notification)}
                  >
                    <div className="flex items-start gap-3 p-3 border-b border-gray-100 w-full">
                      <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start w-full">
                          <h4 className="font-medium text-sm text-gray-800">{notification.title}</h4>
                          <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                            {formatDate(notification.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        
                        <div className="flex justify-end mt-2 gap-1">
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleMarkAsRead(notification.id, e)}
                              className="h-6 text-xs px-2 text-blue-600 hover:bg-blue-50"
                            >
                              Gelezen
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleDelete(notification.id, e)}
                            className="h-6 text-xs px-2 text-gray-600 hover:bg-red-50 hover:text-red-600"
                          >
                            Verwijderen
                          </Button>
                          {notification.link && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs px-2 text-gray-600 hover:bg-blue-50"
                            >
                              Bekijken
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
                {notifications.length > 3 && !showAll && (
                  <div className="p-2 text-center">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowAll(true)}
                      className="w-full text-xs text-blue-600 hover:bg-blue-50"
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationDropdown;