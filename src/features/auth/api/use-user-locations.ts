import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export type UserLocation = {
  location: string;
  count: number;
};

export const useUserLocations = () => {
  return useQuery({
    queryKey: ['super-admin', 'user-locations'],
    staleTime: 300_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_user_locations');
      if (error) throw error;
      return (data as UserLocation[]) ?? [];
    },
  });
};
