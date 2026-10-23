import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { Complaint } from '@/features/complaint/types';
import { complaintKeys } from './use-complaints';
import { awardPointsForStatus } from '@/features/complaint/utils/award-points';
import { grievanceKeys } from '@/features/auth/grievance/api/use-grievances';

export const useUpdateComplaint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<Complaint> & { id: string }) => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error('You must be signed in to update a complaint');
      }

      const { id, ...fields } = updates;

      if (fields.status === 'resolved') {
        if (!fields.resolved_image_url?.trim()) {
          throw new Error('An after photo is required to resolve a report.');
        }

        const { error } = await supabase.rpc('resolve_grievance', {
          p_grievance_id: id,
          p_resolved_image_url: fields.resolved_image_url,
        });

        if (error) throw error;
        return;
      }

      const { data: current, error: fetchError } = await supabase
        .from('grievances')
        .select('status, reporter_id')
        .eq('id', id)
        .single();

      if (fetchError) throw new Error('Grievance not found');

      const { data, error } = await supabase
        .from('grievances')
        .update(fields)
        .eq('id', id)
        .select('id, title, status');

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('No matching grievance found to update.');
      }

      if (fields.status && current && fields.status !== current.status) {
        await awardPointsForStatus(current.reporter_id, id, current.status, fields.status);
      }
    },
    onSuccess: async () => {
      toast.success('Complaint updated.');
      await queryClient.invalidateQueries({ queryKey: complaintKeys.all });
      await queryClient.invalidateQueries({ queryKey: grievanceKeys.all });
      await queryClient.invalidateQueries({ queryKey: ['my-reports'] });
      await queryClient.invalidateQueries({ queryKey: ['reports-feed'] });
      await queryClient.invalidateQueries({ queryKey: ['resolution-queue'] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update complaint.');
    },
  });
};
