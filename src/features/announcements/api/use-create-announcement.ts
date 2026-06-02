import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { announcementsKeys } from './use-announcements';
import type { Announcement, AnnouncementType } from '@/features/announcements/types';

export const useCreateAnnouncement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      title,
      body,
      type,
      expiresAt,
    }: {
      title: string;
      body: string;
      type?: AnnouncementType;
      expiresAt?: string | null;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const defaultExpiry =
        expiresAt !== undefined
          ? expiresAt
          : (() => {
              const d = new Date();
              d.setDate(d.getDate() + (type === 'important_notice' ? 3 : 7));
              return d.toISOString();
            })();

      const { data, error } = await supabase
        .from('announcements')
        .insert({
          title,
          body,
          type: type ?? 'announcement',
          author_id: user.id,
          expires_at: defaultExpiry,
        })
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
