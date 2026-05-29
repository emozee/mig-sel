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

const iconMap: Record<NavView, typeof ClipboardList> = {
  complaint: ClipboardList,
  table: Recycle,
  inspector: FileText,
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
      description: 'Monitor and manage community complaints',
    },
    table: { title: 'Waste Management', description: 'Oversight panel for GMC waste management' },
    inspector: { title: 'Inspector', description: 'Submit waste collection records' },
    role: { title: 'Role Assignment', description: 'Search and update user roles' },
    charts: { title: 'Analytics', description: 'Oversight panel for GMC waste management' },
    knowledge: { title: 'Knowledge Base', description: 'Manage chatbot Q&A pairs' },
  };

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
        <div className="absolute -right-32 -bottom-32 h-96 w-96 rounded-full bg-emerald-200/20 blur-3xl" />
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
            {activeView === 'knowledge' && (
              <div className="animate-in fade-in-0 slide-in-from-top-2 duration-500 [animation-delay:200ms]">
                <KnowledgeBase />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
