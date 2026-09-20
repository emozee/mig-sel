import { describe, expect, it } from 'vitest';
import { getNotificationDestination } from '@/features/notifications/utils/get-notification-destination';
import type { AppNotification, NotificationType } from '@/features/notifications/types';

function createNotification(
  type: NotificationType,
  overrides: Partial<AppNotification> = {},
): AppNotification {
  return {
    id: 1,
    userId: 'user-1',
    type,
    title: 'Report update',
    body: 'Your report was updated.',
    href: null,
    entityType: 'grievance',
    entityId: 'report/1',
    metadata: {},
    readAt: null,
    createdAt: '2026-09-20T00:00:00Z',
    ...overrides,
  };
}

describe('getNotificationDestination', () => {
  it('builds a report detail link from the notification entity', () => {
    expect(getNotificationDestination(createNotification('report_status'))).toBe(
      '/profile/reports/report%2F1',
    );
  });

  it('keeps an orphaned report notification on the reports list', () => {
    expect(
      getNotificationDestination(
        createNotification('report_submitted', { href: '/profile/reports' }),
      ),
    ).toBe('/profile/reports');
  });

  it.each(['report_rejected', 'report_removed'] as const)(
    'opens %s on the reports list even when its stored link is stale',
    (type) => {
      expect(
        getNotificationDestination(
          createNotification(type, { href: '/profile/reports/deleted-report' }),
        ),
      ).toBe('/profile/reports');
    },
  );

  it('uses the stored destination for non-report notifications', () => {
    expect(
      getNotificationDestination(
        createNotification('announcement', {
          href: '/diamond',
          entityType: 'announcement',
          entityId: '5',
        }),
      ),
    ).toBe('/diamond');
  });
});
