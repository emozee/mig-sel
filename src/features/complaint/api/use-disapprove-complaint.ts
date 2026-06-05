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
      console.log('useDisapproveComplaint called with id:', id);
      window.alert('Mutation running for: ' + id);

      const { error: delErr } = await supabase
        .from('grievances')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      console.log('Update error:', delErr);
      window.alert('Update done: ' + (delErr ? delErr.message : 'OK'));

      if (delErr) throw new Error(`Soft-delete failed: ${delErr.message}`);

      const { error: feedErr } = await supabase
        .from('community_feed')
        .delete()
        .eq('grievance_id', id);
      console.log('Feed delete result:', feedErr);
      window.alert('Feed delete done: ' + (feedErr ? feedErr.message : 'OK'));
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
