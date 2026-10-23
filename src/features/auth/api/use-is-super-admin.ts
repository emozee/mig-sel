import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useSession } from './use-session';

export const useIsSuperAdmin = () => {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['profile-role-super-admin', session?.user?.id],
    staleTime: 600_000,
    enabled: !!session?.user?.id,
    queryFn: async () => {
      if (!session?.user?.id) return false;

      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;
      return data.role === 'super_admin';
    },
  });
};
