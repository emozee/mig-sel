import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Complaint } from '@/features/complaint/types';

export const complaintKeys = {
  all: ['complaints'] as const,
  lists: () => [...complaintKeys.all, 'list'] as const,
  detail: (id: string) => [...complaintKeys.all, 'detail', id] as const,
};

export const useComplaints = () => {
  return useQuery({
    queryKey: complaintKeys.all,
    staleTime: 120_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('grievances')
        .select(
          'id, title, description, category, status, urgency, latitude, longitude, image_url, resolved_image_url, created_at, resolved_at, parent_id, reporter_id, approved, bonus_awarded',
        )
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      return data as Complaint[];
    },
  });
};
