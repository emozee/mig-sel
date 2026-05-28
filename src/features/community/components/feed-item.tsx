import { useRef, useState, useEffect } from 'react';
import { Heart, MoreHorizontal, Edit3, Trash2, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useCurrentUser } from '@/features/auth/api/use-current-user';
import { useToggleUpvote } from '../api/use-toggle-upvote';
import { useDeleteFeedItem } from '../api/use-delete-feed-item';
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
  const navigate = useNavigate();
  const { mutate: deleteFeedItem } = useDeleteFeedItem();
  const { mutate, isPending } = useToggleUpvote();
  const clickLock = useRef(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isOwner = user?.id === item.userId;

  const handleDelete = () => {
    if (!confirm('Delete this post?')) return;
    deleteFeedItem(item.id);
    setMenuOpen(false);
  };

  const handleFindOnMap = () => {
    setMenuOpen(false);
    if (item.latitude && item.longitude) {
      navigate(`/map?lat=${item.latitude}&lng=${item.longitude}`);
    } else if (item.location) {
      navigate(`/map?search=${encodeURIComponent(item.location)}`);
    } else {
      navigate('/map');
    }
  };

  const handleEdit = () => {
    setMenuOpen(false);
    // TODO: open edit dialog
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen((v) => !v);
  };

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

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
        {item.avatarUrl ? (
          <img
            src={item.avatarUrl}
            alt={item.userName}
            className="h-9 w-9 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
            {item.userInitials}
          </div>
        )}
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
            <div className="relative" ref={menuRef}>
              <button
                onClick={handleMenuClick}
                className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
              {menuOpen && (
                <div className="absolute top-8 right-0 z-50 w-40 overflow-hidden rounded-xl bg-white py-1 shadow-lg ring-1 ring-gray-200/60">
                  {isOwner && (
                    <>
                      <button
                        onClick={handleEdit}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={handleDelete}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                      <div className="mx-2 my-1 border-t border-gray-100" />
                    </>
                  )}
                  <button
                    onClick={handleFindOnMap}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    Find on Map
                  </button>
                </div>
              )}
            </div>
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
            strokeWidth={item.isUpvoted ? 0 : 1}
          />
          <span className="text-sm font-medium">{item.upvoteCount}</span>
        </button>

        <CommentSection item={item} />
      </div>
    </div>
  );
};
