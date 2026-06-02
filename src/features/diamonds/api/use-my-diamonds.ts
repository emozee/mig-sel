import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/features/auth/api/use-session';
import { diamondKeys } from './use-create-diamond';
import type { DiamondFeedItem, DiamondStatus, DiamondCollaboratorSummary } from '../types';

export const useMyDiamonds = (page: number = 1, pageSize: number = 20) => {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  return useQuery({
    queryKey: [...diamondKeys.lists(), 'my', userId, page, pageSize],
    staleTime: 60_000,
    enabled: !!userId,
    queryFn: async (): Promise<{ items: DiamondFeedItem[]; count: number }> => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const {
        data,
        error,
        count: totalCount,
      } = await supabase
        .from('diamonds')
        .select(
          'id, user_id, body, image_urls, created_at, linked_grievance_id, status, direct_solve_awarded',
          { count: 'exact', head: false },
        )
        .eq('user_id', userId!)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        if (error.code === '42P01') {
          return { items: [], count: 0 };
        }
        throw error;
      }

      if (!data || data.length === 0) return { items: [], count: totalCount ?? 0 };

      const userIds = data.map((r) => r.user_id).filter((id): id is string => !!id);
      const diamondIds = data.map((r) => r.id);
      const grievanceIds = data
        .map((r) => r.linked_grievance_id)
        .filter((id): id is string => !!id);
      const avatarMap = new Map<
        string,
        { username: string; initials: string; avatar_url?: string }
      >();
      const grievanceMap = new Map<
        string,
        { title: string; image?: string; lat?: number; lng?: number }
      >();
      const collaboratorMap = new Map<number, DiamondCollaboratorSummary[]>();
      const upvoteCountMap = new Map<number, number>();
      const userUpvotedMap = new Map<number, boolean>();
      const commentCountMap = new Map<number, number>();

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', userIds);

        if (profiles) {
          for (const p of profiles) {
            const name = p.username ?? 'Unknown';
            avatarMap.set(p.id, {
              username: name,
              initials: name.slice(0, 2).toUpperCase(),
              avatar_url: p.avatar_url ?? undefined,
            });
          }
        }
      }

      if (grievanceIds.length > 0) {
        const { data: grievances } = await supabase
          .from('grievances')
          .select('id, title, image_url, latitude, longitude')
          .in('id', grievanceIds);

        if (grievances) {
          for (const g of grievances) {
            grievanceMap.set(g.id, {
              title: g.title,
              image: g.image_url ?? undefined,
              lat: g.latitude,
              lng: g.longitude,
            });
          }
        }
      }

      if (diamondIds.length > 0) {
        const { data: collabs } = await supabase
          .from('diamond_collaborators')
          .select('diamond_id, user_id')
          .in('diamond_id', diamondIds);

        if (collabs && collabs.length > 0) {
          const allCollabIds = collabs as { user_id: string; diamond_id: number }[];
          const collabUserIds = [...new Set(allCollabIds.map((c) => c.user_id))];

          const { data: collabProfiles } = await supabase
            .from('profiles')
            .select('id, username, avatar_url')
            .in('id', collabUserIds);

          const collabProfileMap = new Map<
            string,
            { name: string; initials: string; avatar?: string }
          >();
          if (collabProfiles) {
            for (const p of collabProfiles) {
              const name = p.username ?? 'Unknown';
              collabProfileMap.set(p.id, {
                name,
                initials: name.slice(0, 2).toUpperCase(),
                avatar: p.avatar_url ?? undefined,
              });
            }
          }

          for (const c of allCollabIds) {
            const profile = collabProfileMap.get(c.user_id);
            if (!profile) continue;
            if (!collaboratorMap.has(c.diamond_id)) {
              collaboratorMap.set(c.diamond_id, []);
            }
            collaboratorMap.get(c.diamond_id)!.push({
              userId: c.user_id,
              userName: profile.name,
              userInitials: profile.initials,
              avatarUrl: profile.avatar,
            });
          }
        }
      }

      if (diamondIds.length > 0) {
        const { data: upvotes } = await supabase
          .from('diamond_upvotes')
          .select('diamond_id, user_id')
          .in('diamond_id', diamondIds);

        if (upvotes) {
          const countMap = new Map<number, number>();
          const userSet = new Set<string>();
          for (const u of upvotes) {
            countMap.set(u.diamond_id, (countMap.get(u.diamond_id) ?? 0) + 1);
            if (userId && u.user_id === userId) {
              userSet.add(String(u.diamond_id));
            }
          }
          for (const id of diamondIds) {
            upvoteCountMap.set(id, countMap.get(id) ?? 0);
            userUpvotedMap.set(id, userSet.has(String(id)));
          }
        }
      }

      if (diamondIds.length > 0) {
        const { data: comments } = await supabase
          .from('diamond_comments')
          .select('diamond_id')
          .in('diamond_id', diamondIds);

        if (comments) {
          const countMap = new Map<number, number>();
          for (const c of comments) {
            countMap.set(c.diamond_id, (countMap.get(c.diamond_id) ?? 0) + 1);
          }
          for (const id of diamondIds) {
            commentCountMap.set(id, countMap.get(id) ?? 0);
          }
        }
      }

      const items = data.map<DiamondFeedItem>((row) => {
        const profile = row.user_id ? avatarMap.get(row.user_id) : undefined;
        const grievance = row.linked_grievance_id
          ? grievanceMap.get(row.linked_grievance_id)
          : undefined;
        return {
          id: row.id,
          userId: row.user_id ?? '',
          body: row.body,
          imageUrls: (row.image_urls as string[]) ?? [],
          createdAt: row.created_at,
          userName: profile?.username ?? 'Unknown',
          userInitials: profile?.initials ?? '??',
          avatarUrl: profile?.avatar_url,
          linkedGrievanceId: row.linked_grievance_id ?? undefined,
          linkedGrievanceTitle: grievance?.title,
          linkedGrievanceImage: grievance?.image,
          linkedGrievanceLat: grievance?.lat,
          linkedGrievanceLng: grievance?.lng,
          status: (row.status as DiamondStatus) ?? 'pending',
          directSolve: row.direct_solve_awarded ?? false,
          collaborators: collaboratorMap.get(row.id) ?? [],
          upvoteCount: upvoteCountMap.get(row.id) ?? 0,
          commentCount: commentCountMap.get(row.id) ?? 0,
          isUpvoted: userUpvotedMap.get(row.id) ?? false,
        };
      });

      return { items, count: totalCount ?? items.length };
    },
  });
};
