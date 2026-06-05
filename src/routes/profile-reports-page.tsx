import { useState } from 'react';
import {
  ArrowLeft,
  FileText,
  MapPin,
  Clock,
  MoveRight,
  CheckCheck,
  AlertTriangle,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useMyReports, useDismissDeletedReport } from '@/features/complaint/api/use-my-reports';

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

export const ProfileReportsPage = () => {
  const navigate = useNavigate();
  const { data: reports = [], isLoading } = useMyReports();
  const dismissMutation = useDismissDeletedReport();
  const [dismissingId, setDismissingId] = useState<string | null>(null);

  const activeReports = reports.filter((r: { deleted_at: string | null }) => !r.deleted_at);
  const deletedReports = reports.filter((r: { deleted_at: string | null }) => r.deleted_at);

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/profile')}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Profile
          </Button>
        </div>

        <div className="mb-6">
          <h1 className="text-foreground text-2xl font-bold">My Reports</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {activeReports.length} {activeReports.length === 1 ? 'report' : 'reports'} active
            {deletedReports.length > 0 && (
              <span className="text-muted-foreground/60">
                {' '}
                &middot; {deletedReports.length} removed by admin
              </span>
            )}
          </p>
        </div>

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
          <div className="space-y-3">
            {activeReports.map((report) => {
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
                        <p className="text-foreground text-sm font-semibold">{report.title}</p>
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
            })}

            {deletedReports.length > 0 && (
              <div className="pt-6">
                <h2 className="text-muted-foreground mb-3 text-xs font-bold tracking-wider uppercase">
                  Removed by admin
                </h2>
                <div className="space-y-2">
                  {deletedReports.map((report) => (
                    <div
                      key={report.id}
                      className="bg-card shadow-card flex items-start gap-3 rounded-xl border border-red-200 p-4 opacity-70"
                    >
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-foreground text-sm font-medium">{report.title}</p>
                        <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
                          This report was removed by an admin. No further action is needed from you.
                        </p>
                        <p className="text-muted-foreground/60 mt-1 text-[10px]">
                          {new Date(report.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={dismissingId === report.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setDismissingId(report.id);
                          dismissMutation.mutate(report.id, {
                            onSuccess: () => toast.success('Report dismissed'),
                            onError: () => toast.error('Failed to dismiss'),
                            onSettled: () => setDismissingId(null),
                          });
                        }}
                        className="text-muted-foreground hover:text-foreground h-8 w-8 shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
