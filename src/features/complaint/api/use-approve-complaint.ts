import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { complaintKeys } from './use-complaints';
import { communityKeys } from '@/features/reports-feed/api/use-reports-feed';
import { grievanceKeys } from '@/features/auth/grievance/api/use-grievances';
import { leaderboardKeys } from '@/features/gamification/api/use-leaderboard';
import { profileKeys } from '@/features/gamification/api/use-user-profile';
import { awardPointsForSubmission } from '@/features/complaint/utils/award-points';
import type { Complaint } from '@/features/complaint/types';

export const useApproveComplaint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: grievance, error: fetchError } = await supabase
        .from('grievances')
        .select('reporter_id')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;
      if (!grievance) throw new Error('Grievance not found');

      const { data: updated, error: updateError } = await supabase
        .from('grievances')
        .update({ approved: true })
        .eq('id', id)
        .select('approved');

      if (updateError) throw updateError;
      if (!updated || updated.length === 0) {
        throw new Error('Approve update did not match any rows');
      }

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
    onError: (error, _, context) => {
      console.error('Approve grievance failed:', error);
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
      await queryClient.invalidateQueries({ queryKey: ['my-reports'] });
    },
  });
};
