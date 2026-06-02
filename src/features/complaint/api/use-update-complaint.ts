import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Complaint } from '@/features/complaint/types';
import { complaintKeys } from './use-complaints';
import { communityKeys } from '@/features/reports-feed/api/use-reports-feed';
import { grievanceKeys } from '@/features/auth/grievance/api/use-grievances';
import { leaderboardKeys } from '@/features/gamification/api/use-leaderboard';
import { profileKeys } from '@/features/gamification/api/use-user-profile';
import { awardPointsForStatus } from '@/features/complaint/utils/award-points';

export const useUpdateComplaint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<Complaint> & { id: string }) => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error('You must be signed in to update a complaint');
      }

      const { id, ...fields } = updates;

      const { data: current } = await supabase
        .from('grievances')
        .select('status, reporter_id')
        .eq('id', id)
        .single();

      if (fields.status && fields.status !== current?.status) {
        if (fields.status === 'resolved') {
          fields.resolved_at = new Date().toISOString();
        }
      }

      const { data, error } = await supabase
        .from('grievances')
        .update(fields)
        .eq('id', id)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error(
          'No matching grievance found to update. This is likely due to database ' +
            'Row-Level Security (RLS) — the grievances table needs an UPDATE policy ' +
            'that allows the current user to modify records. ' +
            'Run the RLS migration in supabase/migrations/ to fix this.',
        );
      }

      if (fields.status && current && fields.status !== current.status) {
        await awardPointsForStatus(current.reporter_id, id, current.status, fields.status);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: complaintKeys.all });
      await queryClient.invalidateQueries({ queryKey: communityKeys.all });
      await queryClient.invalidateQueries({ queryKey: grievanceKeys.all });
      await queryClient.invalidateQueries({ queryKey: leaderboardKeys.all() });
      await queryClient.invalidateQueries({ queryKey: profileKeys.current() });
    },
  });
};
