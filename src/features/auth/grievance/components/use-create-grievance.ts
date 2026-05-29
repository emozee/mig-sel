import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { grievanceKeys } from '../api/use-grievances';

interface GrievanceInput {
  title: string;
  description: string;
  category: string;
  latitude: number;
  longitude: number;
  image_url: string;
  reporter_id: string | null;
}

export const useCreateGrievance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: GrievanceInput) => {
      const { data, error } = await supabase
        .from('grievances')
        .insert({ ...input, status: 'pending', approved: false })
        .select()
        .single();

      if (error) throw error;

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: grievanceKeys.lists() });
    },
  });
};
