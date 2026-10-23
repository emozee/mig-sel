import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { complaintKeys } from './use-complaints';
import { grievanceKeys } from '@/features/auth/grievance/api/use-grievances';

export const getGrievanceImagePath = (imageUrl: string | null | undefined) => {
  if (!imageUrl) return null;

  try {
    const pathname = new URL(imageUrl).pathname;
    const marker = '/storage/v1/object/public/grievances/';
    const markerIndex = pathname.indexOf(marker);
    if (markerIndex === -1) return null;

    const path = decodeURIComponent(pathname.slice(markerIndex + marker.length));
    return path.startsWith('reports/') ? path : null;
  } catch {
    return null;
  }
};

export const useRevertResolution = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, imageUrl }: { id: string; imageUrl?: string | null }) => {
      const { data, error } = await supabase.rpc('revert_grievance_resolution', {
        p_grievance_id: id,
      });

      if (error) throw error;

      const storedImageUrl = typeof data === 'string' ? data : imageUrl;
      const imagePath = getGrievanceImagePath(storedImageUrl);
      if (!storedImageUrl) return { imageRemoved: true };
      if (!imagePath) return { imageRemoved: false };

      const { error: removeError } = await supabase.storage.from('grievances').remove([imagePath]);

      return { imageRemoved: !removeError };
    },
    onSuccess: async ({ imageRemoved }) => {
      if (imageRemoved) {
        toast.success('Resolution reverted and after photo deleted.');
      } else {
        toast.warning('Resolution reverted, but the unlinked storage file could not be deleted.');
      }

      await queryClient.invalidateQueries({ queryKey: complaintKeys.all });
      await queryClient.invalidateQueries({ queryKey: grievanceKeys.all });
      await queryClient.invalidateQueries({ queryKey: ['my-reports'] });
      await queryClient.invalidateQueries({ queryKey: ['reports-feed'] });
      await queryClient.invalidateQueries({ queryKey: ['resolution-queue'] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to revert resolution.');
    },
  });
};
