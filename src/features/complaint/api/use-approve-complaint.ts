import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { complaintKeys } from './use-complaints';
import { communityKeys } from '@/features/community/api/use-community-feed';
import { grievanceKeys } from '@/features/auth/grievance/api/use-grievances';
import { leaderboardKeys } from '@/features/gamification/api/use-leaderboard';
import { profileKeys } from '@/features/gamification/api/use-user-profile';
import { awardPointsForSubmission } from '@/features/complaint/utils/award-points';
import type { Complaint } from '@/features/complaint/types';

export const useApproveComplaint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: grievance } = await supabase
        .from('grievances')
        .select('reporter_id')
        .eq('id', id)
        .single();

      if (!grievance) throw new Error('Grievance not found');

      const { error } = await supabase.from('grievances').update({ approved: true }).eq('id', id);

      if (error) throw error;

      await awardPointsForSubmission(grievance.reporter_id, id);
    },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: complaintKeys.all });
      const previous = queryClient.getQueryData<Complaint[]>(complaintKeys.all);
      queryClient.setQueryData<Complaint[]>(complaintKeys.all, (old) =>
        (old ?? []).map((c) => (c.id === id ? { ...c, approved: true } : c)),
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
