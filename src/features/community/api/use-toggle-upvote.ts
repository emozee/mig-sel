import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/features/auth/api/use-current-user';
import { communityKeys } from './use-community-feed';
import type { ActivityItem } from '../types';

interface ToggleUpvoteInput {
  feedId: number;
  isCurrentlyUpvoted: boolean;
}

interface FeedData {
  items: ActivityItem[];
  count: number;
}

export const useToggleUpvote = () => {
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();
  const feedPrefix = communityKeys.feed(user?.id).slice(0, 3);

  return useMutation({
    mutationFn: async ({ feedId }: ToggleUpvoteInput) => {
      const { data, error } = await supabase.rpc('toggle_feed_upvote', {
        p_feed_id: feedId,
      });
      if (error) {
        console.error('[toggle_feed_upvote] RPC error:', error);
        throw error;
      }
      if (!data?.length) throw new Error('No data returned from toggle_feed_upvote');
      return data[0] as { new_upvote_count: number; is_upvoted: boolean };
    },
    onMutate: async ({ feedId, isCurrentlyUpvoted }) => {
      await queryClient.cancelQueries({ queryKey: feedPrefix });

      const prev = queryClient.getQueriesData<FeedData>({ queryKey: feedPrefix });

      queryClient.setQueriesData<FeedData>({ queryKey: feedPrefix }, (old) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.map((item) =>
            item.id === feedId
              ? {
                  ...item,
                  isUpvoted: !isCurrentlyUpvoted,
                  upvoteCount: item.upvoteCount + (isCurrentlyUpvoted ? -1 : 1),
                }
              : item,
          ),
        };
      });

      return { prev };
    },
    onError: (error, _vars, ctx) => {
      console.error('Toggle upvote failed:', error);
      if (ctx?.prev) {
        for (const [key, data] of ctx.prev) {
          queryClient.setQueryData(key, data);
        }
      }
    },
  });
};
