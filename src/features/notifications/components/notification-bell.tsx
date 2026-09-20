import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  CheckCheck,
  CircleAlert,
  FileCheck2,
  FileText,
  Gem,
  Loader2,
  Megaphone,
  MessageCircle,
  X,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useClickOutside } from '@/hooks/use-click-outside';
import { complaintKeys } from '@/features/complaint/api/use-complaints';
import { diamondKeys } from '@/features/diamonds/api/use-create-diamond';
import { announcementsKeys } from '@/features/announcements/api/use-announcements';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '../api/use-notifications';
import { getNotificationDestination } from '../utils/get-notification-destination';
import type { AppNotification, NotificationType } from '../types';

const iconByType: Record<NotificationType, LucideIcon> = {
  report_submitted: FileText,
  report_approved: FileCheck2,
  report_status: FileText,
  report_rejected: CircleAlert,
  report_removed: CircleAlert,
  diamond_comment: MessageCircle,
  diamond_status: Gem,
  announcement: Megaphone,
};

function timeAgo(value: string): string {
  const timestamp = new Date(value).getTime();
  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function NotificationItem({
  notification,
  onOpen,
}: {
  notification: AppNotification;
  onOpen: (notification: AppNotification) => void;
}) {
  const Icon = iconByType[notification.type] ?? Bell;
  const unread = !notification.readAt;

  return (
    <button
      type="button"
      onClick={() => onOpen(notification)}
      className={cn(
        'flex w-full gap-3 border-b border-slate-100 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-slate-50',
        unread && 'bg-primary/[0.05]',
      )}
    >
      <span
        className={cn(
          'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500',
          unread && 'bg-primary/10 text-primary',
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start gap-2">
          <span className={cn('flex-1 text-sm text-slate-800', unread && 'font-bold')}>
            {notification.title}
          </span>
          {unread && <span className="bg-primary mt-1.5 h-2 w-2 shrink-0 rounded-full" />}
        </span>
        <span className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-slate-500">
          {notification.body}
        </span>
        <span className="mt-1 block text-[11px] font-medium text-slate-400">
          {timeAgo(notification.createdAt)}
        </span>
      </span>
    </button>
  );
}

export const NotificationBell = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { data, isLoading, isError, refetch } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const notifications = data?.items ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  useClickOutside(containerRef, () => setOpen(false));

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  const openNotification = (notification: AppNotification) => {
    if (!notification.readAt) markRead.mutate(notification.id);
    if (notification.type.startsWith('report_')) {
      void queryClient.invalidateQueries({ queryKey: complaintKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['my-reports'] });
    } else if (notification.type.startsWith('diamond_')) {
      void queryClient.invalidateQueries({ queryKey: diamondKeys.all });
    } else if (notification.type === 'announcement') {
      void queryClient.invalidateQueries({ queryKey: announcementsKeys.all() });
    }
    setOpen(false);
    const destination = getNotificationDestination(notification);
    if (destination) navigate(destination);
  };

  return (
    <div ref={containerRef} className="fixed top-3 right-3 z-40">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-600 shadow-md backdrop-blur transition-all hover:bg-white hover:text-slate-900"
        aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        aria-expanded={open}
      >
        <Bell className="h-[18px] w-[18px]" />
        {unreadCount > 0 && (
          <span className="bg-primary absolute -top-1 -right-1 flex min-h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold text-white ring-2 ring-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute top-11 right-0 flex max-h-[min(70dvh,34rem)] w-[min(24rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        >
          <div className="flex shrink-0 items-center gap-3 border-b border-slate-100 px-4 py-3">
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold text-slate-900">Notifications</h2>
              <p className="text-[11px] text-slate-500">
                {unreadCount ? `${unreadCount} unread` : 'You are all caught up'}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
                className="text-primary hover:bg-primary/5 flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-bold disabled:opacity-50"
              >
                {markAllRead.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCheck className="h-3.5 w-3.5" />
                )}
                Mark all read
              </button>
            )}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close notifications"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12 text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                <CircleAlert className="h-6 w-6 text-red-400" />
                <p className="text-sm font-semibold text-slate-700">Could not load notifications</p>
                <button
                  type="button"
                  onClick={() => void refetch()}
                  className="text-primary text-xs font-bold hover:underline"
                >
                  Try again
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-12 text-center">
                <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-slate-100">
                  <Bell className="h-5 w-5 text-slate-400" />
                </span>
                <p className="text-sm font-semibold text-slate-700">No notifications yet</p>
                <p className="mt-1 text-xs text-slate-400">
                  Report updates and community activity will appear here.
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onOpen={openNotification}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
