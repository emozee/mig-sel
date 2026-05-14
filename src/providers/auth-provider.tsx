import { useEffect, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { sessionKeys } from '@/features/auth/api/use-session';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      queryClient.setQueryData(sessionKeys.current, session);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      queryClient.setQueryData(sessionKeys.current, session);
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  return <>{children}</>;
};
