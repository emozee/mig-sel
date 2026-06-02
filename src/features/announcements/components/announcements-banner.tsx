import { useAnnouncements } from '@/features/announcements/api/use-announcements';
import { Megaphone, AlertTriangle, Pin, Loader2 } from 'lucide-react';

export const AnnouncementsBanner = () => {
  const { data: announcements, isLoading } = useAnnouncements();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-gray-300" />
      </div>
    );
  }

  if (!announcements?.length) return null;

  return (
    <div className="space-y-2">
      {announcements.slice(0, 3).map((a) => {
        const isImportant = a.type === 'important_notice';
        return (
          <div
            key={a.id}
            className={`rounded-xl border bg-white p-3 shadow-sm transition-all ${
              a.is_pinned
                ? 'border-amber-200 ring-1 ring-amber-100'
                : isImportant
                  ? 'border-red-200 ring-1 ring-red-100'
                  : 'border-gray-100'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <div
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${
                  isImportant ? 'bg-red-50' : 'bg-emerald-50'
                }`}
              >
                {isImportant ? (
                  <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                ) : (
                  <Megaphone className="h-3.5 w-3.5 text-emerald-600" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  {a.is_pinned && <Pin className="h-3 w-3 text-amber-500" />}
                  <p className="truncate text-sm font-bold text-gray-900">{a.title}</p>
                </div>
                <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-gray-500">
                  {a.body}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
