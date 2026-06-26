import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { complaintKeys } from './use-complaints';
import type { Complaint } from '@/features/complaint/types';

export const useComplaint = (id: string) => {
  return useQuery({
    queryKey: complaintKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('grievances')
        .select(
          'id, title, description, status, category, image_url, created_at, updated_at, reporter_id, approved, latitude, longitude, resolved_image_url',
        )
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as Complaint | null;
    },
    enabled: !!id,
    staleTime: 60_000,
  });
};
