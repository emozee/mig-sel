import { useState } from 'react';
import { Menu, FileText } from 'lucide-react';
import { InspectorSidebar } from '@/components/layout/inspector-sidebar';
import { WasteReportingForm } from '@/features/waste/components/waste-reporting-form';

export const InspectorPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100/80">
      <div className="pointer-events-none fixed inset-0">
        <div className="bg-primary/10 absolute -top-32 -left-32 h-96 w-96 rounded-full blur-3xl" />
        <div className="bg-primary/10 absolute -right-32 -bottom-32 h-96 w-96 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/3 h-64 w-64 -translate-y-1/2 rounded-full bg-blue-200/10 blur-3xl" />
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <InspectorSidebar isMobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col md:ml-60">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-white/20 bg-white/70 px-4 backdrop-blur-xl md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="hover:bg-accent rounded-lg p-1.5 transition-all"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-bold tracking-tight">Inspector</h1>
            <p className="text-muted-foreground/70 truncate text-xs">Waste Reporting Portal</p>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div
            className="mx-auto px-4 pt-4 pb-36 sm:px-6 sm:pb-12 lg:px-8"
            style={{ maxWidth: '1200px' }}
          >
            <div className="animate-in fade-in-0 slide-in-from-top-2 mb-8 hidden duration-500 [animation-delay:100ms] md:block">
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-xl">
                  <FileText className="text-primary h-6 w-6" />
                </div>
                <div>
                  <div className="text-muted-foreground/40 mb-1 text-xs font-semibold tracking-widest uppercase">
                    Inspector
                  </div>
                  <h1 className="text-foreground text-2xl font-bold tracking-tight">
                    Waste Reporting
                  </h1>
                  <p className="text-muted-foreground mt-0.5 text-sm">
                    Submit waste collection records for inspection
                  </p>
                </div>
              </div>
            </div>

            <WasteReportingForm />
          </div>
        </main>
      </div>
    </div>
  );
};
