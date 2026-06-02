import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useAnnouncements } from '@/features/announcements/api/use-announcements';
import {
  Megaphone,
  AlertTriangle,
  Pin,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Linkify } from '@/components/ui/linkify';
import type { Announcement } from '@/features/announcements/types';

const isExpired = (a: Announcement) => a.expires_at && new Date(a.expires_at) < new Date();

export const AnnouncementsBanner = () => {
  const navigate = useNavigate();
  const { data: announcements, isLoading } = useAnnouncements();
  const [current, setCurrent] = useState(0);

  const pinnedItems = (announcements ?? []).filter((a) => a.is_pinned && !isExpired(a));
  const nonPinned = (announcements ?? []).filter((a) => !a.is_pinned && !isExpired(a));
  const total = nonPinned.length;

  const next = useCallback(() => {
    if (total > 0) setCurrent((p) => (p + 1) % total);
  }, [total]);

  const prev = useCallback(() => {
    if (total > 0) setCurrent((p) => (p - 1 + total) % total);
  }, [total]);

  useEffect(() => {
    if (total <= 1) return;
    const id = setInterval(next, 6000);
    return () => clearInterval(id);
  }, [total, next]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Pinned announcements - always visible */}
      {pinnedItems.length > 0 && (
        <div className="space-y-2">
          {pinnedItems.map((a) => (
            <div
              key={a.id}
              className="group border-primary/20 from-primary/[0.04] via-card to-primary/[0.02] relative overflow-hidden rounded-xl border bg-gradient-to-br shadow-sm transition-all hover:shadow-md"
            >
              <div className="bg-primary/5 absolute top-0 right-0 h-20 w-20 translate-x-6 -translate-y-6 rounded-full blur-2xl" />
              <div className="relative flex items-start gap-3 px-4 py-3.5">
                <div className="bg-primary/10 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-sm">
                  <Pin className="text-primary h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-[10px] font-bold">
                      Pinned
                    </span>
                    <p className="text-foreground truncate text-sm font-bold">{a.title}</p>
                  </div>
                  <Linkify className="text-muted-foreground mt-1 text-xs leading-relaxed">
                    {a.body}
                  </Linkify>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Carousel for non-pinned announcements */}
      {total > 0 && (
        <div className="relative overflow-hidden rounded-xl">
          {nonPinned.map((a, idx) => {
            const isImportant = a.type === 'important_notice';
            const isActive = idx === current;

            return (
              <div
                key={a.id}
                className={cn(
                  'transition-all duration-500',
                  isActive ? 'relative z-10 opacity-100' : 'absolute inset-0 -z-10 opacity-0',
                )}
              >
                <div
                  className={cn(
                    'relative overflow-hidden rounded-xl border shadow-sm',
                    isImportant
                      ? 'border-primary/20 from-primary/[0.06] via-card to-primary/[0.03] bg-gradient-to-br'
                      : 'border-border bg-card',
                  )}
                >
                  <div
                    className={cn(
                      'absolute top-0 right-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full blur-2xl',
                      isImportant ? 'bg-primary/5' : 'bg-muted',
                    )}
                  />
                  <div className="relative flex items-start gap-3 px-4 py-3.5">
                    <div
                      className={cn(
                        'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-sm',
                        isImportant ? 'bg-primary/10' : 'bg-muted',
                      )}
                    >
                      {isImportant ? (
                        <AlertTriangle className="text-primary h-4 w-4" />
                      ) : (
                        <Megaphone className="text-primary h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {isImportant && (
                          <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-[10px] font-bold">
                            Important
                          </span>
                        )}
                        <p className="text-foreground truncate text-sm font-bold">{a.title}</p>
                      </div>
                      <Linkify className="text-muted-foreground mt-1 text-xs leading-relaxed">
                        {a.body}
                      </Linkify>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {total > 1 && (
            <div className="mt-2 flex items-center justify-between px-1">
              <button
                onClick={prev}
                className="text-muted-foreground hover:bg-muted hover:text-foreground flex h-6 w-6 items-center justify-center rounded-full transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <div className="flex items-center gap-1.5">
                {nonPinned.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrent(idx)}
                    className={cn(
                      'h-1.5 rounded-full transition-all duration-300',
                      idx === current
                        ? 'bg-muted-foreground/40 w-5'
                        : 'bg-muted-foreground/20 w-1.5',
                    )}
                  />
                ))}
              </div>
              <button
                onClick={next}
                className="text-muted-foreground hover:bg-muted hover:text-foreground flex h-6 w-6 items-center justify-center rounded-full transition-colors"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {announcements && announcements.length > 0 && (
        <button
          onClick={() => navigate('/announcements')}
          className="text-muted-foreground hover:text-foreground mx-auto flex items-center gap-1 text-[11px] font-semibold transition-colors"
        >
          View all announcements
          <ArrowRight className="h-3 w-3" />
        </button>
      )}
    </div>
  );
};
