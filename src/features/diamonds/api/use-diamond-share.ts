import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { diamondKeys } from './use-create-diamond';

export const useDiamondShare = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (diamondId: number) => {
      const { data, error } = await supabase.rpc('toggle_diamond_share', {
        p_diamond_id: diamondId,
      });
      if (error) throw error;
      if (!data?.length) throw new Error('No data from toggle_diamond_share');
      return data[0] as { new_share_count: number; is_shared: boolean };
    },
    onMutate: async (diamondId) => {
      const queryKey = [...diamondKeys.lists()];
      await queryClient.cancelQueries({ queryKey: [queryKey[0], queryKey[1]] });

      const prev = queryClient.getQueriesData<{
        items: Array<{ id: number; shareCount: number; isShared: boolean }>;
        count: number;
      }>({ queryKey: [queryKey[0], queryKey[1]] });

      queryClient.setQueriesData<{
        items: Array<{ id: number; shareCount: number; isShared: boolean }>;
        count: number;
      }>({ queryKey: [queryKey[0], queryKey[1]] }, (old) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.map((item) =>
            item.id === diamondId
              ? {
                  ...item,
                  isShared: !item.isShared,
                  shareCount: item.shareCount + (item.isShared ? -1 : 1),
                }
              : item,
          ),
        };
      });

      return { prev };
    },
    onError: (_error, _vars, ctx) => {
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
