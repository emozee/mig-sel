import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { diamondKeys } from './use-create-diamond';

export const useUpdateDiamond = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ diamondId, body }: { diamondId: number; body: string }) => {
      const { error } = await supabase.from('diamonds').update({ body }).eq('id', diamondId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: diamondKeys.all });
    },
  });
};
