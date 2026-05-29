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
    queryFn: async (): Promise<GrievanceRow[]> => {
      const { data, error } = await supabase
        .from('grievances')
        .select('*')
        .eq('approved', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Auto-hide resolved/closed grievances resolved more than 1 week ago
      // to avoid overcrowding on the user map. Admin panel still shows everything.
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      return (data || []).filter((g) => {
        if (g.status !== 'resolved' && g.status !== 'closed') return true;
        if (!g.resolved_at) return true;
        return new Date(g.resolved_at) >= oneWeekAgo;
      });
    },
  });
};
