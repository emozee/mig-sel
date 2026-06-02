import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface UserGrievance {
  id: string;
  title: string;
  status: string;
  image_url?: string;
}

export const useUserGrievances = (search?: string) => {
  return useQuery({
    queryKey: ['all-grievances', search],
    staleTime: 60_000,
    queryFn: async (): Promise<UserGrievance[]> => {
      let query = supabase
        .from('grievances')
        .select('id, title, status, image_url')
        .in('status', ['public'])
        .order('created_at', { ascending: false });

      if (search?.trim()) {
        query = query.ilike('title', `%${search.trim()}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as UserGrievance[];
    },
  });
};
