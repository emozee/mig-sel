import { useState } from 'react';
import {
  ClipboardList,
  ChartPie,
  Menu,
  Recycle,
  AlertTriangle,
  FileText,
  Shield,
  Brain,
  Gem,
  Megaphone,
  Users,
  UserCheck,
  UserX,
  RefreshCw,
  MapPin,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DashboardSidebar, type NavView } from '@/components/layout/dashboard-sidebar';
import { WasteRecord } from '@/features/waste/components/waste-record';
import { WasteCharts } from '@/features/waste/components/waste-charts';
import { ComplaintMonitor } from '@/features/complaint/components/complaint-monitor';
import { ComplaintCharts } from '@/features/complaint/components/complaint-charts';
import { WasteReportingForm } from '@/features/waste/components/waste-reporting-form';
import { RoleAssignment } from '@/features/admin/components/role-assignment';
import { KnowledgeBase } from '@/features/admin/components/knowledge-base';
import { DiamondReview } from '@/features/diamonds/components/diamond-review';
import { AnnouncementForm } from '@/features/announcements/components/announcement-form';
import { AnnouncementList } from '@/features/announcements/components/announcement-list';
import { useUserCounts, useUserGrowth } from '@/features/auth/api/use-user-counts';
import { useUserLocations } from '@/features/auth/api/use-user-locations';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

const iconMap: Record<NavView, typeof ClipboardList> = {
  complaint: ClipboardList,
  table: Recycle,
  inspector: FileText,
  official: Megaphone,
  diamond: Gem,
  users: Users,
  role: Shield,
  charts: ChartPie,
  knowledge: Brain,
};

