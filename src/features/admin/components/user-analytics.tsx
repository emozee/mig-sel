import {
  AlertCircle,
  CalendarDays,
  FileText,
  MapPin,
  RefreshCw,
  Repeat2,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { useUserAnalytics } from '@/features/admin/api/use-user-analytics';

const ROLE_COLORS: Record<string, string> = {
  user: '#16a34a',
  inspector: '#d97706',
  official: '#2563eb',
  admin: '#4f46e5',
  super_admin: '#9333ea',
  unknown: '#64748b',
};

const formatRole = (role: string) =>
  role
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const formatMonth = (month: string) => {
  const date = new Date(`${month}-01T00:00:00Z`);
  return Number.isNaN(date.getTime())
    ? month
    : date.toLocaleDateString('en-US', { month: 'short', year: '2-digit', timeZone: 'UTC' });
};

const getInitials = (username: string | null) =>
  (username ?? '?')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

export const UserAnalytics = () => {
  const { data, isLoading, isFetching, error, refetch } = useUserAnalytics();

  if (isLoading) {
    return (
      <div className="space-y-6" aria-label="Loading user analytics">
        <div className="h-10 w-44 animate-pulse rounded-lg bg-slate-200" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} size="sm" className="animate-pulse">
              <div className="h-4 w-24 rounded bg-slate-200" />
              <div className="h-9 w-16 rounded bg-slate-200" />
            </Card>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="h-72 animate-pulse bg-slate-100" />
          <Card className="h-72 animate-pulse bg-slate-100" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="items-center py-12 text-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50">
          <AlertCircle className="h-5 w-5 text-red-600" />
        </div>
        <div className="space-y-1">
          <h2 className="font-bold">Unable to load user analytics</h2>
          <p className="text-muted-foreground text-xs">Please retry the request.</p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-xs font-semibold"
        >
          Try Again
        </button>
      </Card>
    );
  }

  const reporterTotal = data.firstTimeReporters + data.repeatReporters;
  const firstTimeRate = reporterTotal > 0 ? (data.firstTimeReporters / reporterTotal) * 100 : 0;
  const repeatRate = reporterTotal > 0 ? (data.repeatReporters / reporterTotal) * 100 : 0;
  const maxRoleCount = Math.max(1, ...data.roleDistribution.map((item) => item.count));
  const maxLocationCount = Math.max(1, ...data.userLocations.map((item) => item.count));
  const growthData = data.userGrowth.map((item) => ({ ...item, label: formatMonth(item.month) }));

  const summaryCards = [
    {
      label: 'Total Users',
      value: data.totalUsers.toLocaleString(),
      description: 'Registered accounts',
      icon: Users,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'New This Month',
      value: data.newUsersThisMonth.toLocaleString(),
      description: 'New registrations',
      icon: UserPlus,
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Users Who Reported',
      value: data.usersWhoSubmittedReports.toLocaleString(),
      description: 'Submitted at least one report',
      icon: FileText,
      color: 'bg-amber-50 text-amber-600',
    },
    {
      label: 'Participation Rate',
      value: `${Math.round(data.participationRate)}%`,
      description: 'Users contributing reports',
      icon: TrendingUp,
      color: 'bg-violet-50 text-violet-600',
    },
  ];

  return (
    <div className="animate-in fade-in-0 slide-in-from-bottom-2 space-y-6 duration-500">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-muted-foreground/60 text-xs font-semibold tracking-widest uppercase">
            Overview
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            Registration, reach, and community participation
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="hover:bg-accent inline-flex items-center gap-2 self-start rounded-lg px-3 py-2 text-sm font-medium transition-all disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <Card
            key={card.label}
            size="sm"
            className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase sm:text-xs">
                {card.label}
              </p>
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${card.color}`}
              >
                <card.icon className="h-4 w-4" />
              </div>
            </div>
            <div>
              <p className="text-foreground text-3xl font-bold tracking-tight tabular-nums">
                {card.value}
              </p>
              <p className="text-muted-foreground/70 mt-1 text-[11px]">{card.description}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50">
              <TrendingUp className="h-4 w-4 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold">Monthly User Growth</h2>
              <p className="text-muted-foreground text-xs">Registrations over time</p>
            </div>
          </div>
          {growthData.length > 0 ? (
            <div className="h-64 min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={growthData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--popover)',
                      border: '1px solid var(--border)',
                      borderRadius: '10px',
                      fontSize: '12px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="Registrations"
                    stroke="var(--chart-1)"
                    strokeWidth={2.5}
                    dot={{ fill: 'var(--chart-1)', r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-muted-foreground flex h-64 items-center justify-center text-xs">
              No registration history available
            </div>
          )}
        </Card>

        <Card>
          <div>
            <h2 className="text-sm font-bold">Users by Role</h2>
            <p className="text-muted-foreground mt-1 text-xs">Account access distribution</p>
          </div>
          {data.roleDistribution.length > 0 ? (
            <div className="space-y-4">
              {data.roleDistribution.map((item) => {
                const color = ROLE_COLORS[item.role] ?? ROLE_COLORS.unknown;
                const percentage =
                  data.totalUsers > 0 ? Math.round((item.count / data.totalUsers) * 100) : 0;
                return (
                  <div key={item.role} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        <span className="font-semibold">{formatRole(item.role)}</span>
                      </div>
                      <span className="text-muted-foreground tabular-nums">
                        {item.count.toLocaleString()} ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${(item.count / maxRoleCount) * 100}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-muted-foreground flex h-48 items-center justify-center text-xs">
              No role data available
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
              <Repeat2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold">Reporter Participation</h2>
              <p className="text-muted-foreground text-xs">First-time and repeat contributors</p>
            </div>
          </div>
          {reporterTotal > 0 ? (
            <>
              <div className="flex h-4 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="bg-emerald-500 transition-all duration-700"
                  style={{ width: `${firstTimeRate}%` }}
                  title={`First-time reporters: ${Math.round(firstTimeRate)}%`}
                />
                <div
                  className="bg-indigo-500 transition-all duration-700"
                  style={{ width: `${repeatRate}%` }}
                  title={`Repeat reporters: ${Math.round(repeatRate)}%`}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-emerald-50 p-4">
                  <p className="text-[10px] font-bold tracking-wide text-emerald-700 uppercase">
                    First-Time
                  </p>
                  <p className="mt-1 text-2xl font-bold text-emerald-800 tabular-nums">
                    {data.firstTimeReporters.toLocaleString()}
                  </p>
                  <p className="mt-1 text-[11px] text-emerald-700/70">Submitted one report</p>
                </div>
                <div className="rounded-xl bg-indigo-50 p-4">
                  <p className="text-[10px] font-bold tracking-wide text-indigo-700 uppercase">
                    Repeat
                  </p>
                  <p className="mt-1 text-2xl font-bold text-indigo-800 tabular-nums">
                    {data.repeatReporters.toLocaleString()}
                  </p>
                  <p className="mt-1 text-[11px] text-indigo-700/70">Submitted two or more</p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-muted-foreground flex h-32 flex-col items-center justify-center gap-2 text-xs">
              <FileText className="h-8 w-8 opacity-30" />
              No registered users have submitted reports yet
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
              <CalendarDays className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold">Recent Registrations</h2>
              <p className="text-muted-foreground text-xs">Newest user accounts</p>
            </div>
          </div>
          {data.recentRegistrations.length > 0 ? (
            <div className="divide-border divide-y">
              {data.recentRegistrations.map((user) => (
                <div key={user.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.username ?? 'User avatar'}
                      loading="lazy"
                      className="h-9 w-9 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="bg-muted text-muted-foreground flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                      {getInitials(user.username)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {user.username ?? 'Unnamed user'}
                    </p>
                    <p className="text-muted-foreground text-[11px]">
                      {user.reportCount} {user.reportCount === 1 ? 'report' : 'reports'}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-[10px] font-semibold">
                      {formatRole(user.role)}
                    </span>
                    <time
                      dateTime={user.createdAt}
                      className="text-muted-foreground mt-1 block text-[10px]"
                    >
                      {new Date(user.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </time>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground flex h-32 items-center justify-center text-xs">
              No recent registrations
            </div>
          )}
        </Card>
      </div>

      <Card>
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 flex h-9 w-9 items-center justify-center rounded-xl">
            <MapPin className="text-primary h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold">Users by Dzongkhag</h2>
            <p className="text-muted-foreground text-xs">Registered user distribution</p>
          </div>
        </div>
        {data.userLocations.length > 0 ? (
          <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {data.userLocations.map((item) => (
              <div key={item.location} className="flex items-center gap-3">
                <span className="w-28 truncate text-xs font-semibold capitalize sm:w-32">
                  {item.location}
                </span>
                <div className="flex flex-1 items-center gap-2">
                  <div className="h-5 flex-1 overflow-hidden rounded-md bg-slate-100">
                    <div
                      className="bg-primary/70 h-full rounded-md transition-all duration-500"
                      style={{ width: `${(item.count / maxLocationCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-muted-foreground min-w-7 text-right text-xs font-bold tabular-nums">
                    {item.count.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <MapPin className="text-muted-foreground/30 h-9 w-9" />
            <p className="text-muted-foreground mt-3 text-sm">Location data not captured yet</p>
            <p className="text-muted-foreground/60 mt-1 max-w-md text-xs">
              Locations will appear after users grant location permission.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};
