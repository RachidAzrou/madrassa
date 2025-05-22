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
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useNotifications, type Notification } from '@/contexts/NotificationContext';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

const NotificationsPage: React.FC = () => {
  const { notifications, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('all');

  const unreadNotifications = notifications.filter(notification => !notification.isRead);
  const readNotifications = notifications.filter(notification => notification.isRead);

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

  const renderNotificationList = (notificationList: Notification[]) => {
    if (notificationList.length === 0) {
      return (
        <div className="py-8 text-center text-muted-foreground">
          <p className="text-base">Geen notificaties</p>
          <p className="text-sm text-gray-500 mt-1">
            {activeTab === 'unread' 
              ? 'U heeft geen ongelezen notificaties.' 
              : activeTab === 'read' 
                ? 'U heeft geen gelezen notificaties.' 
                : 'U heeft geen notificaties.'}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {notificationList.map((notification) => (
          <Card key={notification.id} className="border-gray-200">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-base">{notification.title}</CardTitle>
                <span className="text-xs text-gray-500">
                  {formatDate(notification.createdAt)}
                </span>
              </div>
              <CardDescription className="text-sm">
                {notification.message}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex justify-end gap-2 mt-2">
                {!notification.isRead && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs"
                    onClick={() => handleMarkAsRead(notification.id)}
                  >
                    Markeer als gelezen
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={() => handleDelete(notification.id)}
                >
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
    <div className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Notificaties</h1>
        {unreadNotifications.length > 0 && (
          <Button
            variant="outline"
            onClick={handleMarkAllAsRead}
            className="text-sm"
          >
            Alles markeren als gelezen
          </Button>
        )}
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 bg-card">
          <TabsTrigger value="all">
            Alle notificaties ({notifications.length})
          </TabsTrigger>
          <TabsTrigger value="unread">
            Ongelezen ({unreadNotifications.length})
          </TabsTrigger>
          <TabsTrigger value="read">
            Gelezen ({readNotifications.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          {renderNotificationList(notifications)}
        </TabsContent>
        
        <TabsContent value="unread">
          {renderNotificationList(unreadNotifications)}
        </TabsContent>
        
        <TabsContent value="read">
          {renderNotificationList(readNotifications)}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NotificationsPage;