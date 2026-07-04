import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export const grievanceKeys = {
  all: ['grievances'] as const,
  lists: () => [...grievanceKeys.all, 'list'] as const,
};

interface GrievanceRow {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  latitude: number;
  longitude: number;
  image_url: string;
  resolved_image_url?: string;
  created_at: string;
  resolved_at?: string;
  parent_id: string | null;
  reporter_id: string;
}

export const useGrievances = () => {
  return useQuery({
    queryKey: grievanceKeys.lists(),
    staleTime: 300_000,
    queryFn: async (): Promise<GrievanceRow[]> => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data, error } = await supabase
        .from('grievances')
        .select(
          'id, title, description, category, status, latitude, longitude, image_url, resolved_image_url, created_at, resolved_at, parent_id, reporter_id',
        )
        .eq('approved', true)
        .or(
          `status.in.(pending,in-progress,submitted),and(status.in.(resolved,closed),resolved_at.gte.${sevenDaysAgo.toISOString()})`,
        )
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      return data ?? [];
    },
  });
};
