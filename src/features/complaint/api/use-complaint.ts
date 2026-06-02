import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { complaintKeys } from './use-complaints';
import type { Complaint } from '@/features/complaint/types';

export const useComplaint = (id: string) => {
  return useQuery({
    queryKey: complaintKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase.from('grievances').select('*').eq('id', id).single();

      if (error) throw error;
      return data as Complaint;
    },
    enabled: !!id,
  });
};
