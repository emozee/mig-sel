import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { uploadGrievanceImage } from '@/features/auth/grievance/components/use-upload-image';
import { complaintKeys } from './use-complaints';
import { grievanceKeys } from '@/features/auth/grievance/api/use-grievances';

export const useResolveComplaint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, afterPhoto }: { id: string; afterPhoto: File }) => {
      const resolvedImageUrl = await uploadGrievanceImage(afterPhoto);
      const { error } = await supabase.rpc('resolve_grievance', {
        p_grievance_id: id,
        p_resolved_image_url: resolvedImageUrl,
      });

      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success('Report resolved with completion proof.');
      await queryClient.invalidateQueries({ queryKey: ['resolution-queue'] });
      await queryClient.invalidateQueries({ queryKey: complaintKeys.all });
      await queryClient.invalidateQueries({ queryKey: grievanceKeys.all });
      await queryClient.invalidateQueries({ queryKey: ['my-reports'] });
      await queryClient.invalidateQueries({ queryKey: ['reports-feed'] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to resolve report.');
    },
  });
};
