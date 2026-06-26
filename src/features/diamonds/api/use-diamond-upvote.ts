import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { diamondKeys } from './use-create-diamond';

export const useDiamondUpvote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (diamondId: number) => {
      const { data, error } = await supabase.rpc('toggle_diamond_upvote', {
        p_diamond_id: diamondId,
      });
      if (error) throw error;
      if (!data?.length) throw new Error('No data from toggle_diamond_upvote');
      return data[0] as { new_upvote_count: number; is_upvoted: boolean };
    },
    onMutate: async (diamondId) => {
      const queryKey = diamondKeys.lists();
      await queryClient.cancelQueries({ queryKey });

      const prev = queryClient.getQueriesData<{
        items: Array<{ id: number; upvoteCount: number; isUpvoted: boolean }>;
        count: number;
      }>({ queryKey });

      queryClient.setQueriesData<{
        items: Array<{ id: number; upvoteCount: number; isUpvoted: boolean }>;
        count: number;
      }>({ queryKey }, (old) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.map((item) =>
            item.id === diamondId
              ? {
                  ...item,
                  isUpvoted: !item.isUpvoted,
                  upvoteCount: item.upvoteCount + (item.isUpvoted ? -1 : 1),
                }
              : item,
          ),
        };
      });

      return { prev };
    },
    onError: (_error, _vars, ctx) => {
      toast.error('Failed to toggle upvote.');
      if (ctx?.prev) {
        for (const [key, data] of ctx.prev) {
          queryClient.setQueryData(key, data);
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: diamondKeys.lists() });
    },
  });
};
