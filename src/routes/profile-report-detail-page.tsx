import { useParams, useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, MapPin, Calendar, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { useComplaint } from '@/features/complaint/api/use-complaint';
import { ImageLightbox } from '@/features/auth/grievance/components/image-lightbox';

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: 'bg-orange-50', text: 'text-orange-500', label: 'Pending' },
  submitted: { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Submitted' },
  'in-progress': { bg: 'bg-blue-50', text: 'text-blue-500', label: 'In Progress' },
  in_progress: { bg: 'bg-blue-50', text: 'text-blue-500', label: 'In Progress' },
  resolved: { bg: 'bg-green-50', text: 'text-green-500', label: 'Resolved' },
  public: { bg: 'bg-violet-50', text: 'text-violet-500', label: 'Public' },
};

const CATEGORY_MAP: Record<string, string> = {
  road: 'Road Damage',
  garbage: 'Waste Management',
  lighting: 'Street Lighting',
  drainage: 'Drainage/Sewage',
  other: 'Other',
};

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export const ProfileReportDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: report, isLoading, error } = useComplaint(id ?? '');

  const { data: profile } = useQuery({
    queryKey: ['profile-by-id', report?.reporter_id],
    queryFn: async () => {
      if (!report?.reporter_id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .eq('id', report.reporter_id)
        .single();
      return data ?? null;
    },
    enabled: !!report?.reporter_id,
  });

  if (isLoading) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="bg-background flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <FileText className="h-12 w-12 text-gray-300" />
        <p className="text-sm font-semibold text-gray-500">Report not found</p>
        <Button variant="outline" size="sm" onClick={() => navigate('/profile')}>
          Back to Profile
        </Button>
      </div>
    );
  }

  const statusKey = report.status as keyof typeof STATUS_BADGE;
  const badge = STATUS_BADGE[statusKey] ?? STATUS_BADGE.pending;
  const userName = profile?.username ?? 'Unknown';
  const userInitials = userName.slice(0, 2).toUpperCase();
  const categoryLabel = CATEGORY_MAP[report.category] ?? report.category;
  const hasImage = !!report.image_url;

  return (
    <div className="bg-background min-h-screen">
      {/* Back button */}
      <div className="mx-auto max-w-2xl px-4 pt-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/profile/reports')}
          className="text-gray-500 hover:text-gray-800"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          My Reports
        </Button>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-4">
        {/* Card - FeedItem style */}
        <div className="overflow-hidden rounded-xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          {/* Header: avatar + name + badge + time */}
          <div className="flex items-center gap-2.5 px-3 pt-3 pb-2">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={userName}
                className="h-9 w-9 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                {userInitials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <div className="flex min-w-0 items-baseline gap-2">
                  <span className="truncate text-sm font-semibold text-gray-900">{userName}</span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${badge.bg} ${badge.text}`}
                  >
                    {badge.label}
                  </span>
                  <span className="shrink-0 text-xs text-gray-400">
                    {timeAgo(report.created_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Title */}
          <p className="px-3 text-sm leading-relaxed font-semibold text-gray-900">{report.title}</p>

          {/* Description */}
          {report.description && (
            <p className="mt-1 px-3 text-sm leading-relaxed text-gray-600">{report.description}</p>
          )}

          {/* Image */}
          {hasImage && (
            <div className="mt-2">
              <img
                src={report.image_url!}
                alt={report.title}
                loading="lazy"
                className="w-full object-cover"
              />
            </div>
          )}

          {/* Details section - like the action bar in feed items but with report details */}
          <div className="border-t border-gray-100 px-3 py-2.5">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin className="h-3.5 w-3.5" />
                <span>{categoryLabel}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Calendar className="h-3.5 w-3.5" />
                <span>
                  {new Date(report.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
              {report.latitude != null && (
                <button
                  onClick={() => navigate(`/map?lat=${report.latitude}&lng=${report.longitude}`)}
                  className="flex items-center gap-1 text-xs font-medium text-emerald-600 transition-colors hover:text-emerald-700"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  Find on Map
                </button>
              )}
            </div>
          </div>

          {/* Resolution photo */}
          {report.resolved_image_url && (
            <div className="border-t border-gray-100 px-3 py-3">
              <p className="mb-2 text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                Resolution Photo
              </p>
              <div className="overflow-hidden rounded-lg border border-gray-100 shadow-sm">
                <ImageLightbox
                  src={report.resolved_image_url}
                  alt="Resolved"
                  className="w-full object-contain"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
