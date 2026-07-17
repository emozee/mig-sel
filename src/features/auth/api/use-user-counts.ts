import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export type UserCounts = {
  total: number;
  active: number;
  inactive: number;
};

export type UserGrowth = {
  month: string;
  count: number;
};

export const useUserCounts = () => {
  return useQuery({
    queryKey: ['super-admin', 'user-counts'],
    staleTime: 120_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_user_counts');
      if (error) throw error;
      return data as UserCounts;
    },
  });
};

export const useUserGrowth = () => {
  return useQuery({
    queryKey: ['super-admin', 'user-growth'],
    staleTime: 300_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_user_growth');
      if (error) throw error;
      return (data as UserGrowth[]) ?? [];
    },
  });
};
