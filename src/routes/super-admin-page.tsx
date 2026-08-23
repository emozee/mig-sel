import { Users, UserCheck, UserX, RefreshCw } from 'lucide-react';
import { useUserCounts } from '@/features/auth/api/use-user-counts';

export const SuperAdminPage = () => {
  const { data: counts, isLoading, isError, refetch } = useUserCounts();

  const statCards = [
    {
      label: 'Total Users',
      value: counts?.total ?? 0,
      icon: Users,
      color: 'bg-blue-500/10 text-blue-600',
    },
    {
      label: 'Active Users',
      value: counts?.active ?? 0,
      icon: UserCheck,
      color: 'bg-emerald-500/10 text-emerald-600',
    },
    {
      label: 'Inactive Users',
      value: counts?.inactive ?? 0,
      icon: UserX,
      color: 'bg-amber-500/10 text-amber-600',
    },
  ];

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100/80">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-purple-200/20 blur-3xl" />
        <div className="bg-primary/10 absolute -right-32 -bottom-32 h-96 w-96 rounded-full blur-3xl" />
      </div>
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-white/20 bg-white/70 px-6 backdrop-blur-xl">
          <div>
            <p className="text-muted-foreground/40 text-xs font-semibold tracking-widest uppercase">
              Overview
            </p>
            <h1 className="text-foreground text-xl font-bold tracking-tight">
              Super Admin Dashboard
            </h1>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="hover:bg-accent inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {isError && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
              Failed to load user counts. Make sure you have super admin permissions.
            </div>
          )}

          {isLoading ? (
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
              {statCards.map((card) => (
                <div
                  key={card.label}
                  className="animate-in fade-in-0 slide-in-from-bottom-2 rounded-xl border border-white/20 bg-white/60 p-6 shadow-xs backdrop-blur-sm duration-500"
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
                  <p className="text-foreground text-3xl font-bold tracking-tight">{card.value}</p>
                </div>
              ))}
            </div>
          )}

          {counts && (
            <div className="animate-in fade-in-0 slide-in-from-bottom-2 mt-8 rounded-xl border border-white/20 bg-white/60 p-6 shadow-xs backdrop-blur-sm duration-500 [animation-delay:200ms]">
              <h2 className="text-foreground mb-2 text-sm font-semibold">User Status Breakdown</h2>
              <div className="flex h-4 w-full overflow-hidden rounded-full bg-slate-200">
                {counts.total > 0 && (
                  <>
                    <div
                      className="bg-emerald-500 transition-all duration-700"
                      style={{ width: `${(counts.active / counts.total) * 100}%` }}
                    />
                    <div
                      className="bg-amber-500 transition-all duration-700"
                      style={{ width: `${(counts.inactive / counts.total) * 100}%` }}
                    />
                  </>
                )}
              </div>
              <div className="mt-3 flex gap-6 text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span className="text-muted-foreground">
                    Active ({Math.round((counts.active / counts.total) * 100)}%)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  <span className="text-muted-foreground">
                    Inactive ({Math.round((counts.inactive / counts.total) * 100)}%)
                  </span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
