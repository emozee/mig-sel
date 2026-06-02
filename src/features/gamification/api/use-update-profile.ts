import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { profileKeys } from './use-user-profile';
import { leaderboardKeys } from './use-leaderboard';

interface UpdateProfileInput {
  userId: string;
  username?: string | null;
  avatar_url?: string | null;
  username_edit_count?: number;
}

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      username,
      avatar_url,
      username_edit_count,
    }: UpdateProfileInput) => {
      const updates: Record<string, string | number | null> = {};
      if (username !== undefined) updates.username = username;
      if (avatar_url !== undefined) updates.avatar_url = avatar_url;
      if (username_edit_count !== undefined) updates.username_edit_count = username_edit_count;

      const { error } = await supabase.from('profiles').upsert({
        id: userId,
        ...updates,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.current() });
      queryClient.invalidateQueries({ queryKey: leaderboardKeys.all() });
    },
  });
};
