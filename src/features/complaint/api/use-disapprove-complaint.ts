import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { complaintKeys } from './use-complaints';
import { communityKeys } from '@/features/community/api/use-community-feed';
import { grievanceKeys } from '@/features/auth/grievance/api/use-grievances';
import { leaderboardKeys } from '@/features/gamification/api/use-leaderboard';
import { profileKeys } from '@/features/gamification/api/use-user-profile';
import type { Complaint } from '@/features/complaint/types';

export const useDisapproveComplaint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: grievance } = await supabase
        .from('grievances')
        .select('reporter_id, bonus_awarded')
        .eq('id', id)
        .single();

      if (!grievance) throw new Error('Grievance not found');

      if (grievance.bonus_awarded > 0 && grievance.reporter_id) {
        const { error: pointsError } = await supabase.rpc('adjust_points', {
          p_reporter_id: grievance.reporter_id,
          p_grievance_id: id,
          p_delta: -grievance.bonus_awarded,
          p_new_value: 0,
        });
        if (pointsError) throw pointsError;
      }

      const { error } = await supabase.from('grievances').delete().eq('id', id);

      if (error) throw error;
    },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: complaintKeys.all });
      const previous = queryClient.getQueryData<Complaint[]>(complaintKeys.all);
      queryClient.setQueryData<Complaint[]>(complaintKeys.all, (old) =>
        (old ?? []).filter((c) => c.id !== id),
      );
      return { previous };
    },
    onError: (_, __, context) => {
      if (context?.previous) {
        queryClient.setQueryData(complaintKeys.all, context.previous);
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: complaintKeys.all });
      await queryClient.invalidateQueries({ queryKey: communityKeys.all });
      await queryClient.invalidateQueries({ queryKey: grievanceKeys.all });
      await queryClient.invalidateQueries({ queryKey: leaderboardKeys.all() });
      await queryClient.invalidateQueries({ queryKey: profileKeys.current() });
    },
  });
};
