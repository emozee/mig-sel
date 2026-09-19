import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { diamondKeys } from './use-create-diamond';
import type { DiamondCollaborator } from '../types';

export const useDiamondCollaborators = (diamondId: number) => {
  return useQuery({
    queryKey: [...diamondKeys.all, 'collaborators', diamondId],
    staleTime: 60_000,
    enabled: !!diamondId,
    queryFn: async (): Promise<DiamondCollaborator[]> => {
      const { data, error } = await supabase
        .from('diamond_collaborators')
        .select('id, diamond_id, user_id, created_at')
        .eq('diamond_id', diamondId);

      if (error) throw error;
      if (!data || data.length === 0) return [];

      const userIds = data.map((r) => r.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', userIds);

      const profileMap = new Map<string, { name: string; avatar?: string }>();
      if (profiles) {
        for (const p of profiles) {
          const name = p.username ?? 'Unknown';
          profileMap.set(p.id, { name, avatar: p.avatar_url ?? undefined });
        }
      }

      return data.map((row) => {
        const profile = profileMap.get(row.user_id);
        return {
          id: row.id,
          diamondId: row.diamond_id,
          userId: row.user_id,
          userName: profile?.name ?? 'Unknown',
          userInitials: (profile?.name ?? '??').slice(0, 2).toUpperCase(),
          avatarUrl: profile?.avatar,
          createdAt: row.created_at,
        };
      });
    },
  });
};
