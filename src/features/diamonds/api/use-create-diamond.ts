import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { uploadDiamondImages } from './upload-diamond-images';
import type { CreateDiamondInput } from '../types';

export const diamondKeys = {
  all: ['diamonds'] as const,
  lists: () => [...diamondKeys.all, 'list'] as const,
};

export const useCreateDiamond = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ body, files, linkedGrievanceId, collaboratorIds }: CreateDiamondInput) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let imageUrls: string[] = [];
      if (files.length > 0) {
        imageUrls = await uploadDiamondImages(files);
      }

      const payload: Record<string, unknown> = {
        user_id: user.id,
        body,
        image_urls: imageUrls,
      };

      if (linkedGrievanceId) {
        payload.linked_grievance_id = linkedGrievanceId;
      }

      const { data, error } = await supabase.from('diamonds').insert(payload).select('id').single();

      if (error) throw error;

      const diamondId = data.id as number;

      if (collaboratorIds && collaboratorIds.length > 0) {
        const { error: collabError } = await supabase.from('diamond_collaborators').insert(
          collaboratorIds.map((cid) => ({
            diamond_id: diamondId,
            user_id: cid,
          })),
        );

        if (collabError) throw collabError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: diamondKeys.all });
    },
  });
};
