import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { diamondKeys } from './use-create-diamond';
import type { DiamondComment } from '../types';

export const useDiamondComments = (diamondId: number) => {
  return useQuery({
    queryKey: [...diamondKeys.all, 'comments', diamondId],
    staleTime: 60_000,
    enabled: !!diamondId,
    queryFn: async (): Promise<DiamondComment[]> => {
      const { data, error } = await supabase
        .from('diamond_comments')
        .select('id, diamond_id, user_id, body, image_url, created_at, updated_at')
        .eq('diamond_id', diamondId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      const userIds = [...new Set(data.map((r) => r.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, role')
        .in('id', userIds);

      const profileMap = new Map<
        string,
        { name: string; initials: string; avatar?: string; role?: string }
      >();
      if (profiles) {
        for (const p of profiles) {
          const name = p.username ?? 'Unknown';
          profileMap.set(p.id, {
            name,
            initials: name.slice(0, 2).toUpperCase(),
            avatar: p.avatar_url ?? undefined,
            role: p.role ?? undefined,
          });
        }
      }

      return data.map((row) => {
        const profile = profileMap.get(row.user_id);
        return {
          id: String(row.id),
          diamondId: row.diamond_id,
          userId: row.user_id,
          body: row.body,
          imageUrl: row.image_url ?? undefined,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          userName: profile?.name ?? 'Unknown',
          userInitials: profile?.initials ?? '??',
          avatarUrl: profile?.avatar,
          userRole: profile?.role,
        };
      });
    },
  });
};

export const useCreateDiamondComment = (diamondId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ body, imageUrl }: { body: string; imageUrl?: string }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { error } = await supabase.from('diamond_comments').insert({
        diamond_id: diamondId,
        user_id: user.user.id,
        body,
        image_url: imageUrl ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...diamondKeys.all, 'comments', diamondId] });
      queryClient.invalidateQueries({ queryKey: diamondKeys.lists() });
    },
  });
};

export const useEditDiamondComment = (diamondId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, body }: { commentId: string; body: string }) => {
      const { error } = await supabase
        .from('diamond_comments')
        .update({ body })
        .eq('id', commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...diamondKeys.all, 'comments', diamondId] });
    },
  });
};

export const useDeleteDiamondComment = (diamondId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase.from('diamond_comments').delete().eq('id', commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...diamondKeys.all, 'comments', diamondId] });
      queryClient.invalidateQueries({ queryKey: diamondKeys.lists() });
    },
  });
};
