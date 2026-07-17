import { useEffect, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { sessionKeys } from '@/features/auth/api/use-session';
import { captureUserLocation } from '@/lib/location';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      queryClient.setQueryData(sessionKeys.current, session);

      if (event === 'SIGNED_IN' && session?.user?.id) {
        supabase
          .from('profiles')
          .select('location')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => {
            if (!data?.location) {
              captureUserLocation(session.user.id);
            }
          });
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      queryClient.setQueryData(sessionKeys.current, session);

      if (session?.user?.id) {
        supabase
          .from('profiles')
          .select('location')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => {
            if (!data?.location) {
              captureUserLocation(session.user.id);
            }
          });
      }
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  return <>{children}</>;
};
