import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { WasteRecord } from '@/features/waste/types';
import { wasteKeys } from './use-waste-records';

export const useUpdateWasteRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (record: WasteRecord) => {
      const dbPayload: Record<string, unknown> = {};

      if (record.category) dbPayload.category = record.category;
      if (record.quantity !== undefined) dbPayload.quantity = Number(record.quantity);
      if (record.unit) dbPayload.unit = record.unit;
      if (record.reportedAt) dbPayload.reported_at = record.reportedAt;
      if (record.notes !== undefined) dbPayload.notes = record.notes;

      dbPayload.edit_count = (record.editCount ?? 0) + 1;

      const { error } = await supabase.from('waste_records').update(dbPayload).eq('id', record.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wasteKeys.all });
    },
  });
};
