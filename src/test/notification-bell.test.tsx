import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { NotificationBell } from '@/features/notifications/components/notification-bell';
import { renderWithProviders } from './test-utils';
import type { AppNotification } from '@/features/notifications/types';

const mocks = vi.hoisted(() => ({
  notifications: vi.fn(),
  markRead: vi.fn(),
  markAllRead: vi.fn(),
}));

vi.mock('@/features/notifications/api/use-notifications', () => ({
  useNotifications: mocks.notifications,
  useMarkNotificationRead: () => ({ mutate: mocks.markRead, isPending: false }),
  useMarkAllNotificationsRead: () => ({ mutate: mocks.markAllRead, isPending: false }),
}));

const unreadNotification: AppNotification = {
  id: 1,
  userId: 'user-1',
  type: 'report_status',
  title: 'Report resolved',
  body: 'Your road report is now resolved.',
  href: null,
  entityType: 'grievance',
  entityId: null,
  metadata: { status: 'resolved' },
  readAt: null,
  createdAt: new Date().toISOString(),
};

const readNotification: AppNotification = {
  ...unreadNotification,
  id: 2,
  type: 'announcement',
  title: 'New announcement',
  body: 'Community cleanup this weekend.',
  readAt: new Date().toISOString(),
};

describe('NotificationBell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.notifications.mockReturnValue({
      data: { items: [unreadNotification, readNotification], unreadCount: 1 },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
  });

  it('shows unread notifications and marks an opened item as read', () => {
    renderWithProviders(<NotificationBell />);

    fireEvent.click(screen.getByRole('button', { name: 'Notifications, 1 unread' }));

    expect(screen.getByRole('dialog', { name: 'Notifications' })).toBeInTheDocument();
    expect(screen.getByText('1 unread')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Report resolved'));

    expect(mocks.markRead).toHaveBeenCalledWith(1);
    expect(screen.queryByRole('dialog', { name: 'Notifications' })).not.toBeInTheDocument();
  });

  it('marks all unread notifications as read', () => {
    renderWithProviders(<NotificationBell />);

    fireEvent.click(screen.getByRole('button', { name: 'Notifications, 1 unread' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mark all read' }));

    expect(mocks.markAllRead).toHaveBeenCalledOnce();
  });

  it('shows an empty state', () => {
    mocks.notifications.mockReturnValue({
      data: { items: [], unreadCount: 0 },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderWithProviders(<NotificationBell />);
    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));

    expect(screen.getByText('No notifications yet')).toBeInTheDocument();
  });
});
