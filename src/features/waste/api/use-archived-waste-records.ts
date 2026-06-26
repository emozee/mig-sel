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

export const archivedWasteKeys = {
  all: ['archived-waste-records'] as const,
};

export const useArchivedWasteRecords = () => {
  return useQuery({
    queryKey: archivedWasteKeys.all,
    staleTime: 300_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('waste_records')
        .select(
          'id, category, quantity, unit, reported_at, collected_at, deleted_at, deletion_reason, edit_count, notes',
        )
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      return (data as RawRecord[]).map(mapRecord);
    },
  });
};
