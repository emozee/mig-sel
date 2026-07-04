import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { complaintKeys } from './use-complaints';
import { communityKeys } from '@/features/reports-feed/api/use-reports-feed';
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

        if (pointsError) {
          // Fallback: directly deduct points from profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('points')
            .eq('id', grievance.reporter_id)
            .maybeSingle();

          if (profile) {
            const { error: directError } = await supabase
              .from('profiles')
              .update({ points: Math.max(0, (profile.points ?? 0) - grievance.bonus_awarded) })
              .eq('id', grievance.reporter_id);

            if (directError) throw directError;
          }
        }
      }

      const { error: feedError } = await supabase
        .from('community_feed')
        .delete()
        .eq('grievance_id', id);

      if (feedError) throw feedError;

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
      toast.error('Failed to disapprove complaint.');
      if (context?.previous) {
        queryClient.setQueryData(complaintKeys.all, context.previous);
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: complaintKeys.all });
      await queryClient.invalidateQueries({ queryKey: ['my-reports'] });
      await queryClient.invalidateQueries({ queryKey: communityKeys.all });
    },
  });
};
