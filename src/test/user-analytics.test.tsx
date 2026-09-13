import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { UserAnalyticsData } from '@/features/admin/api/use-user-analytics';
import { UserAnalytics } from '@/features/admin/components/user-analytics';

const { mockUseUserAnalytics } = vi.hoisted(() => ({
  mockUseUserAnalytics: vi.fn(),
}));

vi.mock('@/features/admin/api/use-user-analytics', () => ({
  useUserAnalytics: mockUseUserAnalytics,
}));

vi.mock('recharts', () => {
  const Wrapper = ({ children }: { children?: ReactNode }) => <div>{children}</div>;
  const Empty = () => null;

  return {
    ResponsiveContainer: Wrapper,
    LineChart: Wrapper,
    CartesianGrid: Empty,
    Line: Empty,
    Tooltip: Empty,
    XAxis: Empty,
    YAxis: Empty,
  };
});

const analytics: UserAnalyticsData = {
  totalUsers: 120,
  newUsersThisMonth: 14,
  usersWhoSubmittedReports: 48,
  participationRate: 40,
  firstTimeReporters: 30,
  repeatReporters: 18,
  roleDistribution: [
    { role: 'user', count: 105 },
    { role: 'admin', count: 10 },
    { role: 'super_admin', count: 5 },
  ],
  userGrowth: [{ month: '2026-09', count: 14 }],
  userLocations: [{ location: 'Thimphu', count: 60 }],
  recentRegistrations: [
    {
      id: 'user-1',
      username: 'Karma Dorji',
      avatarUrl: null,
      role: 'super_admin',
      createdAt: '2026-09-13T08:00:00Z',
      reportCount: 2,
    },
  ],
};

describe('UserAnalytics', () => {
  const refetch = vi.fn();

  beforeEach(() => {
    refetch.mockReset();
    mockUseUserAnalytics.mockReturnValue({
      data: analytics,
      isLoading: false,
      isFetching: false,
      error: null,
      refetch,
    });
  });

  it('shows registration and participation analytics without activity status', () => {
    render(<UserAnalytics />);

    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('New This Month')).toBeInTheDocument();
    expect(screen.getByText('Users Who Reported')).toBeInTheDocument();
    expect(screen.getByText('Participation Rate')).toBeInTheDocument();
    expect(screen.getByText('40%')).toBeInTheDocument();
    expect(screen.getByText('Users by Role')).toBeInTheDocument();
    expect(screen.getAllByText('Super Admin').length).toBeGreaterThan(0);
    expect(screen.getByText('Reporter Participation')).toBeInTheDocument();
    expect(screen.getByText('First-Time')).toBeInTheDocument();
    expect(screen.getByText('Repeat')).toBeInTheDocument();
    expect(screen.getByText('Karma Dorji')).toBeInTheDocument();
    expect(screen.getByText('Users by Dzongkhag')).toBeInTheDocument();

    expect(screen.queryByText('Active Users')).not.toBeInTheDocument();
    expect(screen.queryByText('Inactive Users')).not.toBeInTheDocument();
    expect(screen.queryByText('User Status Breakdown')).not.toBeInTheDocument();
  });

  it('refreshes all analytics through the combined query', async () => {
    const user = userEvent.setup();
    render(<UserAnalytics />);

    await user.click(screen.getByRole('button', { name: 'Refresh' }));

    expect(refetch).toHaveBeenCalledOnce();
  });
});
