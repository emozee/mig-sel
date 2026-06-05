import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { complaintKeys } from './use-complaints';
import { communityKeys } from '@/features/reports-feed/api/use-reports-feed';
import { grievanceKeys } from '@/features/auth/grievance/api/use-grievances';
import { leaderboardKeys } from '@/features/gamification/api/use-leaderboard';
import { profileKeys } from '@/features/gamification/api/use-user-profile';
import type { Complaint } from '@/features/complaint/types';

export const useDisapproveComplaint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // 1. Try to call the atomic function first
      const { error: rpcError } = await supabase.rpc('disapprove_grievance', {
        grievance_id: id,
      });

      if (!rpcError) return;

      console.error('disapprove_grievance RPC failed, falling back to direct update:', rpcError);

      // 2. Fallback: do it manually
      const { data: grievance } = await supabase
        .from('grievances')
        .select('reporter_id, bonus_awarded')
        .eq('id', id)
        .single();

      if (!grievance) throw new Error('Grievance not found');

      // Best-effort point deduction
      if (grievance.bonus_awarded > 0 && grievance.reporter_id) {
        const { error: adjustErr } = await supabase.rpc('adjust_points', {
          p_reporter_id: grievance.reporter_id,
          p_grievance_id: id,
          p_delta: -grievance.bonus_awarded,
          p_new_value: 0,
        });
        if (adjustErr) {
          console.error('adjust_points RPC failed:', adjustErr);
          const { data: profile } = await supabase
            .from('profiles')
            .select('points')
            .eq('id', grievance.reporter_id)
            .maybeSingle();
          if (profile) {
            await supabase
              .from('profiles')
              .update({ points: Math.max(0, (profile.points ?? 0) - grievance.bonus_awarded) })
              .eq('id', grievance.reporter_id);
          }
        }
      }

      // Soft-delete
      const { error: delErr } = await supabase
        .from('grievances')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      if (delErr) throw delErr;

      // Remove feed entry
      const { error: feedErr } = await supabase
        .from('community_feed')
        .delete()
        .eq('grievance_id', id);
      if (feedErr) console.error('Feed delete failed:', feedErr);
    },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: complaintKeys.all });
      const previous = queryClient.getQueryData<Complaint[]>(complaintKeys.all);
      queryClient.setQueryData<Complaint[]>(complaintKeys.all, (old) =>
        (old ?? []).filter((c) => c.id !== id),
      );
      return { previous };
    },
    onError: (err, _id, context) => {
      console.error('Disapprove mutation failed:', err);
      toast.error(`Delete failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
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