export const AdminPage = () => {
  const [activeView, setActiveView] = useState<NavView>('complaint');
  const [analyticsTab, setAnalyticsTab] = useState<'waste' | 'complaint'>('complaint');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const pageMeta: Record<NavView, { title: string; description: string }> = {
    complaint: {
      title: 'Complaint Monitoring',
      description: 'Monitor and manage reports and complaints',
    },
    table: { title: 'Waste Management', description: 'Oversight panel for GMC waste management' },
    inspector: { title: 'Inspector', description: 'Submit waste collection records' },
    official: { title: 'Official', description: 'Manage announcements and official content' },
    diamond: { title: 'Diamond Review', description: 'Review and approve direct-solve requests' },
    users: { title: 'User Analytics', description: 'View user registration and activity stats' },
    role: { title: 'Role Assignment', description: 'Search and update user roles' },
    charts: { title: 'Analytics', description: 'Oversight panel for GMC waste management' },
    knowledge: { title: 'Knowledge Base', description: 'Manage chatbot Q&A pairs' },
  };

  const {
    data: userCounts,
    isLoading: userCountsLoading,
    refetch: refetchUserCounts,
  } = useUserCounts();
  const { data: userGrowth } = useUserGrowth();
  const { data: userLocations } = useUserLocations();

  const { title: pageTitle } = pageMeta[activeView];
  const pageDescription =
    activeView === 'charts'
      ? analyticsTab === 'complaint'
        ? 'Oversight panel for GMC complaint monitor'
        : 'Oversight panel for GMC waste management'
      : pageMeta[activeView].description;
  const IconComponent = iconMap[activeView];

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100/80">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-purple-200/20 blur-3xl" />
        <div className="bg-primary/10 absolute -right-32 -bottom-32 h-96 w-96 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/3 h-64 w-64 -translate-y-1/2 rounded-full bg-blue-200/10 blur-3xl" />
      </div>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <DashboardSidebar
        activeView={activeView}
        onNavigate={(v) => {
          setActiveView(v);
          setSidebarOpen(false);
        }}
        isMobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />

      <div className="flex flex-1 flex-col md:ml-60">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-white/20 bg-white/70 px-4 backdrop-blur-xl md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="hover:bg-accent rounded-lg p-1.5 transition-all"
          >
            <Menu className="h-5 w-5" />
          </button>
          {activeView !== 'complaint' && activeView !== 'inspector' && activeView !== 'role' && (
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-sm font-bold tracking-tight">{pageTitle}</h1>
              <p className="text-muted-foreground/70 truncate text-xs">{pageDescription}</p>
            </div>
          )}
        </header>

        <main className="flex-1 overflow-auto">
          <div className="mx-auto px-4 py-8 sm:px-6 lg:px-8" style={{ maxWidth: '1200px' }}>
            {activeView !== 'complaint' && activeView !== 'inspector' && activeView !== 'role' && (
              <div className="animate-in fade-in-0 slide-in-from-top-2 mb-8 hidden duration-500 [animation-delay:100ms] md:block">
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-xl">
                    <IconComponent className="text-primary h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-muted-foreground/40 mb-1 text-xs font-semibold tracking-widest uppercase">
                      {activeView === 'charts' ? 'Overview' : 'Data'}
                    </div>
                    <h1 className="text-foreground text-2xl font-bold tracking-tight">
                      {pageTitle}
                    </h1>
                    <p className="text-muted-foreground mt-0.5 text-sm">{pageDescription}</p>
                  </div>
                </div>
              </div>
            )}

            {activeView === 'inspector' && (
              <div className="animate-in fade-in-0 slide-in-from-top-2 duration-500 [animation-delay:200ms]">
                <WasteReportingForm />
              </div>
            )}
            {activeView === 'official' && (
              <div className="animate-in fade-in-0 slide-in-from-top-2 space-y-6 duration-500 [animation-delay:200ms]">
                <AnnouncementForm />
                <AnnouncementList />
              </div>
            )}
            {activeView === 'role' && <RoleAssignment />}
            {activeView === 'charts' && (
              <div className="space-y-6">
                <div className="animate-in fade-in-0 slide-in-from-bottom-2 rounded-xl border border-white/20 bg-white/60 p-1.5 shadow-xs backdrop-blur-sm duration-500 [animation-delay:200ms]">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setAnalyticsTab('waste')}
                      className={cn(
                        'flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all',
                        analyticsTab === 'waste'
                          ? 'bg-primary text-primary-foreground shadow-xs'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent/60',
                      )}
                    >
                      <Recycle className="h-4 w-4" />
                      Waste Management
                    </button>
                    <button
                      type="button"
                      onClick={() => setAnalyticsTab('complaint')}
                      className={cn(
                        'flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all',
                        analyticsTab === 'complaint'
                          ? 'bg-primary text-primary-foreground shadow-xs'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent/60',
                      )}
                    >
                      <AlertTriangle className="h-4 w-4" />
                      Complaint Monitoring
                    </button>
                  </div>
                </div>
                <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-500 [animation-delay:300ms]">
                  {analyticsTab === 'waste' ? <WasteCharts /> : <ComplaintCharts />}
                </div>
              </div>
            )}
            <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-500 [animation-delay:200ms]">
              {activeView === 'table' && <WasteRecord />}
              {activeView === 'complaint' && <ComplaintMonitor />}
            </div>
            {activeView === 'users' && (
              <div className="animate-in fade-in-0 slide-in-from-bottom-2 space-y-6 duration-500 [animation-delay:200ms]">
                <div className="flex items-center justify-between">
                  <p className="text-muted-foreground/60 text-xs font-semibold tracking-widest uppercase">
                    Overview
                  </p>
                  <button
                    onClick={() => refetchUserCounts()}
                    disabled={userCountsLoading}
                    className="hover:bg-accent inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all"
                  >
                    <RefreshCw className={`h-4 w-4 ${userCountsLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>

                {userCountsLoading ? (
                  <div className="grid gap-6 sm:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="animate-pulse rounded-xl border border-white/20 bg-white/60 p-6 shadow-xs backdrop-blur-sm"
                      >
                        <div className="mb-3 h-4 w-24 rounded bg-slate-200" />
                        <div className="h-8 w-16 rounded bg-slate-200" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid gap-6 sm:grid-cols-3">
                    {[
                      {
                        label: 'Total Users',
                        value: userCounts?.total ?? 0,
                        icon: Users,
                        color: 'bg-blue-500/10 text-blue-600',
                      },
                      {
                        label: 'Active Users',
                        value: userCounts?.active ?? 0,
                        icon: UserCheck,
                        color: 'bg-emerald-500/10 text-emerald-600',
                      },
                      {
                        label: 'Inactive Users',
                        value: userCounts?.inactive ?? 0,
                        icon: UserX,
                        color: 'bg-amber-500/10 text-amber-600',
                      },
                    ].map((card) => (
                      <div
                        key={card.label}
                        className="rounded-xl border border-white/20 bg-white/60 p-6 shadow-xs backdrop-blur-sm"
                      >
                        <div className="mb-4 flex items-center gap-3">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.color}`}
                          >
                            <card.icon className="h-5 w-5" />
                          </div>
                          <span className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
                            {card.label}
                          </span>
                        </div>
                        <p className="text-foreground text-3xl font-bold tracking-tight">
                          {card.value}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {userCounts && userCounts.total > 0 && (
                  <div className="rounded-xl border border-white/20 bg-white/60 p-6 shadow-xs backdrop-blur-sm">
                    <h2 className="text-foreground mb-2 text-sm font-semibold">
                      User Status Breakdown
                    </h2>
                    <div className="flex h-4 w-full overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="bg-emerald-500 transition-all duration-700"
                        style={{ width: `${(userCounts.active / userCounts.total) * 100}%` }}
                      />
                      <div
                        className="bg-amber-500 transition-all duration-700"
                        style={{ width: `${(userCounts.inactive / userCounts.total) * 100}%` }}
                      />
                    </div>
                    <div className="mt-3 flex gap-6 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                        <span className="text-muted-foreground">
                          Active ({Math.round((userCounts.active / userCounts.total) * 100)}%)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                        <span className="text-muted-foreground">
                          Inactive ({Math.round((userCounts.inactive / userCounts.total) * 100)}%)
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {userGrowth && userGrowth.length > 0 && (
                  <div className="rounded-xl border border-white/20 bg-white/60 p-6 shadow-xs backdrop-blur-sm">
                    <h2 className="text-foreground mb-4 text-sm font-semibold">
                      User Growth (signups per month)
                    </h2>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={userGrowth}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="#94a3b8" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'rgba(255,255,255,0.9)',
                              border: '1px solid #e2e8f0',
                              borderRadius: '8px',
                              fontSize: '13px',
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="count"
                            stroke="#6366f1"
                            strokeWidth={2}
                            dot={{ fill: '#6366f1', r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {userLocations &&
                userLocations.length > 0 &&
                userLocations.some((l) => l.location !== 'Unknown') ? (
                  <div className="rounded-xl border border-white/20 bg-white/60 p-6 shadow-xs backdrop-blur-sm">
                    <h2 className="text-foreground mb-4 text-sm font-semibold">
                      Users by Location
                    </h2>
                    <div className="space-y-3">
                      {userLocations
                        .filter((l) => l.location !== 'Unknown')
                        .map((loc) => {
                          const maxCount = Math.max(
                            ...userLocations
                              .filter((l) => l.location !== 'Unknown')
                              .map((l) => l.count),
                          );
                          return (
                            <div key={loc.location} className="flex items-center gap-3">
                              <span className="w-32 truncate text-sm font-medium capitalize">
                                {loc.location}
                              </span>
                              <div className="flex flex-1 items-center gap-2">
                                <div
                                  className="bg-primary/70 h-5 rounded-md transition-all duration-500"
                                  style={{
                                    width: `${(loc.count / maxCount) * 100}%`,
                                    minWidth: loc.count > 0 ? '4px' : '0',
                                  }}
                                />
                                <span className="text-muted-foreground min-w-[2rem] text-right text-xs font-semibold">
                                  {loc.count}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-white/20 bg-white/60 p-6 shadow-xs backdrop-blur-sm">
                    <h2 className="text-foreground mb-4 text-sm font-semibold">
                      Users by Location
                    </h2>
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <MapPin className="text-muted-foreground/30 h-10 w-10" />
                      <p className="text-muted-foreground mt-3 text-sm">
                        Location data not captured yet
                      </p>
                      <p className="text-muted-foreground/60 mt-1 max-w-md text-xs">
                        When users grant location permission on their next login, their Dzongkhag
                        will be detected automatically.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
            {activeView === 'knowledge' && (
              <div className="animate-in fade-in-0 slide-in-from-top-2 duration-500 [animation-delay:200ms]">
                <KnowledgeBase />
              </div>
            )}
            {activeView === 'diamond' && (
              <div className="animate-in fade-in-0 slide-in-from-top-2 duration-500 [animation-delay:200ms]">
                <DiamondReview />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
