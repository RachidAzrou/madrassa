import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';
import { useAuth } from './AuthContext';

// Type voor notificaties
export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  isRead: boolean;
  link?: string;
  createdAt: string;
  category?: string;
  relatedEntityId?: number;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: Error | null;
  markAsRead: (id: number) => void;
  markAsUnread: (id: number) => void;
  toggleReadStatus: (id: number) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: number) => void;
  refreshNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  // Haal alle notificaties op - gebruik daadwerkelijke gebruiker ID
  const { data: notifications = [], isLoading, error, refetch } = useQuery({
    queryKey: ['/api/notifications/user', user?.id],
    queryFn: () => apiRequest(`/api/notifications/user/${user?.id}`),
    enabled: !!user?.id,
  });

  // Markeer notificatie als gelezen
  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/notifications/${id}/mark-read`, { method: 'PATCH' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/user', user?.id] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Fout",
        description: "Er is een fout opgetreden bij het markeren van de notificatie als gelezen."
      });
    }
  });
  
  // Markeer notificatie als ongelezen
  const markAsUnreadMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/notifications/${id}/mark-unread`, { method: 'PATCH' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/user', user?.id] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Fout",
        description: "Er is een fout opgetreden bij het markeren van de notificatie als ongelezen."
      });
    }
  });

  // Markeer alle notificaties als gelezen
  const markAllAsReadMutation = useMutation({
    mutationFn: () => apiRequest(`/api/notifications/user/${user?.id}/mark-all-read`, { method: 'PATCH' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/user', user?.id] });
      toast({
        title: "Succes",
        description: "Alle notificaties zijn als gelezen gemarkeerd."
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Fout",
        description: "Er is een fout opgetreden bij het markeren van alle notificaties als gelezen."
      });
    }
  });

  // Verwijder notificatie
  const deleteNotificationMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/notifications/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/user', user?.id] });
      toast({
        title: "Succes",
        description: "Notificatie is verwijderd."
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Fout",
        description: "Er is een fout opgetreden bij het verwijderen van de notificatie."
      });
    }
  });

  // Update unread count
  useEffect(() => {
    if (notifications) {
      const unread = notifications.filter((notification: Notification) => !notification.isRead).length;
      setUnreadCount(unread);
    }
  }, [notifications]);

  // Toggle notification read status
  const toggleReadStatus = (id: number) => {
    const notification = notifications.find((n: Notification) => n.id === id);
    if (notification) {
      if (notification.isRead) {
        markAsUnreadMutation.mutate(id);
      } else {
        markAsReadMutation.mutate(id);
      }
    }
  };

  // Context value
  const value = {
    notifications: notifications as Notification[],
    unreadCount,
    isLoading,
    error: error as Error | null,
    markAsRead: (id: number) => markAsReadMutation.mutate(id),
    markAsUnread: (id: number) => markAsUnreadMutation.mutate(id),
    toggleReadStatus,
    markAllAsRead: () => markAllAsReadMutation.mutate(),
    deleteNotification: (id: number) => deleteNotificationMutation.mutate(id),
    refreshNotifications: refetch as () => void
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications moet binnen een NotificationProvider gebruikt worden');
  }
  return context;
};