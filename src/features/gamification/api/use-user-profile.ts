import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/features/auth/api/use-session';
import type { UserProfile } from '@/features/gamification/types';

export const profileKeys = {
  current: () => ['profile'] as const,
};

export const useUserProfile = () => {
  const { data: session } = useSession();

  return useQuery({
    queryKey: profileKeys.current(),
    queryFn: async () => {
      if (!session?.user?.id) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, points, role, username_edit_count')
        .eq('id', session.user.id)
        .single();

      if (error && error.code === 'PGRST116') return null;
      if (error) throw error;
      return data as UserProfile;
    },
    enabled: !!session?.user?.id,
  });
};
