import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { WasteCategory } from '@/features/waste/types';
import { wasteKeys } from './use-waste-records';

type CreateInput = {
  category: WasteCategory;
  quantity: number;
  unit: string;
  reportedAt: string;
  notes: string;
};

export const useCreateWasteRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateInput) => {
      const payload = {
        category: input.category,
        quantity: input.quantity,
        unit: input.unit,
        reported_at: input.reportedAt,
        collected_at: null,
        notes: input.notes,
      };

      const { error } = await supabase.from('waste_records').insert([payload]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wasteKeys.all });
    },
  });
};
