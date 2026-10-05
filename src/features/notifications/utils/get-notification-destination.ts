import type { AppNotification } from '../types';

export function getNotificationDestination(notification: AppNotification): string | null {
  if (notification.type === 'report_rejected' || notification.type === 'report_removed') {
    return '/profile/reports';
  }

  if (notification.type.startsWith('report_')) {
    if (notification.href === '/profile/reports') return notification.href;
    if (notification.entityId) {
      return `/profile/reports/${encodeURIComponent(notification.entityId)}`;
    }
  }

  if (notification.type === 'shop_status' && notification.entityId) {
    return `/shop/mobile-recharge?request=${encodeURIComponent(notification.entityId)}`;
  }

  if (notification.type === 'shop_request' && notification.entityId) {
    return `/dashboard?view=shop&request=${encodeURIComponent(notification.entityId)}`;
  }

  return notification.href;
}
