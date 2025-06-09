import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { EmptyTableState } from '@/components/ui/data-table-container';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useNotifications, type Notification } from '@/contexts/NotificationContext';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { PremiumHeader } from '@/components/layout/premium-header';
import { 
  Search, BellOff, CheckCircle, Trash2, Check, Bell, Info, 
  AlertTriangle, AlertCircle, X, Eye, EyeOff, XCircle, Briefcase, 
  GraduationCap, BookOpen, CreditCard, ClipboardCheck, MessageSquare
} from 'lucide-react';

const NotificationsPage: React.FC = () => {
  const { notifications, markAsRead, markAllAsRead, deleteNotification, toggleReadStatus } = useNotifications();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNotifications, setSelectedNotifications] = useState<number[]>([]);
  const [selectMode, setSelectMode] = useState(false);
  
  const handleToggleReadStatus = (id: number) => {
    // Wissel de lees-status zonder toast melding te tonen
    toggleReadStatus(id);
  };

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
  };
  
  const handleToggleSelectMode = () => {
    setSelectMode(!selectMode);
    setSelectedNotifications([]);
  };
  
  const handleSelectNotification = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedNotifications(prev => [...prev, id]);
    } else {
      setSelectedNotifications(prev => prev.filter(notificationId => notificationId !== id));
    }
  };
  
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      let notificationsToSelect: number[] = [];
      switch (activeTab) {
        case 'all':
          notificationsToSelect = filteredNotifications?.map(n => n.id) || [];
          break;
        case 'unread':
          notificationsToSelect = filteredUnreadNotifications?.map(n => n.id) || [];
          break;
        case 'read':
          notificationsToSelect = filteredReadNotifications?.map(n => n.id) || [];
          break;
      }
      setSelectedNotifications(notificationsToSelect);
    } else {
      setSelectedNotifications([]);
    }
  };
  
  const handleBulkMarkAsRead = () => {
    selectedNotifications.forEach(id => {
      markAsRead(id);
    });
    toast({
      title: "Notificaties gemarkeerd als gelezen",
      description: `${selectedNotifications.length} notificaties zijn gemarkeerd als gelezen.`,
    });
    setSelectedNotifications([]);
  };
  
  const handleBulkMarkAsUnread = () => {
    selectedNotifications.forEach(id => {
      toggleReadStatus(id);
    });
    toast({
      title: "Notificaties gemarkeerd als ongelezen",
      description: `${selectedNotifications.length} notificaties zijn gemarkeerd als ongelezen.`,
    });
    setSelectedNotifications([]);
  };
  
  const handleBulkDelete = () => {
    selectedNotifications.forEach(id => {
      deleteNotification(id);
    });
    toast({
      title: "Notificaties verwijderd",
      description: `${selectedNotifications.length} notificaties zijn verwijderd.`,
    });
    setSelectedNotifications([]);
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
        <div className="text-center py-12">
          <BellOff className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Geen notificaties</h3>
          <p className="text-gray-500">
            {activeTab === 'unread' 
              ? 'U heeft momenteel geen ongelezen notificaties.' 
              : activeTab === 'read' 
                ? 'U heeft momenteel geen gelezen notificaties.' 
                : 'U heeft momenteel geen notificaties.'}
          </p>
        </div>
      );
    }

    const allSelected = notificationList.length > 0 && 
      selectedNotifications.length === notificationList.length && 
      notificationList.every(n => selectedNotifications.includes(n.id));

    return (
      <div className="space-y-3 mt-4">
        {selectMode && (
          <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50 border border-blue-200 mb-4">
            <div className="flex items-center gap-2">
              <Checkbox 
                id="select-all" 
                checked={allSelected}
                onCheckedChange={handleSelectAll}
              />
              <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                {selectedNotifications.length} van {notificationList.length} geselecteerd
              </label>
            </div>
            <div className="flex gap-2">
              {selectedNotifications.length > 0 && (
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBulkMarkAsRead}
                    className="h-8 w-8"
                    title="Markeer als gelezen"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBulkMarkAsUnread}
                    className="h-8 w-8"
                    title="Markeer als ongelezen"
                  >
                    <EyeOff className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBulkDelete}
                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                    title="Verwijderen"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Separator orientation="vertical" className="h-8 mx-1" />
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleSelectMode}
                className="h-8"
              >
                <X className="h-4 w-4 mr-1" />
                <span>Sluiten</span>
              </Button>
            </div>
          </div>
        )}
        
        {notificationList.map((notification) => (
          <Card key={notification.id} className={`border group relative transition-all duration-200 hover:shadow-md ${!notification.isRead ? 'border-l-4 border-l-blue-500 bg-blue-50/50' : 'hover:bg-gray-50'}`}>
            <CardHeader className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3">
                  {selectMode && (
                    <div className="mt-1 flex items-center justify-center w-6 h-6">
                      <Checkbox 
                        id={`checkbox-${notification.id}`}
                        checked={selectedNotifications.includes(notification.id)}
                        onCheckedChange={(checked) => handleSelectNotification(notification.id, checked === true)}
                        className="border-2 border-primary data-[state=checked]:bg-primary data-[state=checked]:text-white"
                      />
                    </div>
                  )}
                  <div className="mt-1 flex items-center gap-2">
                    {getNotificationIcon(notification.type)}
                    {notification.category && (
                      <div className="text-gray-400">
                        {getCategoryIcon(notification.category)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-base font-medium">{notification.title}</CardTitle>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                      {notification.category && (
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full capitalize">
                          {notification.category}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 block mb-2">
                      {formatDate(notification.createdAt)}
                    </span>
                    <CardDescription className="text-sm text-gray-700 leading-relaxed">
                      {notification.message}
                    </CardDescription>
                  </div>
                </div>
              </div>
              {!selectMode && (
                <div className="absolute top-2 right-2 flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleToggleReadStatus(notification.id)}
                    className="invisible group-hover:visible h-6 w-6 p-0 text-primary hover:bg-primary/10 rounded-full"
                    title={notification.isRead ? "Markeer als ongelezen" : "Markeer als gelezen"}
                  >
                    {notification.isRead ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(notification.id)}
                    className="invisible group-hover:visible h-6 w-6 p-0 text-primary hover:bg-primary/10 rounded-full"
                    title="Verwijderen"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  };

  // Get notification counts for tabs
  const getTabNotificationCount = (tab: string) => {
    switch (tab) {
      case 'all': return notifications.length;
      case 'unread': return unreadNotifications.length;
      case 'read': return readNotifications.length;
      default: return 0;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'grades': return <GraduationCap className="h-4 w-4" />;
      case 'attendance': return <ClipboardCheck className="h-4 w-4" />;
      case 'messages': return <MessageSquare className="h-4 w-4" />;
      case 'payments': return <CreditCard className="h-4 w-4" />;
      case 'general': return <Briefcase className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  return (
    <div className="container max-w-6xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Bell className="h-8 w-8 text-blue-600" />
            Notificaties
          </h1>
          <p className="text-gray-600 mt-2">Beheer hier al uw notificaties en meldingen</p>
        </div>
        {unreadNotifications.length > 0 && (
          <Button
            variant="outline"
            onClick={handleMarkAllAsRead}
            className="h-9 p-2 flex items-center gap-2"
            title="Markeer alles als gelezen"
          >
            <CheckCircle className="h-4 w-4" />
            <span>Markeer alles als gelezen</span>
          </Button>
        )}
      </div>

      <div className="mt-6 mb-6">
        <div className="flex gap-3 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Zoeken in notificaties..."
              className="pl-8 bg-white w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <XCircle
                className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 cursor-pointer hover:text-gray-600"
                onClick={() => setSearchTerm("")}
              />
            )}
          </div>
          
          <Button 
            variant={selectMode ? "default" : "outline"} 
            size="sm" 
            onClick={handleToggleSelectMode}
            className={`flex items-center gap-2 ${selectMode ? "bg-primary text-white" : ""}`}
          >
            {selectMode ? (
              <>
                <X className="h-4 w-4" />
                <span>Annuleren</span>
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                <span>Selecteren</span>
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 grid w-full grid-cols-3 bg-blue-900/10">
          <TabsTrigger value="all" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-md">
            <Bell className="h-4 w-4" />
            <span>Alle notificaties ({filteredNotifications.length})</span>
          </TabsTrigger>
          <TabsTrigger value="unread" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-md">
            <Bell className="h-4 w-4" />
            <span>Ongelezen ({filteredUnreadNotifications.length})</span>
          </TabsTrigger>
          <TabsTrigger value="read" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-md">
            <CheckCircle className="h-4 w-4" />
            <span>Gelezen ({filteredReadNotifications.length})</span>
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