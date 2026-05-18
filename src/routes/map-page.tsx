import { GrievanceMap } from '@/features/auth/grievance/components/grievance-map.tsx';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export const MapPage = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-background min-h-screen font-sans">
      <nav className="border-border bg-card sticky top-0 z-50 flex h-16 items-center justify-between border-b px-6">
        <div className="flex items-center gap-2">
          <span className="text-label-lg text-primary font-bold tracking-wide">Migsel</span>
          <span className="bg-secondary-container text-on-secondary-container rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase">
            Complaint Portal
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="default"
            size="sm"
            className="bg-primary text-primary-foreground font-medium"
          >
            Launch Complaint
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="text-body-sm text-muted-foreground hover:text-primary font-medium"
          >
            Exit
          </Button>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-6">
          <h1 className="text-headline-sm text-on-surface font-semibold">Report an Issue</h1>
          <p className="text-body-sm text-muted-foreground mt-1">
            Select a location on the map or use your current location to file a complaint.
          </p>
        </div>
        <div className="bg-card border-border rounded-xl border p-4 shadow-[0px_4px_20px_rgba(0,0,0,0.04)]">
          <GrievanceMap />
        </div>
      </main>
    </div>
  );
};
