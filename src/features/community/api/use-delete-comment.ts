import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { commentKeys } from './use-feed-comments';
import { communityKeys } from './use-community-feed';
import { useCurrentUser } from '@/features/auth/api/use-current-user';
import type { ActivityItem } from '../types';

export const useDeleteComment = () => {
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();
  const feedQueryKey = communityKeys.feed(user?.id);

  return useMutation({
    mutationFn: async ({ commentId, feedId }: { commentId: string; feedId: number }) => {
      const { error } = await supabase.from('community_feed_comments').delete().eq('id', commentId);
      if (error) throw error;
      return { feedId };
    },
    onMutate: async ({ feedId }) => {
      await queryClient.cancelQueries({ queryKey: feedQueryKey });
      const prev = queryClient.getQueryData<ActivityItem[]>(feedQueryKey);
      queryClient.setQueryData<ActivityItem[]>(feedQueryKey, (old) =>
        old?.map((item) =>
          item.id === feedId ? { ...item, commentCount: Math.max(0, item.commentCount - 1) } : item,
        ),
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(feedQueryKey, ctx.prev);
    },
    onSettled: (_data, _err, vars) => {
      queryClient.invalidateQueries({ queryKey: commentKeys.byFeed(vars.feedId) });
      queryClient.invalidateQueries({ queryKey: feedQueryKey });
    },
  });
};
