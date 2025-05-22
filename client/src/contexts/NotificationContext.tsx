import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';

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
  markAllAsRead: () => void;
  deleteNotification: (id: number) => void;
  refreshNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Huidige gebruikers-ID (dit zou normaal uit een auth-context komen)
// Voor demo-doeleinden gebruiken we een vaste waarde
const CURRENT_USER_ID = 1;

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const [unreadCount, setUnreadCount] = useState(0);

  // Haal alle notificaties op
  const { data: notifications = [], isLoading, error, refetch } = useQuery({
    queryKey: ['/api/notifications/user', CURRENT_USER_ID],
    queryFn: () => apiRequest(`/api/notifications/user/${CURRENT_USER_ID}`),
  });

  // Markeer notificatie als gelezen
  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/notifications/${id}/mark-read`, { method: 'PATCH' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/user', CURRENT_USER_ID] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Fout",
        description: "Er is een fout opgetreden bij het markeren van de notificatie als gelezen."
      });
    }
  });

  // Markeer alle notificaties als gelezen
  const markAllAsReadMutation = useMutation({
    mutationFn: () => apiRequest(`/api/notifications/user/${CURRENT_USER_ID}/mark-all-read`, { method: 'PATCH' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/user', CURRENT_USER_ID] });
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
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/user', CURRENT_USER_ID] });
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

  // Context value
  const value = {
    notifications: notifications as Notification[],
    unreadCount,
    isLoading,
    error: error as Error | null,
    markAsRead: (id: number) => markAsReadMutation.mutate(id),
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