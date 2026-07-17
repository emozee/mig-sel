import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useSession } from './use-session';

export const useIsSuperAdmin = () => {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['profile-role-super-admin', session?.user?.id],
    staleTime: 600_000,
    queryFn: async () => {
      if (!session?.user?.id) return false;
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
      const metadataRole =
        (session.user?.app_metadata?.role as string | undefined) ??
        (session.user?.user_metadata?.role as string | undefined);
      return (data?.role ?? metadataRole) === 'super_admin';
    },
    enabled: !!session?.user?.id,
  });
};
