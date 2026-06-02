import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export type SearchedUser = {
  id: string;
  email: string;
  username: string | null;
  avatar_url: string | null;
  points: number;
  role: string | null;
  created_at: string;
};

export const useSearchUser = (email: string | null) => {
  return useQuery({
    queryKey: ['admin', 'search-user', email],
    queryFn: async () => {
      if (!email) return null;
      const { data, error } = await supabase.rpc('search_user_by_email', {
        p_email: email,
      });
      if (error) throw error;
      const result = data as SearchedUser[];
      return result?.[0] ?? null;
    },
    enabled: !!email,
    retry: false,
  });
};
