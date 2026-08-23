import { useUserProfile } from '@/features/gamification/api/use-user-profile';
import { useAnnouncements } from '@/features/announcements/api/use-announcements';
import { useDeleteAnnouncement } from '@/features/announcements/api/use-delete-announcement';
import { useUpdateAnnouncement } from '@/features/announcements/api/use-update-announcement';
import { Linkify } from '@/components/ui/linkify';
import {
  Loader2,
  Trash2,
  Pin,
  PinOff,
  Calendar,
  Megaphone,
  AlertTriangle,
  Timer,
} from 'lucide-react';

export const AnnouncementList = () => {
  const { data: profile } = useUserProfile();
  const { data: announcements, isLoading, error } = useAnnouncements();
  const deleteMutation = useDeleteAnnouncement();
  const updateMutation = useUpdateAnnouncement();

  const isOfficialOrAdmin = ['official', 'admin', 'super_admin'].includes(profile?.role ?? '');

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Failed to load announcements.
      </div>
    );
  }

  if (!announcements?.length) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-medium text-gray-500">No announcements yet.</p>
        {isOfficialOrAdmin && (
          <p className="mt-1 text-xs text-gray-400">Use the form above to post an announcement.</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {announcements.map((a) => {
        const isImportant = a.type === 'important_notice';
        const isOwn = isOfficialOrAdmin && a.author_id === profile?.id;
        const expired = a.expires_at && new Date(a.expires_at) < new Date();

        return (
          <div
            key={a.id}
            className={`rounded-xl border bg-white p-5 shadow-sm transition-all ${
              a.is_pinned
                ? 'border-amber-200 ring-1 ring-amber-100'
                : isImportant
                  ? 'border-red-200 ring-1 ring-red-100'
                  : 'border-gray-100'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {expired && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500">
                      <Timer className="h-3 w-3" />
                      Expired
                    </span>
                  )}
                  {!expired && a.is_pinned && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                      <Pin className="h-3 w-3" />
                      Pinned
                    </span>
                  )}
                  {!expired && isImportant && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700">
                      <AlertTriangle className="h-3 w-3" />
                      Important
                    </span>
                  )}
                  {!expired && !a.is_pinned && !isImportant && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      <Megaphone className="h-3 w-3" />
                      Announcement
                    </span>
                  )}
                  <h3 className="text-base font-bold text-gray-900">{a.title}</h3>
                </div>
                <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-gray-600">
                  <Linkify>{a.body}</Linkify>
                </p>
                <div className="mt-3 flex items-center gap-3 text-[11px] text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(a.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  {a.expires_at && (
                    <span className={`flex items-center gap-1 ${expired ? 'text-gray-400' : ''}`}>
                      <Timer className="h-3 w-3" />
                      {expired
                        ? 'Expired'
                        : `Expires ${new Date(a.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                    </span>
                  )}
                  <span className="font-medium text-gray-500">— Official</span>
                </div>
              </div>

              {isOwn && (
                <div className="flex shrink-0 gap-1">
                  <button
                    onClick={() =>
                      updateMutation.mutate({
                        id: a.id,
                        is_pinned: !a.is_pinned,
                      })
                    }
                    disabled={updateMutation.isPending}
                    className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-amber-50 hover:text-amber-500 disabled:opacity-50"
                    title={a.is_pinned ? 'Unpin' : 'Pin'}
                  >
                    {a.is_pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(a.id)}
                    disabled={deleteMutation.isPending}
                    className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
