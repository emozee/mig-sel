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

      const { error } = await supabase.rpc('create_diamond_with_collaborators', {
        p_body: body,
        p_image_urls: imageUrls,
        p_linked_grievance_id: linkedGrievanceId ?? null,
        p_collaborator_ids: collaboratorIds ?? [],
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: diamondKeys.all });
    },
  });
};
