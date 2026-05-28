import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface RandomProfile {
  id: string;
  username: string | null;
  avatar_url: string | null;
}

export const useRandomCommunityAvatar = () => {
  return useQuery<RandomProfile[]>({
    queryKey: ['random-community-avatar'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .not('avatar_url', 'is', null)
        .limit(50);

      if (error) throw error;
      if (!data || data.length === 0) return [];

      const shuffled = [...data].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, 3);
    },
    staleTime: 5 * 60 * 1000,
  });
};
