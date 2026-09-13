import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export type UserRoleCount = {
  role: string;
  count: number;
};

export type UserGrowthPoint = {
  month: string;
  count: number;
};

export type UserLocationCount = {
  location: string;
  count: number;
};

export type RecentRegistration = {
  id: string;
  username: string | null;
  avatarUrl: string | null;
  role: string;
  createdAt: string;
  reportCount: number;
};

export type UserAnalyticsData = {
  totalUsers: number;
  newUsersThisMonth: number;
  usersWhoSubmittedReports: number;
  participationRate: number;
  firstTimeReporters: number;
  repeatReporters: number;
  roleDistribution: UserRoleCount[];
  userGrowth: UserGrowthPoint[];
  userLocations: UserLocationCount[];
  recentRegistrations: RecentRegistration[];
};

type JsonRecord = Record<string, unknown>;

const asRecord = (value: unknown): JsonRecord =>
  value != null && typeof value === 'object' && !Array.isArray(value) ? (value as JsonRecord) : {};

const asRecords = (value: unknown): JsonRecord[] =>
  Array.isArray(value) ? value.map(asRecord) : [];

const asCount = (value: unknown): number => {
  const count = Number(value);
  return Number.isFinite(count) && count >= 0 ? count : 0;
};

const asString = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;

const asNullableString = (value: unknown): string | null =>
  typeof value === 'string' && value.length > 0 ? value : null;

export const normalizeUserAnalytics = (value: unknown): UserAnalyticsData => {
  const raw = asRecord(value);
  const reporterDistribution = asRecord(raw.reporter_distribution);
  const totalUsers = asCount(raw.total_users);
  const usersWhoSubmittedReports = asCount(raw.users_who_submitted_reports);

  return {
    totalUsers,
    newUsersThisMonth: asCount(raw.new_users_this_month),
    usersWhoSubmittedReports,
    participationRate:
      totalUsers > 0 ? Math.min(100, (usersWhoSubmittedReports / totalUsers) * 100) : 0,
    firstTimeReporters: asCount(reporterDistribution.first_time ?? raw.first_time_reporters),
    repeatReporters: asCount(reporterDistribution.repeat ?? raw.repeat_reporters),
    roleDistribution: asRecords(raw.role_distribution).map((item) => ({
      role: asString(item.role, 'unknown'),
      count: asCount(item.count),
    })),
    userGrowth: asRecords(raw.user_growth)
      .map((item) => ({
        month: asString(item.month),
        count: asCount(item.count),
      }))
      .filter((item) => item.month.length > 0),
    userLocations: asRecords(raw.user_locations)
      .map((item) => ({
        location: asString(item.location),
        count: asCount(item.count),
      }))
      .filter((item) => item.location.length > 0),
    recentRegistrations: asRecords(raw.recent_registrations)
      .map((item) => ({
        id: asString(item.id),
        username: asNullableString(item.username),
        avatarUrl: asNullableString(item.avatar_url),
        role: asString(item.role, 'user'),
        createdAt: asString(item.created_at),
        reportCount: asCount(item.report_count),
      }))
      .filter((item) => item.id.length > 0 && item.createdAt.length > 0),
  };
};

export const useUserAnalytics = () =>
  useQuery({
    queryKey: ['admin', 'user-analytics'],
    staleTime: 120_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_user_analytics');
      if (error) throw error;
      return normalizeUserAnalytics(data);
    },
  });
