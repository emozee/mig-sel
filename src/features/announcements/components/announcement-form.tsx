import { useState, useMemo } from 'react';
import { useUserProfile } from '@/features/gamification/api/use-user-profile';
import { useCreateAnnouncement } from '@/features/announcements/api/use-create-announcement';
import { Megaphone, AlertTriangle, Loader2, Calendar } from 'lucide-react';
import type { AnnouncementType } from '@/features/announcements/types';

export const AnnouncementForm = () => {
  const { data: profile } = useUserProfile();
  const mutation = useCreateAnnouncement();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState<AnnouncementType>('announcement');
  const [customExpiry, setCustomExpiry] = useState('');

  const defaultExpiryDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + (type === 'important_notice' ? 3 : 7));
    return d.toISOString().split('T')[0];
  }, [type]);

  const isOfficialOrAdmin = profile?.role === 'official' || profile?.role === 'admin';
  if (!isOfficialOrAdmin) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;

    const expiresAt = customExpiry ? new Date(customExpiry + 'T23:59:59').toISOString() : undefined;

    mutation.mutate(
      { title: title.trim(), body: body.trim(), type, expiresAt },
      {
        onSuccess: () => {
          setTitle('');
          setBody('');
          setType('announcement');
          setCustomExpiry('');
        },
      },
    );
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
    >
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
          <Megaphone className="h-4 w-4 text-emerald-600" />
        </div>
        <h3 className="text-sm font-bold text-gray-900">New Announcement</h3>
      </div>

      <div className="space-y-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setType('announcement')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              type === 'announcement'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            <Megaphone className="h-3.5 w-3.5" />
            Announcement
          </button>
          <button
            type="button"
            onClick={() => setType('important_notice')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              type === 'important_notice'
                ? 'bg-red-100 text-red-700'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            Important Notice
          </button>
        </div>

        <input
          type="text"
          placeholder="Announcement title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm transition-colors outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200"
        />
        <textarea
          placeholder="Write your announcement..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm transition-colors outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200"
        />
        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 text-gray-400" />
          <input
            type="date"
            value={customExpiry || defaultExpiryDate}
            onChange={(e) => setCustomExpiry(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600 transition-colors outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200"
          />
        </div>
        <button
          type="submit"
          disabled={!title.trim() || !body.trim() || mutation.isPending}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-bold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
        >
          {mutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Megaphone className="h-4 w-4" />
          )}
          {mutation.isPending ? 'Posting...' : 'Post Announcement'}
        </button>
      </div>
    </form>
  );
};
