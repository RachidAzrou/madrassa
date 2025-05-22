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
import { Check, Trash2, BellOff, ExternalLink, Info, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';
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
      <DropdownMenuContent className="w-96 p-0 shadow-lg border-gray-200 overflow-hidden" align="end">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 py-3 px-4">
          <DropdownMenuLabel className="flex justify-between items-center p-0 text-white">
            <span className="text-lg font-medium">Notificaties</span>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAllAsRead()}
                className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white"
              >
                <Check className="h-3.5 w-3.5 mr-1" />
                Alles gelezen
              </Button>
            )}
          </DropdownMenuLabel>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          <DropdownMenuGroup>
            {notifications.length === 0 ? (
              <div className="py-10 px-4 text-center text-muted-foreground">
                <div className="bg-blue-50 rounded-full p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <BellOff className="h-8 w-8 text-blue-400 opacity-70" />
                </div>
                <p className="text-base font-medium text-gray-600">Geen notificaties</p>
                <p className="text-sm text-gray-500 mt-1">U bent helemaal bij!</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={`p-0 cursor-pointer focus:bg-blue-50/50 hover:bg-blue-50/50 ${!notification.isRead ? 'bg-blue-50/30' : ''}`}
                  onClick={() => handleItemClick(notification)}
                >
                  <div className="flex items-start gap-4 p-4 border-b border-gray-100 w-full">
                    <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start w-full">
                        <h4 className="font-medium text-gray-800">{notification.title}</h4>
                        <span className="text-xs text-gray-500 whitespace-nowrap ml-2 mt-1">
                          {formatDate(notification.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 leading-normal">
                        {notification.message}
                      </p>
                      
                      <div className="flex justify-end mt-3 gap-2">
                        {!notification.isRead && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => handleMarkAsRead(notification.id, e)}
                            className="h-7 text-xs px-2 bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100 hover:text-blue-700"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Gelezen
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDelete(notification.id, e)}
                          className="h-7 text-xs px-2 text-gray-600 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Verwijderen
                        </Button>
                        {notification.link && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs px-2 text-gray-600 hover:bg-blue-50 hover:text-blue-600"
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