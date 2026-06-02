import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router';
import {
  Heart,
  MessageCircle,
  Share2,
  Link2,
  CheckCircle,
  Clock,
  MoreVertical,
  Pencil,
  Trash2,
  MapPin,
  X,
  Check,
  Loader2,
  Users,
  ShieldAlert,
  BadgeCheck,
} from 'lucide-react';
import { useCurrentUser } from '@/features/auth/api/use-current-user';
import { useIsAdmin } from '@/features/auth/api/use-is-admin';
import { useDiamondUpvote } from '../api/use-diamond-upvote';
import { useDiamondShare } from '../api/use-diamond-share';
import { useDeleteDiamond } from '../api/use-delete-diamond';
import { useAdminRemoveDiamond } from '../api/use-admin-remove-diamond';
import { useUpdateDiamond } from '../api/use-update-diamond';
import { DiamondCommentSection } from './diamond-comment-section';
import { DiamondPhotoGallery } from './diamond-photo-gallery';
import type { DiamondFeedItem } from '../types';

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

interface DiamondPostProps {
  post: DiamondFeedItem;
  index?: number;
}

export const DiamondPost = ({ post, index = 0 }: DiamondPostProps) => {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const { data: isAdmin } = useIsAdmin();
  const { mutate: toggleUpvote, isPending: isUpvoting } = useDiamondUpvote();
  const { mutate: toggleShare, isPending: isSharing } = useDiamondShare();
  const { mutateAsync: deleteDiamond, isPending: isDeleting } = useDeleteDiamond();
  const { mutateAsync: adminRemoveDiamond, isPending: isAdminRemoving } = useAdminRemoveDiamond();
  const { mutateAsync: updateDiamond, isPending: isUpdating } = useUpdateDiamond();

  const isOwner = user?.id === post.userId;
  const images = post.imageUrls;
  const isDirectSolve = !!post.linkedGrievanceId;
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(post.body);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmAdminRemove, setConfirmAdminRemove] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [heartAnim, setHeartAnim] = useState(false);
  const clickLock = useRef(false);

  const handleEdit = useCallback(async () => {
    if (!editBody.trim() || editBody === post.body) {
      setEditing(false);
      return;
    }
    await updateDiamond({ diamondId: post.id, body: editBody.trim() });
    setEditing(false);
  }, [editBody, post.body, post.id, updateDiamond]);

  const handleDelete = useCallback(async () => {
    await deleteDiamond(post.id);
    setMenuOpen(false);
    setConfirmDelete(false);
  }, [deleteDiamond, post.id]);

  const handleAdminRemove = useCallback(async () => {
    await adminRemoveDiamond(post.id);
    setMenuOpen(false);
    setConfirmAdminRemove(false);
  }, [adminRemoveDiamond, post.id]);

  const handleUpvote = useCallback(() => {
    if (!user || clickLock.current) return;
    clickLock.current = true;
    setHeartAnim(true);
    setTimeout(() => setHeartAnim(false), 600);
    toggleUpvote(post.id, {
      onSettled: () => {
        clickLock.current = false;
      },
    });
  }, [user, post.id, toggleUpvote]);

  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}/diamond?post=${post.id}`;
    if (navigator.share) {
      await navigator.share({ title: post.userName, text: post.body, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url);
    }
    toggleShare(post.id);
  }, [post.id, post.userName, post.body, toggleShare]);

  return (
    <div
      className="animate-fade-in overflow-hidden rounded-xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)] transition-all duration-200"
      style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'both' }}
    >
      {/* Header */}
      <div className="flex items-start gap-3 px-4 pt-4 pb-2">
        {post.avatarUrl ? (
          <img
            src={post.avatarUrl}
            alt={post.userName}
            className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-gray-100"
          />
        ) : (
          <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold">
            {post.userInitials}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-900">{post.userName}</span>
            {post.userRole === 'official' && (
              <BadgeCheck className="text-primary h-3.5 w-3.5 shrink-0" />
            )}
            <span className="text-[11px] text-gray-400">· {timeAgo(post.createdAt)}</span>
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
            {isDirectSolve &&
              (post.status === 'accepted' ? (
                <span className="bg-primary/10 text-primary inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium">
                  <CheckCircle className="h-3 w-3" />
                  10 pts awarded
                </span>
              ) : post.status === 'rejected' ? (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-red-100/80 px-1.5 py-0.5 text-[10px] font-medium text-red-700">
                  <X className="h-3 w-3" />
                  Rejected
                </span>
              ) : (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100/80 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                  <Clock className="h-3 w-3" />
                  10 pts pending
                </span>
              ))}
            {post.collaborators.length > 0 && (
              <div className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-1.5 py-0.5">
                <Users className="h-2.5 w-2.5 text-gray-500" />
                <span className="text-[10px] font-medium text-gray-600">With:</span>
                <div className="flex -space-x-1">
                  {post.collaborators.slice(0, 3).map((c) =>
                    c.avatarUrl ? (
                      <img
                        key={c.userId}
                        src={c.avatarUrl}
                        alt=""
                        title={c.userName}
                        className="h-4 w-4 rounded-full object-cover ring-1 ring-white"
                      />
                    ) : (
                      <div
                        key={c.userId}
                        title={c.userName}
                        className="flex h-4 w-4 items-center justify-center rounded-full bg-gray-300 text-[6px] font-bold text-white ring-1 ring-white"
                      >
                        {c.userInitials}
                      </div>
                    ),
                  )}
                </div>
                {post.collaborators.length > 3 && (
                  <span className="text-[9px] text-gray-400">+{post.collaborators.length - 3}</span>
                )}
              </div>
            )}
          </div>
        </div>
        {(isOwner || isAdmin) && (
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute top-9 right-0 z-50 min-w-[150px] overflow-hidden rounded-xl bg-white py-1 shadow-lg ring-1 ring-gray-200/60">
                  {isOwner && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setEditBody(post.body);
                          setEditing(true);
                          setMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                      >
                        <Pencil className="h-3.5 w-3.5 text-gray-400" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmDelete(true);
                          setMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </>
                  )}
                  {isAdmin && !isOwner && (
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmAdminRemove(true);
                        setMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                    >
                      <ShieldAlert className="h-3.5 w-3.5" />
                      Remove Post
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {editing ? (
        <div className="px-4 py-2">
          <textarea
            value={editBody}
            onChange={(e) => setEditBody(e.target.value)}
            className="focus:border-primary/30 focus:ring-primary/10 w-full resize-none rounded-xl border border-gray-200 bg-white p-3 text-sm leading-relaxed text-gray-700 outline-none focus:ring-2"
            rows={3}
            maxLength={1000}
            autoFocus
          />
          <div className="mt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100"
            >
              <X className="h-3.5 w-3.5" />
              Cancel
            </button>
            <button
              type="button"
              onClick={handleEdit}
              disabled={isUpdating || !editBody.trim()}
              className="bg-primary hover:bg-primary/90 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-colors disabled:opacity-50"
            >
              {isUpdating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              Save
            </button>
          </div>
        </div>
      ) : (
        post.body && <p className="px-4 py-1 text-sm leading-relaxed text-gray-800">{post.body}</p>
      )}

      {images.length > 0 && (
        <div className="px-2 pb-0">
          <DiamondPhotoGallery images={images} post={post} />
        </div>
      )}

      {isDirectSolve && post.linkedGrievanceTitle && (
        <div className="mx-3 mt-2 flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
          {post.linkedGrievanceImage ? (
            <img
              src={post.linkedGrievanceImage}
              alt=""
              className="h-9 w-9 shrink-0 rounded-lg object-cover ring-1 ring-gray-200"
            />
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-200">
              <Link2 className="h-4 w-4 text-gray-500" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <Link2 className="h-3 w-3 shrink-0 text-gray-400" />
              <span className="truncate text-[11px] font-medium text-gray-700">
                {post.linkedGrievanceTitle}
              </span>
            </div>
          </div>
          {post.linkedGrievanceLat != null && post.linkedGrievanceLng != null && (
            <button
              type="button"
              onClick={() => navigate(`/map?grievance=${post.linkedGrievanceId}`)}
              className="flex shrink-0 items-center gap-1 rounded-lg bg-gray-200 px-2.5 py-1.5 text-[10px] font-medium text-gray-700 transition-colors hover:bg-gray-300"
            >
              <MapPin className="h-3 w-3" />
              Map
            </button>
          )}
        </div>
      )}

      {/* Facebook-style action bar with share count */}
      <div className="mx-4 mt-2 flex items-center border-t border-gray-100 py-1">
        <button
          onClick={handleUpvote}
          disabled={isUpvoting}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded py-2 text-xs font-semibold transition-colors ${
            post.isUpvoted ? 'text-primary' : 'text-gray-500 hover:text-gray-700'
          } ${isUpvoting ? 'opacity-50' : ''}`}
        >
          <Heart
            className={`h-[18px] w-[18px] transition-all duration-300 ${
              post.isUpvoted ? 'fill-primary' : ''
            } ${heartAnim ? 'animate-heart-beat' : ''}`}
            strokeWidth={post.isUpvoted ? 0 : 1.5}
          />
          <span>Like{post.upvoteCount > 0 ? ` (${post.upvoteCount})` : ''}</span>
        </button>

        <button
          onClick={() => setCommentsOpen(!commentsOpen)}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded py-2 text-xs font-semibold transition-colors ${
            commentsOpen ? 'text-primary bg-primary/5' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <MessageCircle className="h-[18px] w-[18px]" strokeWidth={1.5} />
          <span>Comment{post.commentCount > 0 ? ` (${post.commentCount})` : ''}</span>
        </button>

        <button
          onClick={handleShare}
          disabled={isSharing}
          className="flex flex-1 items-center justify-center gap-1.5 rounded py-2 text-xs font-semibold text-gray-500 transition-colors hover:text-gray-700 disabled:opacity-50"
        >
          {isSharing ? (
            <Loader2 className="h-[18px] w-[18px] animate-spin" />
          ) : (
            <Share2 className="h-[18px] w-[18px]" strokeWidth={1.5} />
          )}
          <span>Share{post.shareCount > 0 ? ` (${post.shareCount})` : ''}</span>
        </button>
      </div>

      {/* Comment section */}
      <DiamondCommentSection
        diamondId={post.id}
        open={commentsOpen}
        onToggle={() => setCommentsOpen(!commentsOpen)}
      />

      {/* Delete confirmation (owner) */}
      {confirmDelete && (
        <div className="border-t border-red-100 bg-red-50 px-4 py-2.5">
          <p className="mb-2 text-xs font-medium text-red-600">Delete this post?</p>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-1.5 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
            >
              {isDeleting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Admin remove confirmation */}
      {confirmAdminRemove && (
        <div className="border-t border-red-100 bg-red-50 px-4 py-2.5">
          <p className="mb-1 text-xs font-medium text-red-600">Remove this post?</p>
          <p className="mb-2 text-[10px] leading-relaxed text-red-500">
            This post may contain sensitive content. It will be permanently deleted.
          </p>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmAdminRemove(false)}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAdminRemove}
              disabled={isAdminRemoving}
              className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              {isAdminRemoving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ShieldAlert className="h-3.5 w-3.5" />
              )}
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
