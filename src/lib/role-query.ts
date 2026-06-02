import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';

export const getUserRole = async (session: Session | null) => {
  if (!session?.user?.id) return null;
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();
  const metadataRole =
    (session.user?.app_metadata?.role as string | undefined) ??
    (session.user?.user_metadata?.role as string | undefined);
  return profile?.role ?? metadataRole ?? null;
};
