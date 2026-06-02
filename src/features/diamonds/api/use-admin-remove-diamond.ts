import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { diamondKeys } from './use-create-diamond';

export const useAdminRemoveDiamond = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (diamondId: number) => {
      const { error } = await supabase.rpc('admin_remove_diamond', {
        p_diamond_id: diamondId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: diamondKeys.all });
    },
  });
};
