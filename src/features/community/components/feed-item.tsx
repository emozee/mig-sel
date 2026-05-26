import { useRef } from 'react';
import { Heart, MoreHorizontal } from 'lucide-react';
import { useCurrentUser } from '@/features/auth/api/use-current-user';
import { useToggleUpvote } from '../api/use-toggle-upvote';
import { CommentSection } from './comment-section';
import type { ActivityItem, FeedStatus } from '../types';

const STATUS_BADGE: Record<FeedStatus, { bg: string; text: string; label: string }> = {
  pending: { bg: 'bg-orange-50', text: 'text-orange-600', label: 'Pending' },
  'in-progress': { bg: 'bg-blue-50', text: 'text-blue-600', label: 'In Progress' },
  resolved: { bg: 'bg-green-50', text: 'text-green-600', label: 'Resolved' },
};

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface FeedItemProps {
  item: ActivityItem;
}

export const FeedItem = ({ item }: FeedItemProps) => {
  const { user } = useCurrentUser();
  const { mutate, isPending } = useToggleUpvote();
  const clickLock = useRef(false);

  const handleUpvote = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('[handleUpvote] click', {
      feedId: item.id,
      isUpvoted: item.isUpvoted,
      clickLock: clickLock.current,
      isPending,
    });
    if (!user || clickLock.current) return;
    clickLock.current = true;
    mutate(
      { feedId: item.id, isCurrentlyUpvoted: item.isUpvoted },
      {
        onSettled: () => {
          clickLock.current = false;
        },
      },
    );
  };

  return (
    <div className="rounded-xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <div className="flex items-center gap-2.5 px-3 pt-3 pb-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
          {item.userInitials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <div className="flex min-w-0 items-baseline gap-2">
              <span className="truncate text-sm font-semibold text-gray-900">{item.userName}</span>
              {item.status && (
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_BADGE[item.status].bg} ${STATUS_BADGE[item.status].text}`}
                >
                  {STATUS_BADGE[item.status].label}
                </span>
              )}
              <span className="shrink-0 text-xs text-gray-400">{timeAgo(item.timestamp)}</span>
            </div>
            <MoreHorizontal className="h-4 w-4 shrink-0 text-gray-400" />
          </div>
        </div>
      </div>

      <p className="px-3 pb-2 text-sm leading-relaxed text-gray-700">{item.action}</p>

      {item.image_url && (
        <div className="mb-0">
          <img src={item.image_url} alt="" className="w-full object-cover" />
        </div>
      )}

      <div className="flex items-center gap-4 px-3 py-2.5">
        <button
          onClick={handleUpvote}
          disabled={isPending}
          className={`flex items-center gap-1 text-sm transition-colors ${
            item.isUpvoted ? 'text-emerald-600' : 'text-gray-500 hover:text-gray-800'
          } ${isPending ? 'opacity-50' : ''}`}
        >
          <Heart
            className="h-[18px] w-[18px]"
            fill={item.isUpvoted ? 'currentColor' : 'none'}
            strokeWidth={item.isUpvoted ? 0 : 2}
          />
          <span className="text-sm font-medium">{item.upvoteCount}</span>
        </button>

        <CommentSection item={item} />
      </div>
    </div>
  );
};
