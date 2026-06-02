import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Announcement } from '@/features/announcements/types';

export const announcementsKeys = {
  all: () => ['announcements'] as const,
};

export const useAnnouncements = () => {
  return useQuery({
    queryKey: announcementsKeys.all(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Announcement[];
    },
    staleTime: 60_000,
  });
};
