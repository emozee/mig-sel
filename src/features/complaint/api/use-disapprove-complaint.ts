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
      const { error: delErr } = await supabase
        .from('grievances')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (delErr) throw new Error(`Soft-delete failed: ${delErr.message}`);

      await supabase.from('community_feed').delete().eq('grievance_id', id);
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
      console.error('Disapprove failed:', err);
      toast.error(`Delete failed: ${err instanceof Error ? err.message : String(err)}`);
      if (context?.previous) {
        queryClient.setQueryData(complaintKeys.all, context.previous);
      }
    },
    onSuccess: () => {
      toast.success('Report deleted');
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
