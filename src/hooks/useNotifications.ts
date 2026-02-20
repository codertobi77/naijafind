import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';

export type NotificationType = 'order' | 'review' | 'message' | 'system' | 'verification' | 'approval';

export interface Notification {
  _id: Id<'notifications'>;
  _creationTime: number;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  actionUrl?: string;
  createdAt: string;
}

export interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (notificationId: Id<'notifications'>) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: Id<'notifications'>) => Promise<void>;
  refetch: () => void;
}

export function useNotifications(limit = 50): UseNotificationsReturn {
  const notifications = useQuery(api.notifications.getNotifications, { limit }) ?? [];
  const unreadCount = useQuery(api.notifications.getUnreadCount) ?? 0;
  
  const markAsReadMutation = useMutation(api.notifications.markAsRead);
  const markAllAsReadMutation = useMutation(api.notifications.markAllAsRead);
  const deleteNotificationMutation = useMutation(api.notifications.deleteNotification);

  const markAsRead = useCallback(async (notificationId: Id<'notifications'>) => {
    try {
      await markAsReadMutation({ notificationId });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, [markAsReadMutation]);

  const markAllAsRead = useCallback(async () => {
    try {
      await markAllAsReadMutation();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, [markAllAsReadMutation]);

  const deleteNotification = useCallback(async (notificationId: Id<'notifications'>) => {
    try {
      await deleteNotificationMutation({ notificationId });
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  }, [deleteNotificationMutation]);

  const refetch = useCallback(() => {
    // Convex hooks auto-refetch, but this is for manual refetch if needed
  }, []);

  const loading = notifications === undefined;

  return {
    notifications: notifications as Notification[],
    unreadCount: unreadCount ?? 0,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch,
  };
}
