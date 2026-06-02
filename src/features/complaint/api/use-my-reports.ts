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
  created_at: string;
  updated_at?: string;
}

export const useMyReports = () => {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['my-reports', session?.user?.id],
    queryFn: async (): Promise<MyReport[]> => {
      if (!session?.user?.id) return [];

      const { data, error } = await supabase
        .from('grievances')
        .select('id, title, description, status, category, image_url, created_at')
        .eq('reporter_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as MyReport[];
    },
    enabled: !!session?.user?.id,
  });
};
