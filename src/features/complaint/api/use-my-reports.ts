import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/features/auth/api/use-session';

export interface MyReport {
  id: string;
  title: string;
  description: string | null;
  status: string;
  category: string;
  image_url: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at?: string;
}

export interface MyReportsResult {
  reports: MyReport[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const useMyReports = (page = 1, pageSize = 10) => {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['my-reports', session?.user?.id, page, pageSize],
    queryFn: async (): Promise<MyReportsResult> => {
      if (!session?.user?.id) return { reports: [], total: 0, page, pageSize, totalPages: 0 };

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const [countResult, dataResult] = await Promise.all([
        supabase
          .from('grievances')
          .select('id', { count: 'exact', head: true })
          .eq('reporter_id', session.user.id),
        supabase
          .from('grievances')
          .select(
            'id, title, description, status, category, image_url, latitude, longitude, created_at',
          )
          .eq('reporter_id', session.user.id)
          .order('created_at', { ascending: false })
          .range(from, to),
      ]);

      const total = countResult.count;
      const { data, error } = dataResult;

      if (error) throw error;
      return {
        reports: (data ?? []) as MyReport[],
        total: total ?? 0,
        page,
        pageSize,
        totalPages: total ? Math.ceil(total / pageSize) : 0,
      };
    },
    enabled: !!session?.user?.id,
    staleTime: 30_000,
  });
};
