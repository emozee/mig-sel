import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Heart,
  MessageCircle,
  Share2,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Maximize2,
} from 'lucide-react';
import { useCurrentUser } from '@/features/auth/api/use-current-user';
import { useDiamondUpvote } from '../api/use-diamond-upvote';
import { useDiamondShare } from '../api/use-diamond-share';
import { DiamondCommentSection } from './diamond-comment-section';
import type { DiamondFeedItem } from '../types';

interface DiamondPhotoGalleryProps {
  images: string[];
  post: DiamondFeedItem;
}

export const DiamondPhotoGallery = ({ images, post }: DiamondPhotoGalleryProps) => {
  const { user } = useCurrentUser();
  const { mutate: toggleUpvote, isPending: isUpvoting } = useDiamondUpvote();
  const { mutate: toggleShare, isPending: isSharing } = useDiamondShare();

  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [heartAnim, setHeartAnim] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const clickLock = useRef(false);
  const viewerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const isSingle = images.length === 1;

  const handleOpen = useCallback((clickIndex: number) => {
    setCurrentIndex(clickIndex);
    setViewerOpen(true);
  }, []);

  const handlePrev = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
      setCommentsOpen(false);
    },
    [images.length],
  );

  const handleNext = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
      setCommentsOpen(false);
    },
    [images.length],
  );

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      viewerRef.current?.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

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

  const closeViewer = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    setViewerOpen(false);
    setCommentsOpen(false);
  }, []);

  useEffect(() => {
    if (!viewerOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeViewer();
      }
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('keydown', handleKey);
    };
  }, [viewerOpen, closeViewer, handlePrev, handleNext]);

  const currentImage = images[currentIndex];

  return (
    <>
      {/* Image grid */}
      {images.length === 0 ? null : images.length === 1 ? (
        <img
          src={images[0]}
          alt=""
          loading="lazy"
          className="max-h-96 w-full cursor-pointer rounded-lg object-cover"
          onClick={() => handleOpen(0)}
        />
      ) : images.length === 2 ? (
        <div className="grid grid-cols-2 gap-1">
          {images.map((url, i) => (
            <img
              key={i}
              src={url}
              alt=""
              loading="lazy"
              className="aspect-square w-full cursor-pointer rounded-lg object-cover"
              onClick={() => handleOpen(i)}
            />
          ))}
        </div>
      ) : images.length === 3 ? (
        <div className="grid grid-cols-2 gap-1">
          <img
            src={images[0]}
            alt=""
            loading="lazy"
            className="row-span-2 h-full w-full cursor-pointer rounded-l-lg object-cover"
            onClick={() => handleOpen(0)}
          />
          <img
            src={images[1]}
            alt=""
            loading="lazy"
            className="aspect-square w-full cursor-pointer rounded-tr-lg object-cover"
            onClick={() => handleOpen(1)}
          />
          <img
            src={images[2]}
            alt=""
            loading="lazy"
            className="aspect-square w-full cursor-pointer rounded-br-lg object-cover"
            onClick={() => handleOpen(2)}
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-1">
          {images.slice(0, 4).map((url, i) => (
            <div key={i} className="group relative overflow-hidden">
              <img
                src={url}
                alt=""
                loading="lazy"
                className="aspect-square w-full cursor-pointer rounded-lg object-cover transition-transform duration-500 group-hover:scale-105"
                onClick={() => handleOpen(i)}
              />
              {i === 3 && images.length > 4 && (
                <div
                  className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-lg bg-black/60 text-lg font-bold text-white backdrop-blur-[2px]"
                  onClick={() => handleOpen(3)}
                >
                  +{images.length - 4}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Full screen viewer */}
      {viewerOpen && currentImage && (
        <div
          ref={viewerRef}
          className="fixed inset-0 z-[9999] flex flex-col bg-black"
          onClick={closeViewer}
        >
          {/* Top bar */}
          <div className="relative z-10 flex items-center justify-between px-4 py-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeViewer();
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-white/30"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-1.5">
              {!isSingle && (
                <span className="rounded bg-white/10 px-2 py-0.5 text-[11px] font-medium text-white/80">
                  {currentIndex + 1} / {images.length}
                </span>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFullscreen();
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-white/30"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Image area */}
          <div
            className="relative flex flex-1 items-center justify-center"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => {
              touchStartX.current = e.touches[0].clientX;
              touchStartY.current = e.touches[0].clientY;
            }}
            onTouchMove={(e) => {
              if (!touchStartX.current) return;
              const dx = e.touches[0].clientX - touchStartX.current;
              const dy = e.touches[0].clientY - touchStartY.current;
              if (Math.abs(dx) > Math.abs(dy)) {
                e.preventDefault();
              }
            }}
            onTouchEnd={(e) => {
              if (!touchStartX.current) return;
              const dx = e.changedTouches[0].clientX - touchStartX.current;
              if (Math.abs(dx) > 50) {
                if (dx > 0) handlePrev();
                else handleNext();
              }
              touchStartX.current = 0;
              touchStartY.current = 0;
            }}
          >
            {!isSingle && (
              <>
                <button
                  onClick={handlePrev}
                  className="absolute left-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-white/30"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-white/30"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
            <img
              src={currentImage}
              alt=""
              loading="lazy"
              className="max-h-[70vh] max-w-[95vw] cursor-zoom-in rounded-lg object-contain transition-transform"
              onClick={(e) => {
                e.stopPropagation();
                toggleFullscreen();
              }}
            />
          </div>

          {/* Action bar */}
          <div className="px-4 pt-1" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center border-t border-white/20 py-2">
              <button
                onClick={handleUpvote}
                disabled={isUpvoting}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded py-2 text-xs font-semibold transition-colors ${
                  post.isUpvoted ? 'text-red-400' : 'text-white/70 hover:text-white'
                } ${isUpvoting ? 'opacity-50' : ''}`}
              >
                <Heart
                  className={`h-[18px] w-[18px] transition-all duration-300 ${
                    post.isUpvoted ? 'fill-red-400' : ''
                  } ${heartAnim ? 'animate-heart-beat' : ''}`}
                  strokeWidth={post.isUpvoted ? 0 : 1.5}
                />
                <span>Like{post.upvoteCount > 0 ? ` (${post.upvoteCount})` : ''}</span>
              </button>

              <button
                onClick={() => setCommentsOpen(!commentsOpen)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded py-2 text-xs font-semibold transition-colors ${
                  commentsOpen ? 'text-blue-400' : 'text-white/70 hover:text-white'
                }`}
              >
                <MessageCircle className="h-[18px] w-[18px]" strokeWidth={1.5} />
                <span>Comment{post.commentCount > 0 ? ` (${post.commentCount})` : ''}</span>
              </button>

              <button
                onClick={handleShare}
                disabled={isSharing}
                className="flex flex-1 items-center justify-center gap-1.5 rounded py-2 text-xs font-semibold text-white/70 transition-colors hover:text-white disabled:opacity-50"
              >
                {isSharing ? (
                  <Loader2 className="h-[18px] w-[18px] animate-spin" />
                ) : (
                  <Share2 className="h-[18px] w-[18px]" strokeWidth={1.5} />
                )}
                <span>Share{post.shareCount > 0 ? ` (${post.shareCount})` : ''}</span>
              </button>
            </div>

            {/* Inline comments */}
            {commentsOpen && (
              <div className="mb-2 max-h-32 overflow-y-auto rounded-lg bg-white/10">
                <DiamondCommentSection diamondId={post.id} open={true} />
              </div>
            )}

            {/* Thumbnail strip — always visible for multi-photo */}
            {!isSingle && (
              <div className="flex items-center justify-center gap-1.5 pb-3">
                {images.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setCurrentIndex(i);
                      setCommentsOpen(false);
                    }}
                    className={`shrink-0 overflow-hidden rounded-md transition-all ${
                      i === currentIndex
                        ? 'h-10 w-10 ring-2 ring-white'
                        : 'h-8 w-8 opacity-50 hover:opacity-100'
                    }`}
                  >
                    <img src={url} alt="" loading="lazy" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
