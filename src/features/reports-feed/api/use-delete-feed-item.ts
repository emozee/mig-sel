import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useCurrentUser } from '@/features/auth/api/use-current-user';
import { communityKeys } from './use-reports-feed';
import type { ActivityItem } from '../types';

interface FeedData {
  items: ActivityItem[];
  count: number;
}

export const useDeleteFeedItem = () => {
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();
  const feedPrefix = communityKeys.feedList(user?.id);

  return useMutation({
    mutationFn: async (feedId: number) => {
      const { error } = await supabase.from('community_feed').delete().eq('id', feedId);
      if (error) throw error;
    },
    onMutate: async (feedId) => {
      await queryClient.cancelQueries({ queryKey: feedPrefix });
      const prev = queryClient.getQueriesData<FeedData>({ queryKey: feedPrefix });
      queryClient.setQueriesData<FeedData>({ queryKey: feedPrefix }, (old) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.filter((item) => item.id !== feedId),
        };
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      toast.error('Failed to delete feed item.');
      if (ctx?.prev) {
        for (const [key, data] of ctx.prev) {
          queryClient.setQueryData(key, data);
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: feedPrefix });
    },
  });
};
