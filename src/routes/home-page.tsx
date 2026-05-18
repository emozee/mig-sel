import { GrievanceMap } from '@/features/auth/grievance/components/grievance-map.tsx';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-background min-h-screen font-sans">
      {/* Top Bar Navigation */}
      <nav className="border-border bg-card sticky top-0 z-50 flex h-16 items-center justify-between border-b px-6">
        <div className="flex items-center gap-2">
          <span className="text-label-lg text-primary font-bold tracking-wide">Migsel</span>
          <span className="bg-secondary-container text-on-secondary-container rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase">
            Portal
          </span>
        </div>
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="text-body-sm text-muted-foreground hover:text-primary font-medium"
        >
          Exit Session
        </Button>
      </nav>

      {/* Workspace Area Layout */}
      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-8 sm:px-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="bg-card border-border rounded-xl border p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.04)]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-headline-sm text-on-surface font-semibold">
                Live Incident Mapping
              </h2>
            </div>
            <GrievanceMap />
          </div>
        </div>

        {/* Dynamic Action Block Context panel */}
        <div className="space-y-6">
          <div className="bg-card border-border space-y-4 rounded-xl border p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.04)]">
            <h3 className="text-label-lg text-on-surface font-bold tracking-wide uppercase">
              Operational Actions
            </h3>
            <p className="text-body-sm text-muted-foreground">
              Observe reported utility malfunctions or activate tracking metrics to dispatch
              cleanups.
            </p>
            <Button className="bg-primary text-primary-foreground hover:bg-primary-container h-11 w-full rounded-md font-medium shadow-sm transition-all">
              Initiate Quick Report
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};
