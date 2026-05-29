import { useState } from 'react';
import { useCommunityFeed } from '../api/use-community-feed';
import { FeedItem } from './feed-item';
import { Pagination } from '@/components/ui/pagination';
import { AlertTriangle } from 'lucide-react';

const ITEMS_PER_PAGE = 5;

export const ActivityFeed = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const { data, isLoading, isError, error } = useCommunityFeed(currentPage, ITEMS_PER_PAGE);

  const items = data?.items ?? [];
  const totalItems = data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-[440px] animate-pulse rounded-xl bg-white p-3 shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
          >
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-full bg-gray-200" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-28 rounded bg-gray-200" />
                <div className="h-2.5 w-16 rounded bg-gray-200" />
              </div>
            </div>
            <div className="mt-3 space-y-1.5">
              <div className="h-2.5 w-full rounded bg-gray-200" />
              <div className="h-2.5 w-3/4 rounded bg-gray-200" />
            </div>
            <div className="mt-3 h-48 w-full rounded-lg bg-gray-200" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-5 text-center">
        <AlertTriangle className="h-5 w-5 text-red-400" />
        <p className="text-sm font-medium text-red-700">Failed to load feed</p>
        <p className="text-xs text-red-500">{error?.message}</p>
      </div>
    );
  }

  if (totalItems === 0) {
    return (
      <div className="rounded-xl bg-white p-6 text-center shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <p className="text-sm text-gray-500">No activity yet. Be the first!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <FeedItem key={item.id} item={item} />
      ))}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};
