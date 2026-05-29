import { useState, useMemo, useRef, useCallback } from 'react';
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
} from 'lucide-react';
import { ClickableImage } from '@/components/ui/image-viewer';
import { useCurrentUser } from '@/features/auth/api/use-current-user';
import { useDiamondUpvote } from '../api/use-diamond-upvote';
import { useDeleteDiamond } from '../api/use-delete-diamond';
import { useUpdateDiamond } from '../api/use-update-diamond';
import { DiamondCommentSection } from './diamond-comment-section';
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
  const { mutate: toggleUpvote, isPending: isUpvoting } = useDiamondUpvote();
  const { mutateAsync: deleteDiamond, isPending: isDeleting } = useDeleteDiamond();
  const { mutateAsync: updateDiamond, isPending: isUpdating } = useUpdateDiamond();

  const isOwner = user?.id === post.userId;
  const images = post.imageUrls;
  const isDirectSolve = !!post.linkedGrievanceId;
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(post.body);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [heartAnim, setHeartAnim] = useState(false);
  const clickLock = useRef(false);

  const imageGrid = useMemo(() => {
    if (images.length === 0) return null;

    if (images.length === 1) {
      return (
        <ClickableImage
          src={images[0]}
          alt=""
          className="max-h-96 w-full rounded-lg object-cover"
        />
      );
    }

    if (images.length === 2) {
      return (
        <div className="grid grid-cols-2 gap-1">
          {images.map((url, i) => (
            <ClickableImage
              key={i}
              src={url}
              alt=""
              className="aspect-square w-full rounded-lg object-cover"
            />
          ))}
        </div>
      );
    }

    if (images.length === 3) {
      return (
        <div className="grid grid-cols-2 gap-1">
          <ClickableImage
            src={images[0]}
            alt=""
            className="row-span-2 h-full w-full rounded-l-lg object-cover"
          />
          <ClickableImage
            src={images[1]}
            alt=""
            className="aspect-square w-full rounded-tr-lg object-cover"
          />
          <ClickableImage
            src={images[2]}
            alt=""
            className="aspect-square w-full rounded-br-lg object-cover"
          />
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 gap-1">
        {images.slice(0, 4).map((url, i) => (
          <div key={i} className="group relative overflow-hidden">
            <ClickableImage
              src={url}
              alt=""
              className="aspect-square w-full rounded-lg object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {i === 3 && images.length > 4 && (
              <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/60 text-lg font-bold text-white backdrop-blur-[2px]">
                +{images.length - 4}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }, [images]);

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
  }, [post.id, post.userName, post.body]);

  return (
    <div
      className="group shadow-card hover:shadow-elevated animate-fade-in overflow-hidden rounded-2xl border border-white/30 bg-white/60 backdrop-blur-xl transition-all duration-500 hover:scale-[1.01]"
      style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'both' }}
    >
      {/* Header */}
      <div className="flex items-start gap-3 px-4 pt-4 pb-2">
        {/* Avatar */}
        {post.avatarUrl ? (
          <img
            src={post.avatarUrl}
            alt={post.userName}
            className="ring-primary/10 group-hover:ring-primary/30 h-10 w-10 shrink-0 rounded-full object-cover ring-2 transition-transform duration-300"
          />
        ) : (
          <div className="from-primary/20 to-primary/10 text-primary ring-primary/5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold ring-2">
            {post.userInitials}
          </div>
        )}

        <div className="min-w-0 flex-1">
          {/* User name + time */}
          <div className="flex items-center gap-2">
            <span className="text-foreground text-sm font-bold">{post.userName}</span>
            <span className="text-muted-foreground/60 text-[11px]">
              · {timeAgo(post.createdAt)}
            </span>
          </div>

          {/* Direct solve badge + collaborators on same row */}
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {isDirectSolve &&
              (post.status === 'accepted' ? (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100/80 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                  <CheckCircle className="h-3 w-3" />
                  10 pts awarded
                </span>
              ) : (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100/80 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                  <Clock className="h-3 w-3" />
                  10 pts pending
                </span>
              ))}

            {/* Collaborators inline with badge */}
            {post.collaborators.length > 0 && (
              <div className="bg-primary/5 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5">
                <Users className="text-primary/60 h-2.5 w-2.5" />
                <span className="text-primary/80 text-[10px] font-medium">With:</span>
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
                        className="bg-primary/10 text-primary flex h-4 w-4 items-center justify-center rounded-full text-[6px] font-bold ring-1 ring-white"
                      >
                        {c.userInitials}
                      </div>
                    ),
                  )}
                </div>
                {post.collaborators.length > 3 && (
                  <span className="text-muted-foreground/60 text-[9px]">
                    +{post.collaborators.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Ellipsis menu */}
        {isOwner && (
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-muted-foreground/50 hover:text-foreground flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 hover:bg-white/80 hover:shadow-sm"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="animate-scale-in absolute top-9 right-0 z-50 min-w-[150px] overflow-hidden rounded-xl border border-white/40 bg-white/95 py-1 shadow-lg backdrop-blur-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setEditBody(post.body);
                      setEditing(true);
                      setMenuOpen(false);
                    }}
                    className="text-foreground hover:bg-accent flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-xs font-medium transition-colors"
                  >
                    <Pencil className="text-muted-foreground h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmDelete(true);
                      setMenuOpen(false);
                    }}
                    className="text-destructive hover:bg-destructive/5 flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-xs font-medium transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Body */}
      {editing ? (
        <div className="animate-slide-down px-4 py-2">
          <textarea
            value={editBody}
            onChange={(e) => setEditBody(e.target.value)}
            className="border-border/60 text-foreground focus:border-ring/30 focus:ring-ring/10 w-full resize-none rounded-xl border bg-white/80 p-3 text-sm leading-relaxed backdrop-blur-sm transition-all duration-200 outline-none focus:ring-2"
            rows={3}
            maxLength={1000}
            autoFocus
          />
          <div className="mt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-muted-foreground hover:bg-muted flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 active:scale-95"
            >
              <X className="h-3.5 w-3.5" />
              Cancel
            </button>
            <button
              type="button"
              onClick={handleEdit}
              disabled={isUpdating || !editBody.trim()}
              className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 active:scale-95 disabled:opacity-50"
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
        post.body && (
          <p className="text-foreground/85 px-4 py-2 text-sm leading-relaxed">{post.body}</p>
        )
      )}

      {/* Image grid */}
      {imageGrid && <div className="px-2 pb-0">{imageGrid}</div>}

      {/* Linked grievance section */}
      {isDirectSolve && post.linkedGrievanceTitle && (
        <div className="border-primary/10 bg-primary/[0.03] hover:bg-primary/[0.06] mx-3 mt-2 flex items-center gap-2 rounded-xl border px-3 py-2 transition-all duration-200">
          {post.linkedGrievanceImage ? (
            <img
              src={post.linkedGrievanceImage}
              alt=""
              className="ring-primary/10 h-9 w-9 shrink-0 rounded-lg object-cover ring-1"
            />
          ) : (
            <div className="bg-primary/5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
              <Link2 className="text-primary/40 h-4 w-4" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <Link2 className="text-primary/40 h-3 w-3 shrink-0" />
              <span className="text-foreground/80 truncate text-[11px] font-medium">
                {post.linkedGrievanceTitle}
              </span>
            </div>
          </div>
          {post.linkedGrievanceLat != null && post.linkedGrievanceLng != null && (
            <button
              type="button"
              onClick={() => navigate(`/map?grievance=${post.linkedGrievanceId}`)}
              className="bg-primary/10 text-primary hover:bg-primary/20 flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-medium transition-all duration-200 active:scale-95"
            >
              <MapPin className="h-3 w-3" />
              Map
            </button>
          )}
        </div>
      )}

      {/* Action bar: Like / Comment / Share */}
      <div className="border-border/30 mx-3 my-2 flex items-center rounded-xl border bg-white/40 px-1 py-0.5 backdrop-blur-sm">
        <button
          onClick={handleUpvote}
          disabled={isUpvoting}
          className={`group/btn relative flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-all duration-200 active:scale-95 ${
            post.isUpvoted ? 'text-destructive' : 'text-muted-foreground hover:text-foreground'
          } ${isUpvoting ? 'opacity-50' : ''}`}
        >
          <Heart
            className={`h-[18px] w-[18px] transition-all duration-300 ${
              post.isUpvoted ? 'fill-destructive' : ''
            } ${heartAnim ? 'animate-heart-beat' : ''}`}
            strokeWidth={post.isUpvoted ? 0 : 1.5}
          />
          <span className="font-medium">{post.upvoteCount}</span>
        </button>

        <div className="bg-border/30 h-6 w-px" />

        <button
          onClick={() => setCommentsOpen(!commentsOpen)}
          className={`group/btn relative flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-all duration-200 active:scale-95 ${
            commentsOpen
              ? 'text-primary bg-primary/5'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <MessageCircle
            className="h-[18px] w-[18px] transition-transform duration-200 group-hover/btn:scale-110"
            strokeWidth={1.5}
          />
          <span className="font-medium">{post.commentCount}</span>
        </button>

        <div className="bg-border/30 h-6 w-px" />

        <button
          onClick={handleShare}
          className="group/btn text-muted-foreground hover:text-foreground relative flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-all duration-200 active:scale-95"
        >
          <Share2
            className="h-[18px] w-[18px] transition-transform duration-200 group-hover/btn:scale-110"
            strokeWidth={1.5}
          />
          <span className="hidden font-medium sm:inline">Share</span>
        </button>
      </div>

      {/* Comment section */}
      <div className="animate-slide-down">
        <DiamondCommentSection diamondId={post.id} open={commentsOpen} />
      </div>

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="border-destructive/20 bg-destructive/5 animate-slide-down border-t px-4 py-2.5 backdrop-blur-sm">
          <p className="text-destructive mb-2 text-xs font-medium">Delete this post?</p>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="text-muted-foreground hover:bg-muted rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 active:scale-95"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 active:scale-95 disabled:opacity-50"
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
    </div>
  );
};
