import { useRef, useState, useEffect } from 'react';
import {
  Heart,
  MoreHorizontal,
  Edit3,
  Trash2,
  MapPin,
  X,
  MessageCircle,
  Send,
  Image,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { useCurrentUser } from '@/features/auth/api/use-current-user';
import { useToggleUpvote } from '../api/use-toggle-upvote';
import { useDeleteFeedItem } from '../api/use-delete-feed-item';
import { useFeedComments, useCreateComment } from '../api/use-feed-comments';
import { useEditComment } from '../api/use-edit-comment';
import { useDeleteComment } from '../api/use-delete-comment';
import { useIsAdmin } from '@/features/auth/api/use-is-admin';
import { CommentSection } from './comment-section';
import { DialogRoot, DialogContent, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ClickableImage } from '@/components/ui/image-viewer';
import type { ActivityItem, FeedStatus } from '../types';

const STATUS_BADGE: Record<FeedStatus, { bg: string; text: string; label: string }> = {
  pending: { bg: 'bg-orange-50', text: 'text-orange-500', label: 'Pending' },
  'in-progress': { bg: 'bg-blue-50', text: 'text-blue-500', label: 'In Progress' },
  resolved: { bg: 'bg-green-50', text: 'text-green-500', label: 'Resolved' },
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
  const [expanded, setExpanded] = useState(false);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isOwner = user?.id === item.userId;

  const handleDelete = () => {
    if (!confirm('Delete this post?')) return;
    deleteFeedItem(item.id);
    setMenuOpen(false);
  };

  const handleFindOnMap = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setMenuOpen(false);
    if (item.latitude && item.longitude) {
      navigate(`/map?lat=${item.latitude}&lng=${item.longitude}`);
    } else if (item.location) {
      navigate(`/map?search=${encodeURIComponent(item.location)}`);
    } else {
      navigate('/map');
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
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

  const cardContent = (fullView: boolean) => (
    <>
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
            <div className="relative" ref={menuRef} onClick={(e) => e.stopPropagation()}>
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
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete();
                        }}
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

      <p className={`px-3 text-sm leading-relaxed text-gray-700 ${fullView ? '' : 'line-clamp-2'}`}>
        {item.action}
      </p>

      {item.image_url && (
        <div className={fullView ? '' : 'flex-1 overflow-hidden'}>
          <img
            src={item.image_url}
            alt=""
            className={`w-full ${fullView ? '' : 'h-full object-cover'}`}
          />
        </div>
      )}

      {!fullView && !item.image_url && <div className="flex-1" />}

      <div className="flex items-center gap-4 px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
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

        <div onClick={(e) => e.stopPropagation()}>
          <CommentSection item={item} />
        </div>
      </div>
    </>
  );

  const { data: isAdmin } = useIsAdmin();
  const { data: comments, isLoading: commentsLoading } = useFeedComments(item.id);
  const { mutate: createComment, isPending: createPending } = useCreateComment();
  const { mutate: editComment, isPending: editPending } = useEditComment();
  const { mutate: deleteComment } = useDeleteComment();
  const ivCommentInputRef = useRef<HTMLInputElement>(null);
  const ivFileInputRef = useRef<HTMLInputElement>(null);
  const [ivNewComment, setIvNewComment] = useState('');
  const [ivImageFile, setIvImageFile] = useState<File | null>(null);
  const [ivImagePreview, setIvImagePreview] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingBody, setEditingBody] = useState('');

  const handleIvSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ivNewComment.trim() || createPending) return;
    createComment(
      { feedId: item.id, body: ivNewComment.trim(), imageFile: ivImageFile },
      {
        onSuccess: () => {
          setIvNewComment('');
          setIvImageFile(null);
          setIvImagePreview(null);
        },
      },
    );
  };

  const handleIvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIvImageFile(file);
    setIvImagePreview(URL.createObjectURL(file));
  };

  return (
    <>
      {/* Fixed-height card in feed */}
      <div
        className="flex cursor-pointer flex-col overflow-hidden rounded-xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
        style={{ height: fullViewHeight }}
        onClick={() => {
          if (item.image_url) {
            setImageViewerOpen(true);
          } else {
            setExpanded(true);
          }
        }}
      >
        {cardContent(false)}
      </div>

      {/* Expanded dialog – for posts without images */}
      {!item.image_url && (
        <DialogRoot open={expanded} onOpenChange={setExpanded}>
          <DialogContent className="!inset-0 !top-0 !left-0 flex h-dvh w-full max-w-full !translate-x-0 !translate-y-0 !flex-col !rounded-none !border-0 !p-0 sm:max-w-full">
            <div className="mx-auto flex w-full max-w-lg flex-1 flex-col bg-white">
              <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
                <span className="text-sm font-semibold text-gray-900">Post</span>
                <DialogClose asChild>
                  <button className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600">
                    <X className="h-5 w-5" />
                  </button>
                </DialogClose>
              </div>
              <div className="flex-1 overflow-y-auto">{cardContent(true)}</div>
            </div>
          </DialogContent>
        </DialogRoot>
      )}

      {/* Image viewer – image + like + comments (Facebook-style) */}
      <DialogRoot open={imageViewerOpen} onOpenChange={setImageViewerOpen}>
        <DialogContent className="!inset-0 !top-0 !left-0 flex h-dvh w-full max-w-full !translate-x-0 !translate-y-0 !flex-col !rounded-none !border-0 !bg-emerald-950 !p-0 sm:max-w-full">
          {/* Close button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setImageViewerOpen(false);
            }}
            className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white/80 transition-colors hover:bg-white/30"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="mx-auto flex w-full max-w-lg flex-1 flex-col">
            {/* Image area */}
            <div className="flex min-h-0 flex-1 items-center justify-center bg-emerald-950 px-2">
              {item.image_url && (
                <img
                  src={item.image_url}
                  alt=""
                  className="max-h-full max-w-full rounded-lg object-contain"
                />
              )}
            </div>

            {/* Bottom sheet – stats + comments */}
            <div className="flex shrink-0 flex-col bg-white px-3 pt-2">
              {/* Action text */}
              <div className="flex items-start gap-2 pb-1">
                <span className="text-sm font-semibold text-gray-900">{item.userName}</span>
                <p className="text-sm text-gray-700">{item.action}</p>
              </div>

              {/* Like + comment count bar */}
              <div className="flex items-center gap-4 border-b border-gray-100 pb-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpvote(e);
                  }}
                  disabled={isPending}
                  className={`flex items-center gap-1 text-sm transition-colors ${
                    item.isUpvoted ? 'text-emerald-600' : 'text-gray-500'
                  } ${isPending ? 'opacity-50' : ''}`}
                >
                  <Heart
                    className="h-[18px] w-[18px]"
                    fill={item.isUpvoted ? 'currentColor' : 'none'}
                    strokeWidth={item.isUpvoted ? 0 : 1.5}
                  />
                  <span className="font-medium">{item.upvoteCount}</span>
                </button>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <MessageCircle className="h-[18px] w-[18px]" />
                  <span className="font-medium">{item.commentCount}</span>
                </div>
              </div>

              {/* Comments list */}
              <div className="max-h-48 space-y-2 overflow-y-auto py-2">
                {commentsLoading ? (
                  <p className="py-2 text-center text-xs text-gray-400">Loading comments...</p>
                ) : !comments || comments.length === 0 ? (
                  <p className="py-2 text-center text-xs text-gray-400">No comments yet.</p>
                ) : (
                  comments.map((comment) => {
                    const isCommentOwner = user?.id === comment.user_id;
                    const isEditing = editingCommentId === comment.id;
                    const wasEdited =
                      comment.updated_at && comment.updated_at !== comment.created_at;
                    return (
                      <div key={comment.id} className="flex items-start gap-2">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">
                          {comment.user_initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline gap-2">
                            <span className="text-xs font-semibold text-gray-900">
                              {comment.user_name}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {new Date(comment.created_at).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                            {wasEdited && (
                              <span className="text-[10px] text-gray-400 italic">Edited</span>
                            )}
                            <div className="ml-auto flex items-center gap-1">
                              {isAdmin && isCommentOwner && !isEditing && (
                                <>
                                  <button
                                    onClick={() => {
                                      setEditingCommentId(comment.id);
                                      setEditingBody(comment.body);
                                    }}
                                    className="text-gray-300 hover:text-gray-600"
                                  >
                                    <Edit3 className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm('Delete this comment?')) {
                                        deleteComment({ commentId: comment.id, feedId: item.id });
                                      }
                                    }}
                                    className="text-gray-300 hover:text-red-500"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                          {isEditing ? (
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                if (!editingBody.trim() || editPending) return;
                                editComment(
                                  {
                                    commentId: comment.id,
                                    feedId: item.id,
                                    body: editingBody.trim(),
                                  },
                                  {
                                    onSuccess: () => setEditingCommentId(null),
                                  },
                                );
                              }}
                              className="mt-1 flex items-center gap-1"
                            >
                              <Input
                                value={editingBody}
                                onChange={(e) => setEditingBody(e.target.value)}
                                maxLength={500}
                                className="h-7 flex-1 text-xs"
                                autoFocus
                              />
                              <Button
                                type="submit"
                                size="icon-xs"
                                disabled={!editingBody.trim() || editPending}
                              >
                                <Send className="h-3 w-3" />
                              </Button>
                              <button
                                type="button"
                                onClick={() => setEditingCommentId(null)}
                                className="text-[10px] text-gray-400 hover:text-gray-600"
                              >
                                Cancel
                              </button>
                            </form>
                          ) : (
                            <>
                              <p className="text-xs leading-relaxed text-gray-700">
                                {comment.body}
                              </p>
                              {comment.image_url && (
                                <ClickableImage
                                  src={comment.image_url}
                                  alt="Comment image"
                                  className="mt-1 max-h-32 rounded-lg object-cover"
                                />
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Comment input – admin only */}
              {user && isAdmin ? (
                <form
                  onSubmit={handleIvSubmit}
                  className="flex flex-col gap-2 border-t border-gray-100 py-2"
                >
                  {ivImagePreview && (
                    <div className="relative inline-flex">
                      <img
                        src={ivImagePreview}
                        alt=""
                        className="h-16 w-16 rounded-lg object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setIvImageFile(null);
                          setIvImagePreview(null);
                          if (ivFileInputRef.current) ivFileInputRef.current.value = '';
                        }}
                        className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gray-700/70 text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Input
                      ref={ivCommentInputRef}
                      placeholder="Write a comment..."
                      value={ivNewComment}
                      onChange={(e) => setIvNewComment(e.target.value)}
                      maxLength={500}
                      className="h-9 flex-1 text-sm"
                    />
                    <input
                      ref={ivFileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={handleIvFileChange}
                    />
                    <button
                      type="button"
                      onClick={() => ivFileInputRef.current?.click()}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                    >
                      <Image className="h-4 w-4" />
                    </button>
                    <Button
                      type="submit"
                      size="icon-xs"
                      disabled={!ivNewComment.trim() || createPending}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              ) : user ? (
                <p className="border-t border-gray-100 py-2 text-center text-[11px] text-gray-400">
                  Only admins can comment.
                </p>
              ) : null}
            </div>
          </div>
        </DialogContent>
      </DialogRoot>
    </>
  );
};

const fullViewHeight = 440;
