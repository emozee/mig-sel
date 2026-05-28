import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/features/auth/api/use-current-user';
import { communityKeys } from './use-community-feed';
import type { ActivityItem } from '../types';

export const useDeleteFeedItem = () => {
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();
  const feedQueryKey = communityKeys.feed(user?.id);

  return useMutation({
    mutationFn: async (feedId: number) => {
      const { error } = await supabase.from('grievances').delete().eq('id', feedId);
      if (error) throw error;
    },
    onMutate: async (feedId) => {
      await queryClient.cancelQueries({ queryKey: feedQueryKey });
      const prev = queryClient.getQueryData<ActivityItem[]>(feedQueryKey);
      queryClient.setQueryData<ActivityItem[]>(feedQueryKey, (old) =>
        old?.filter((item) => item.id !== feedId),
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(feedQueryKey, ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: feedQueryKey });
    },
  });
};
