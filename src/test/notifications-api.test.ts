import { describe, expect, it } from 'vitest';
import { normalizeNotification } from '@/features/notifications/api/use-notifications';

describe('normalizeNotification', () => {
  it('maps database fields and defaults metadata', () => {
    expect(
      normalizeNotification({
        id: 7,
        user_id: 'user-1',
        type: 'diamond_comment',
        title: 'New comment',
        body: 'Thanks for helping.',
        href: '/diamond',
        entity_type: 'diamond',
        entity_id: '12',
        metadata: null,
        read_at: null,
        created_at: '2026-09-18T00:00:00Z',
      }),
    ).toEqual({
      id: 7,
      userId: 'user-1',
      type: 'diamond_comment',
      title: 'New comment',
      body: 'Thanks for helping.',
      href: '/diamond',
      entityType: 'diamond',
      entityId: '12',
      metadata: {},
      readAt: null,
      createdAt: '2026-09-18T00:00:00Z',
    });
  });
});
