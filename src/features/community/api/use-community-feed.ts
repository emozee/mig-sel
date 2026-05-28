import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/features/auth/api/use-current-user';
import type { ActivityItem, FeedStatus, ImpactGoal } from '../types';

const MOCK_GOAL: ImpactGoal = {
  id: 'g1',
  title: 'Monsoon Readiness',
  current: 15,
  target: 30,
  unit: 'issues resolved',
  location: 'Sarpang',
};

export const communityKeys = {
  all: ['community'] as const,
  feed: (userId?: string) => [...communityKeys.all, 'feed', userId] as const,
  goal: () => [...communityKeys.all, 'goal'] as const,
};

export const useCommunityFeed = () => {
  const { user } = useCurrentUser();

  return useQuery({
    queryKey: communityKeys.feed(user?.id),
    staleTime: 30_000,
    retry: 1,
    queryFn: async (): Promise<ActivityItem[]> => {
      const { data, error } = await supabase
        .from('community_feed')
        .select(
          'id, user_name, user_initials, action_text, location, image_url, created_at, upvote_count, comment_count, user_id, status, grievance:grievances!grievance_id(status, latitude, longitude)',
        )
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        if (error.code === '42P01') {
          console.warn('community_feed table not yet created in DB');
          return [];
        }
        throw error;
      }

      const avatarMap = new Map<string, string>();
      const userIds = (data || []).map((r) => r.user_id).filter((id): id is string => !!id);
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, avatar_url')
          .in('id', userIds);
        if (profiles) {
          for (const p of profiles) {
            if (p.avatar_url) avatarMap.set(p.id, p.avatar_url);
          }
        }
      }

      let upvotedIds = new Set<number>();
      if (user?.id && data?.length) {
        const ids = data.map((r) => r.id);
        const { data: upvotes, error: upvoteError } = await supabase
          .from('community_feed_upvotes')
          .select('feed_id')
          .eq('user_id', user.id)
          .in('feed_id', ids);

        if (upvoteError) {
          console.warn('community_feed_upvotes query failed:', upvoteError.message);
        } else if (upvotes) {
          upvotedIds = new Set(upvotes.map((u) => u.feed_id));
        }
      }

      return (data || []).map<ActivityItem>((row) => ({
        id: row.id,
        userName: row.user_name,
        userInitials: row.user_initials,
        action: row.action_text,
        location: row.location ?? '',
        timestamp: new Date(row.created_at),
        upvoteCount: row.upvote_count ?? 0,
        commentCount: row.comment_count ?? 0,
        isUpvoted: upvotedIds.has(row.id),
        image_url: row.image_url ?? undefined,
        userId: row.user_id ?? undefined,
        avatarUrl: row.user_id ? avatarMap.get(row.user_id) : undefined,
        status:
          (row.grievance as { status?: FeedStatus; latitude?: number; longitude?: number } | null)
            ?.status ??
          (row.status as FeedStatus | null) ??
          undefined,
        latitude: (row.grievance as { latitude?: number } | null)?.latitude ?? undefined,
        longitude: (row.grievance as { longitude?: number } | null)?.longitude ?? undefined,
      }));
    },
  });
};

export const useCommunityGoal = () => {
  return useQuery({
    queryKey: communityKeys.goal(),
    queryFn: async (): Promise<ImpactGoal> => {
      await new Promise((r) => setTimeout(r, 200));
      return MOCK_GOAL;
    },
  });
};
