import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/features/auth/api/use-current-user';
import type { AppNotification, NotificationList, NotificationType } from '../types';

interface NotificationRow {
  id: number;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  href: string | null;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
}

const notificationKeys = {
  all: ['notifications'] as const,
  list: (userId: string) => [...notificationKeys.all, userId] as const,
};

export function normalizeNotification(row: NotificationRow): AppNotification {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    body: row.body,
    href: row.href,
    entityType: row.entity_type,
    entityId: row.entity_id,
    metadata: row.metadata ?? {},
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

export const useNotifications = () => {
  const { user } = useCurrentUser();
  const userId = user?.id;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: notificationKeys.list(userId ?? ''),
    enabled: !!userId,
    staleTime: 30_000,
    refetchInterval: 120_000,
    queryFn: async (): Promise<NotificationList> => {
      if (!userId) return { items: [], unreadCount: 0 };

      const [itemsResult, unreadResult] = await Promise.all([
        supabase
          .from('notifications')
          .select(
            'id, user_id, type, title, body, href, entity_type, entity_id, metadata, read_at, created_at',
          )
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .is('read_at', null),
      ]);

      if (itemsResult.error) throw itemsResult.error;
      if (unreadResult.error) throw unreadResult.error;

      return {
        items: (itemsResult.data as NotificationRow[] | null)?.map(normalizeNotification) ?? [],
        unreadCount: unreadResult.count ?? 0,
      };
    },
  });

  useEffect(() => {
    if (!userId) return;

    let invalidateTimer: ReturnType<typeof setTimeout> | undefined;
    const scheduleRefresh = () => {
      if (invalidateTimer) clearTimeout(invalidateTimer);
      invalidateTimer = setTimeout(() => {
        void queryClient.invalidateQueries({ queryKey: notificationKeys.list(userId) });
      }, 200);
    };

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        scheduleRefresh,
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') scheduleRefresh();
      });

    return () => {
      if (invalidateTimer) clearTimeout(invalidateTimer);
      void supabase.removeChannel(channel);
    };
  }, [queryClient, userId]);

  return query;
};

export const useMarkNotificationRead = () => {
  const { user } = useCurrentUser();
  const userId = user?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: number) => {
      if (!userId) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', userId)
        .is('read_at', null);
      if (error) throw error;
    },
    onSuccess: () => {
      if (userId) {
        void queryClient.invalidateQueries({ queryKey: notificationKeys.list(userId) });
      }
    },
    onError: () => toast.error('Could not mark notification as read.'),
  });
};

export const useMarkAllNotificationsRead = () => {
  const { user } = useCurrentUser();
  const userId = user?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .is('read_at', null);
      if (error) throw error;
    },
    onSuccess: () => {
      if (userId) {
        void queryClient.invalidateQueries({ queryKey: notificationKeys.list(userId) });
      }
    },
    onError: () => toast.error('Could not mark notifications as read.'),
  });
};
