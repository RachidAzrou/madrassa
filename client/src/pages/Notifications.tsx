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
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications, type Notification } from '@/contexts/NotificationContext';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { PageHeader } from '@/components/layout/page-header';
import { 
  Search, BellOff, CheckCircle, Trash2, Check, Bell, Info, 
  AlertTriangle, AlertCircle, X, Eye, EyeOff, XCircle, Briefcase, 
  GraduationCap, BookOpen, CreditCard, ClipboardCheck, MessageSquare
} from 'lucide-react';

const NotificationsPage: React.FC = () => {
  const { notifications, markAsRead, markAllAsRead, deleteNotification, toggleReadStatus } = useNotifications();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectMode, setSelectMode] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState('all');

  // Get parent breadcrumb based on user role
  const getParentBreadcrumb = () => {
    switch (user?.role) {
      case 'admin':
      case 'administrator':
        return 'Admin';
      case 'secretariat':
      case 'secretariaat':
        return 'Secretariaat';
      case 'teacher':
      case 'docent':
        return 'Docent';
      case 'guardian':
      case 'voogd':
        return 'Voogd';
      case 'student':
        return 'Student';
      default:
        return 'Dashboard';
    }
  };

  // Filter notifications based on search term and category
  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || notification.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredUnreadNotifications = filteredNotifications.filter(n => !n.isRead);
  const filteredReadNotifications = filteredNotifications.filter(n => n.isRead);

  const unreadNotifications = notifications.filter(n => !n.isRead);
  const readNotifications = notifications.filter(n => n.isRead);

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      toast({
        title: "Succes",
        description: "Alle notificaties zijn gemarkeerd als gelezen.",
      });
    } catch (error) {
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het markeren van notificaties.",
        variant: "destructive",
      });
    }
  };

  const handleToggleSelectMode = () => {
    setSelectMode(!selectMode);
    setSelectedNotifications([]);
  };

  const handleSelectNotification = (notificationId: number, checked: boolean) => {
    if (checked) {
      setSelectedNotifications(prev => [...prev, notificationId]);
    } else {
      setSelectedNotifications(prev => prev.filter(id => id !== notificationId));
    }
  };

  const handleBulkMarkAsRead = async () => {
    try {
      for (const id of selectedNotifications) {
        await markAsRead(id);
      }
      setSelectedNotifications([]);
      toast({
        title: "Succes",
        description: `${selectedNotifications.length} notificaties gemarkeerd als gelezen.`,
      });
    } catch (error) {
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het markeren van notificaties.",
        variant: "destructive",
      });
    }
  };

  const handleBulkDelete = async () => {
    try {
      for (const id of selectedNotifications) {
        await deleteNotification(id);
      }
      setSelectedNotifications([]);
      toast({
        title: "Succes",
        description: `${selectedNotifications.length} notificaties verwijderd.`,
      });
    } catch (error) {
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het verwijderen van notificaties.",
        variant: "destructive",
      });
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'academic': return <GraduationCap className="h-4 w-4" />;
      case 'administrative': return <Briefcase className="h-4 w-4" />;
      case 'payment': return <CreditCard className="h-4 w-4" />;
      case 'attendance': return <ClipboardCheck className="h-4 w-4" />;
      case 'communication': return <MessageSquare className="h-4 w-4" />;
      case 'system': return <Info className="h-4 w-4" />;
      case 'urgent': return <AlertTriangle className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  const renderNotificationList = (notificationList: Notification[]) => {
    if (notificationList.length === 0) {
      return (
        <div className="bg-white border border-[#e5e7eb] rounded-sm p-8 text-center">
          <BellOff className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Geen notificaties</h3>
          <p className="text-gray-600">Er zijn geen notificaties om weer te geven.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {selectMode && selectedNotifications.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-sm p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700">
                {selectedNotifications.length} notificatie(s) geselecteerd
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBulkMarkAsRead}
                  className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                  title="Markeer als gelezen"
                >
                  <Eye className="h-4 w-4" />
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
              </div>
            </div>
          </div>
        )}
        
        {notificationList.map((notification) => (
          <div key={notification.id} className={`bg-white border border-[#e5e7eb] rounded-sm transition-all duration-200 hover:shadow-sm ${!notification.isRead ? 'border-l-4 border-l-[#1e40af] bg-blue-50/30' : ''}`}>
            <div className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3 flex-1">
                  {selectMode && (
                    <Checkbox
                      checked={selectedNotifications.includes(notification.id)}
                      onCheckedChange={(checked) => handleSelectNotification(notification.id, checked as boolean)}
                      className="mt-1"
                    />
                  )}
                  
                  <div className="flex items-center justify-center w-10 h-10 bg-[#f5f7fc] border border-[#e5e7eb] rounded-sm">
                    {getCategoryIcon(notification.category || 'general')}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                        {notification.title}
                      </h3>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-[#1e40af] rounded-full"></div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{format(new Date(notification.createdAt), 'dd MMM yyyy, HH:mm', { locale: nl })}</span>
                      <span className="capitalize">{notification.category}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 ml-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleReadStatus(notification.id)}
                    className="h-8 w-8 text-gray-400 hover:text-gray-600"
                    title={notification.isRead ? "Markeer als ongelezen" : "Markeer als gelezen"}
                  >
                    {notification.isRead ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteNotification(notification.id)}
                    className="h-8 w-8 text-gray-400 hover:text-red-500"
                    title="Verwijderen"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-[#f7f9fc] min-h-screen">
      {/* Dashboard Style Page Header */}
      <PageHeader
        title="Notificaties"
        icon={<Bell className="h-5 w-5 text-white" />}
        parent={getParentBreadcrumb()}
        current="Notificaties"
      />
      
      {/* Main content area - Dashboard Style */}
      <div className="px-6 py-6 max-w-6xl mx-auto">
        
        {/* Stats Overview Cards - Compact Dashboard Style */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {/* Totaal */}
          <div className="bg-white border border-[#e5e7eb] rounded-sm">
            <div className="flex h-full">
              <div className="flex items-center justify-center w-12 bg-[#f5f7fc] border-r border-[#e5e7eb]">
                <Bell className="h-4 w-4 text-[#1e40af]" />
              </div>
              <div className="flex-1 p-3">
                <div className="flex flex-col">
                  <h3 className="text-xs font-medium text-gray-500">Totaal</h3>
                  <p className="text-lg font-medium text-gray-800 mt-1">{notifications.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Ongelezen */}
          <div className="bg-white border border-[#e5e7eb] rounded-sm">
            <div className="flex h-full">
              <div className="flex items-center justify-center w-12 bg-[#f5f7fc] border-r border-[#e5e7eb]">
                <AlertCircle className="h-4 w-4 text-[#1e40af]" />
              </div>
              <div className="flex-1 p-3">
                <div className="flex flex-col">
                  <h3 className="text-xs font-medium text-gray-500">Ongelezen</h3>
                  <p className="text-lg font-medium text-gray-800 mt-1">{unreadNotifications.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Acties */}
          <div className="bg-white border border-[#e5e7eb] rounded-sm col-span-2 lg:col-span-1">
            <div className="flex h-full">
              <div className="flex items-center justify-center w-12 bg-[#f5f7fc] border-r border-[#e5e7eb]">
                <Check className="h-4 w-4 text-[#1e40af]" />
              </div>
              <div className="flex-1 p-3 flex items-center">
                {unreadNotifications.length > 0 ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    className="text-xs p-0 h-auto text-[#1e40af] hover:text-[#1e40af] hover:bg-transparent"
                    title="Markeer alles als gelezen"
                  >
                    Markeer alle als gelezen
                  </Button>
                ) : (
                  <span className="text-xs text-gray-500">Geen acties</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Search and Controls - Dashboard Style */}
        <div className="bg-white border border-[#e5e7eb] rounded-sm p-4 mb-6">
          <div className="flex gap-3 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Zoeken in notificaties..."
                className="pl-8 bg-white w-full border-[#e5e7eb]"
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
              className={`flex items-center gap-2 border-[#e5e7eb] ${selectMode ? "bg-[#1e40af] text-white" : "text-gray-600"}`}
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

        {/* Tabs - Dashboard Style */}
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 grid w-full grid-cols-3 bg-white border border-[#e5e7eb] rounded-sm">
            <TabsTrigger 
              value="all" 
              className="flex items-center gap-2 data-[state=active]:bg-[#f5f7fc] data-[state=active]:text-[#1e40af] data-[state=active]:border-[#1e40af]"
            >
              <Bell className="h-4 w-4" />
              <span>Alle ({filteredNotifications.length})</span>
            </TabsTrigger>
            <TabsTrigger 
              value="unread" 
              className="flex items-center gap-2 data-[state=active]:bg-[#f5f7fc] data-[state=active]:text-[#1e40af] data-[state=active]:border-[#1e40af]"
            >
              <AlertCircle className="h-4 w-4" />
              <span>Ongelezen ({filteredUnreadNotifications.length})</span>
            </TabsTrigger>
            <TabsTrigger 
              value="read" 
              className="flex items-center gap-2 data-[state=active]:bg-[#f5f7fc] data-[state=active]:text-[#1e40af] data-[state=active]:border-[#1e40af]"
            >
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
    </div>
  );
};

export default NotificationsPage;