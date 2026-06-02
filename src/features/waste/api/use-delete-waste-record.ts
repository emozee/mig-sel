import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { wasteKeys } from './use-waste-records';
import { archivedWasteKeys } from './use-archived-waste-records';

export const useDeleteWasteRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { error } = await supabase
        .from('waste_records')
        .update({ deleted_at: new Date().toISOString(), deletion_reason: reason })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wasteKeys.all });
      queryClient.invalidateQueries({ queryKey: archivedWasteKeys.all });
    },
  });
};
