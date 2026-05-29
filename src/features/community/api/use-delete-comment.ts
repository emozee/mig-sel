import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { commentKeys } from './use-feed-comments';
import { communityKeys } from './use-community-feed';

export const useDeleteComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, feedId }: { commentId: string; feedId: number }) => {
      const { error } = await supabase.from('community_feed_comments').delete().eq('id', commentId);
      if (error) throw error;
      return { feedId };
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: commentKeys.byFeed(vars.feedId) });
      queryClient.invalidateQueries({ queryKey: communityKeys.all });
    },
  });
};
