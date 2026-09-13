import { describe, expect, it } from 'vitest';
import { normalizeUserAnalytics } from '@/features/admin/api/use-user-analytics';

describe('normalizeUserAnalytics', () => {
  it('normalizes analytics data and calculates participation', () => {
    const result = normalizeUserAnalytics({
      total_users: '80',
      new_users_this_month: 12,
      users_who_submitted_reports: '20',
      reporter_distribution: { first_time: 14, repeat: 6 },
      role_distribution: [
        { role: 'user', count: 72 },
        { role: 'super_admin', count: 1 },
      ],
      user_growth: [{ month: '2026-09', count: 12 }],
      user_locations: [{ location: 'Thimphu', count: 30 }],
      recent_registrations: [
        {
          id: 'user-1',
          username: 'Pema',
          avatar_url: null,
          role: 'user',
          created_at: '2026-09-13T08:00:00Z',
          report_count: 2,
        },
      ],
    });

    expect(result).toMatchObject({
      totalUsers: 80,
      newUsersThisMonth: 12,
      usersWhoSubmittedReports: 20,
      participationRate: 25,
      firstTimeReporters: 14,
      repeatReporters: 6,
    });
    expect(result.roleDistribution).toEqual([
      { role: 'user', count: 72 },
      { role: 'super_admin', count: 1 },
    ]);
    expect(result.recentRegistrations[0]).toMatchObject({
      username: 'Pema',
      avatarUrl: null,
      reportCount: 2,
    });
  });

  it('returns safe empty values when the response is missing', () => {
    expect(normalizeUserAnalytics(null)).toEqual({
      totalUsers: 0,
      newUsersThisMonth: 0,
      usersWhoSubmittedReports: 0,
      participationRate: 0,
      firstTimeReporters: 0,
      repeatReporters: 0,
      roleDistribution: [],
      userGrowth: [],
      userLocations: [],
      recentRegistrations: [],
    });
  });
});
