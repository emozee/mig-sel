import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { WasteRecord, WasteCategory } from '@/features/waste/types';

type RawRecord = {
  id: string;
  category: WasteCategory;
  quantity: number;
  unit: string;
  reported_at: string;
  collected_at: string | null;
  deleted_at: string | null;
  deletion_reason: string | null;
  edit_count: number;
  notes: string;
};

const mapRecord = (row: RawRecord): WasteRecord => ({
  id: row.id,
  category: row.category,
  quantity: Number(row.quantity),
  unit: row.unit,
  reportedAt: row.reported_at,
  collectedAt: row.collected_at,
  deletedAt: row.deleted_at,
  deletionReason: row.deletion_reason,
  editCount: row.edit_count,
  notes: row.notes,
});

export const wasteKeys = {
  all: ['waste-records'] as const,
};

export const useWasteRecords = () => {
  return useQuery({
    queryKey: wasteKeys.all,
    staleTime: 180_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('waste_records')
        .select(
          'id, category, quantity, unit, reported_at, collected_at, deleted_at, deletion_reason, edit_count, notes',
        )
        .is('deleted_at', null)
        .order('reported_at', { ascending: false });

      if (error) throw error;
      return (data as RawRecord[]).map(mapRecord);
    },
  });
};
