import { useState } from 'react';
import { AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDiamonds } from '../api/use-diamonds';
import { DiamondPost } from './diamond-post';

const PAGE_SIZE = 5;

export const DiamondFeed = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const { data, isLoading, isError, error } = useDiamonds(currentPage, PAGE_SIZE);

  const posts = data?.items ?? [];
  const totalCount = data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="shadow-card animate-pulse rounded-2xl border border-white/30 bg-white/60 p-4 backdrop-blur-xl"
          >
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-full bg-gray-200/60" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-28 rounded bg-gray-200/60" />
                <div className="h-2.5 w-16 rounded bg-gray-200/60" />
              </div>
            </div>
            <div className="mt-3 space-y-1.5">
              <div className="h-2.5 w-full rounded bg-gray-200/60" />
              <div className="h-2.5 w-3/4 rounded bg-gray-200/60" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-red-200/60 bg-red-50/80 p-5 text-center backdrop-blur-sm">
        <AlertTriangle className="h-5 w-5 text-red-400" />
        <p className="text-sm font-medium text-red-700">Failed to load posts</p>
        <p className="text-xs text-red-500">{error?.message}</p>
      </div>
    );
  }

  if (totalCount === 0) {
    return (
      <div className="shadow-card rounded-2xl border border-white/30 bg-white/60 p-8 text-center backdrop-blur-xl">
        <p className="text-sm text-gray-500">No diamonds yet. Share your first facet!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post, i) => (
        <DiamondPost key={post.id} post={post} index={i} />
      ))}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="shadow-card flex items-center justify-between rounded-2xl border border-white/30 bg-white/60 px-4 py-3 backdrop-blur-xl">
          <span className="text-[11px] text-gray-500">
            Page {currentPage} of {totalPages} ({totalCount} posts)
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-white/80 hover:text-gray-800 disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .map((p, idx, arr) => (
                <span key={p} className="flex items-center">
                  {idx > 0 && arr[idx - 1] !== p - 1 ? (
                    <span className="px-1 text-[11px] text-gray-400">...</span>
                  ) : null}
                  <button
                    onClick={() => setCurrentPage(p)}
                    className={cn(
                      'flex h-8 min-w-[32px] items-center justify-center rounded-lg px-2 text-xs font-medium transition-all',
                      p === currentPage
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-gray-600 hover:bg-white/80 hover:text-gray-900',
                    )}
                  >
                    {p}
                  </button>
                </span>
              ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-white/80 hover:text-gray-800 disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
