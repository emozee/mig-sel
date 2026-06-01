import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { commentKeys } from './use-feed-comments';

export const useEditComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      commentId,
      feedId,
      body,
    }: {
      commentId: string;
      feedId: number;
      body: string;
    }) => {
      const { error } = await supabase
        .from('community_feed_comments')
        .update({ body })
        .eq('id', commentId);
      if (error) throw error;
      return { feedId };
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: commentKeys.byFeed(variables.feedId) });
    },
  });
};
