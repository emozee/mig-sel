import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Megaphone, FileText, Menu, MapPin, Clock, MoveRight, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OfficialSidebar, type OfficialNavView } from '@/components/layout/official-sidebar';
import { AnnouncementForm } from '@/features/announcements/components/announcement-form';
import { AnnouncementList } from '@/features/announcements/components/announcement-list';
import { useMyReports } from '@/features/complaint/api/use-my-reports';
import { Button } from '@/components/ui/button';

const iconMap: Record<OfficialNavView, typeof Megaphone> = {
  announcements: Megaphone,
  reports: FileText,
};

const statusIcon = {
  submitted: Clock,
  in_progress: MoveRight,
  resolved: CheckCheck,
} as const;

const statusColors = {
  submitted: 'bg-gray-100 text-gray-600',
  in_progress: 'bg-amber-50 text-amber-700',
  resolved: 'bg-green-50 text-green-700',
} as const;

export const OfficialPage = () => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<OfficialNavView>('announcements');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: reports = [], isLoading } = useMyReports();

  const pageMeta: Record<OfficialNavView, { title: string; description: string }> = {
    announcements: {
      title: 'Announcements',
      description: 'Post and manage official announcements',
    },
    reports: {
      title: 'My Reports',
      description: 'View your submitted reports',
    },
  };

  const { title: pageTitle, description: pageDescription } = pageMeta[activeView];
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

      <OfficialSidebar
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
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-bold tracking-tight">{pageTitle}</h1>
            <p className="text-muted-foreground/70 truncate text-xs">{pageDescription}</p>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="mx-auto px-4 py-8 sm:px-6 lg:px-8" style={{ maxWidth: '1200px' }}>
            <div className="animate-in fade-in-0 slide-in-from-top-2 mb-8 hidden duration-500 [animation-delay:100ms] md:block">
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-xl">
                  <IconComponent className="text-primary h-6 w-6" />
                </div>
                <div>
                  <div className="text-muted-foreground/40 mb-1 text-xs font-semibold tracking-widest uppercase">
                    Official
                  </div>
                  <h1 className="text-foreground text-2xl font-bold tracking-tight">{pageTitle}</h1>
                  <p className="text-muted-foreground mt-0.5 text-sm">{pageDescription}</p>
                </div>
              </div>
            </div>

            {activeView === 'announcements' && (
              <div className="animate-in fade-in-0 slide-in-from-top-2 space-y-6 duration-500 [animation-delay:200ms]">
                <AnnouncementForm />
                <AnnouncementList />
              </div>
            )}

            {activeView === 'reports' && (
              <div className="animate-in fade-in-0 slide-in-from-top-2 space-y-3 duration-500 [animation-delay:200ms]">
                {isLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="border-primary/20 border-t-primary h-8 w-8 animate-spin rounded-full border-4" />
                  </div>
                ) : reports.length === 0 ? (
                  <div className="bg-card shadow-card flex flex-col items-center justify-center rounded-xl border px-6 py-16">
                    <div className="bg-muted mb-4 flex h-14 w-14 items-center justify-center rounded-xl">
                      <FileText className="text-muted-foreground/50 h-7 w-7" />
                    </div>
                    <p className="text-foreground text-sm font-semibold">No reports yet</p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      Submit a complaint from the map to get started
                    </p>
                    <Button onClick={() => navigate('/map')} size="sm" className="mt-4 font-bold">
                      Go to map
                    </Button>
                  </div>
                ) : (
                  reports.map((report) => {
                    const Icon = statusIcon[report.status as keyof typeof statusIcon] ?? FileText;
                    return (
                      <button
                        key={report.id}
                        onClick={() => navigate(`/profile/reports/${report.id}`)}
                        className="bg-card shadow-card hover:shadow-elevated w-full rounded-xl border p-4 text-left transition-all"
                      >
                        <div className="flex items-start gap-3">
                          <div className="bg-primary/10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                            <MapPin className="text-primary h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-foreground text-sm font-semibold">
                                {report.title}
                              </p>
                              <span
                                className={cn(
                                  'flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold',
                                  statusColors[report.status as keyof typeof statusColors] ??
                                    'bg-blue-50 text-blue-700',
                                )}
                              >
                                <Icon className="h-3 w-3" />
                                {report.status.replace(/_/g, ' ')}
                              </span>
                            </div>
                            <p className="text-muted-foreground mt-0.5 text-xs">
                              {new Date(report.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </p>
                            {report.description && (
                              <p className="text-muted-foreground mt-2 line-clamp-2 text-xs leading-relaxed">
                                {report.description}
                              </p>
                            )}
                          </div>
                        </div>
                        {report.image_url && (
                          <div className="mt-2 overflow-hidden rounded-lg border">
                            <img
                              src={report.image_url}
                              alt={report.title}
                              loading="lazy"
                              className="max-h-48 w-full object-cover"
                            />
                          </div>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
