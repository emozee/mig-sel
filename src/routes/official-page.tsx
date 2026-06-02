import { useNavigate } from 'react-router';
import { ArrowLeft, FileText, Building2, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MapDock } from '@/components/layout/map-dock';
import { useUserProfile } from '@/features/gamification/api/use-user-profile';

export const OfficialPage = () => {
  const navigate = useNavigate();
  const { data: profile } = useUserProfile();

  return (
    <div className="bg-background min-h-dvh">
      <div className="mx-auto max-w-2xl px-4 py-6 pb-24">
        <div className="mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/reports-feed')}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
        </div>

        <div className="bg-card shadow-card mb-6 overflow-hidden rounded-xl border p-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-xl">
              <Building2 className="text-primary h-6 w-6" />
            </div>
            <div>
              <h1 className="text-foreground text-lg font-bold">Official Dashboard</h1>
              <p className="text-muted-foreground text-sm">{profile?.username ?? 'Official'}</p>
            </div>
          </div>
        </div>

        <div className="bg-card shadow-card divide-y rounded-xl border">
          <button
            onClick={() => navigate('/announcements')}
            className="hover:bg-muted/50 flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors"
          >
            <div className="bg-primary/10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
              <Megaphone className="text-primary h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-foreground text-sm font-semibold">Announcements</p>
              <p className="text-muted-foreground text-xs">Manage announcements</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/profile/reports')}
            className="hover:bg-muted/50 flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors"
          >
            <div className="bg-primary/10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
              <FileText className="text-primary h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-foreground text-sm font-semibold">My Reports</p>
              <p className="text-muted-foreground text-xs">View submitted reports</p>
            </div>
          </button>
        </div>
      </div>

      <MapDock />
    </div>
  );
};
