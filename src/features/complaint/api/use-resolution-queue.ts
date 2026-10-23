import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/features/auth/api/use-session';

export interface ResolutionReport {
  id: string;
  title: string;
  description: string | null;
  category: string;
  image_url: string | null;
  location: string | null;
  created_at: string;
}

export const useResolutionQueue = () => {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['resolution-queue', session?.user?.id],
    enabled: !!session?.user?.id,
    staleTime: 30_000,
    queryFn: async (): Promise<ResolutionReport[]> => {
      if (!session?.user?.id) return [];

      const { data, error } = await supabase
        .from('grievances')
        .select('id, title, description, category, image_url, location, created_at')
        .eq('approved', true)
        .eq('status', 'in-progress')
        .neq('reporter_id', session.user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data ?? []) as ResolutionReport[];
    },
  });
};
