import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { announcementsKeys } from './use-announcements';
import type { Announcement, AnnouncementType } from '@/features/announcements/types';

export const useUpdateAnnouncement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      title,
      body,
      type,
      is_pinned,
    }: {
      id: number;
      title?: string;
      body?: string;
      type?: AnnouncementType;
      is_pinned?: boolean;
    }) => {
      const updates: Record<string, string | boolean> = {};
      if (title !== undefined) updates.title = title;
      if (body !== undefined) updates.body = body;
      if (type !== undefined) updates.type = type;
      if (is_pinned !== undefined) updates.is_pinned = is_pinned;

      const { data, error } = await supabase
        .from('announcements')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Announcement;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: announcementsKeys.all() });
    },
  });
};
