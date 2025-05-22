import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useNotifications, type Notification } from '@/contexts/NotificationContext';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Search, BellOff, CheckCircle, Trash2, Check, Bell, Info, AlertTriangle, AlertCircle } from 'lucide-react';

const NotificationsPage: React.FC = () => {
  const { notifications, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const unreadNotifications = notifications.filter(notification => !notification.isRead);
  const readNotifications = notifications.filter(notification => notification.isRead);

  const filteredNotifications = notifications.filter(notification => 
    notification.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    notification.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUnreadNotifications = unreadNotifications.filter(notification => 
    notification.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    notification.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredReadNotifications = readNotifications.filter(notification => 
    notification.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    notification.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMarkAsRead = (id: number) => {
    markAsRead(id);
    toast({
      title: "Notificatie gemarkeerd als gelezen",
      description: "De notificatie is gemarkeerd als gelezen.",
    });
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
    toast({
      title: "Alle notificaties gelezen",
      description: "Alle notificaties zijn gemarkeerd als gelezen.",
    });
  };

  const handleDelete = (id: number) => {
    deleteNotification(id);
    toast({
      title: "Notificatie verwijderd",
      description: "De notificatie is verwijderd.",
    });
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'd MMMM yyyy, HH:mm', { locale: nl });
    } catch (error) {
      return dateString;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const renderNotificationList = (notificationList: Notification[]) => {
    if (notificationList.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="h-32 w-32 rounded-full bg-blue-50 flex items-center justify-center mb-4">
            <BellOff className="h-12 w-12 text-blue-300 opacity-30" />
          </div>
          <h3 className="text-xl font-medium text-gray-700">Geen notificaties</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-sm text-center">
            {activeTab === 'unread' 
              ? 'U heeft momenteel geen ongelezen notificaties.' 
              : activeTab === 'read' 
                ? 'U heeft momenteel geen gelezen notificaties.' 
                : 'U heeft momenteel geen notificaties.'}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3 mt-4">
        {notificationList.map((notification) => (
          <Card key={notification.id} className={`border ${!notification.isRead ? 'border-l-4 border-l-blue-500' : ''}`}>
            <CardHeader className="p-4 pb-2">
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div>
                    <CardTitle className="text-base">{notification.title}</CardTitle>
                    <span className="text-xs text-gray-500">
                      {formatDate(notification.createdAt)}
                    </span>
                  </div>
                </div>
                {!notification.isRead && (
                  <div className="px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">
                    Nieuw
                  </div>
                )}
              </div>
              <CardDescription className="text-sm mt-2">
                {notification.message}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 p-4">
              <div className="flex justify-end gap-2 mt-2">
                {!notification.isRead && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleMarkAsRead(notification.id)}
                    className="h-8"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Markeer als gelezen
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(notification.id)}
                  className="h-8 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Verwijderen
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="container max-w-6xl p-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            <Bell className="mr-2 h-6 w-6" />
            Notificaties
          </h1>
          <p className="text-muted-foreground">
            Beheer al uw systeem- en applicatienotificaties
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Zoeken..."
              className="pl-8 w-full sm:w-[250px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {unreadNotifications.length > 0 && (
            <Button
              variant="outline"
              onClick={handleMarkAllAsRead}
              className="whitespace-nowrap"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Alles als gelezen markeren
            </Button>
          )}
        </div>
      </div>

      <Separator className="my-6" />

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 grid w-full grid-cols-3 bg-card">
          <TabsTrigger value="all" className="text-sm">
            Alle notificaties ({filteredNotifications.length})
          </TabsTrigger>
          <TabsTrigger value="unread" className="text-sm">
            Ongelezen ({filteredUnreadNotifications.length})
          </TabsTrigger>
          <TabsTrigger value="read" className="text-sm">
            Gelezen ({filteredReadNotifications.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          {renderNotificationList(filteredNotifications)}
        </TabsContent>
        
        <TabsContent value="unread">
          {renderNotificationList(filteredUnreadNotifications)}
        </TabsContent>
        
        <TabsContent value="read">
          {renderNotificationList(filteredReadNotifications)}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NotificationsPage;