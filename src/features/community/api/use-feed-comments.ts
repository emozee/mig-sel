import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { communityKeys } from './use-community-feed';
import { uploadCommentImage } from './upload-comment-image';
import type { FeedComment } from '../types';

export const commentKeys = {
  byFeed: (feedId: number) => [...communityKeys.all, 'comments', feedId] as const,
};

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const useFeedComments = (feedId: number) => {
  return useQuery({
    queryKey: commentKeys.byFeed(feedId),
    queryFn: async (): Promise<FeedComment[]> => {
      const { data, error } = await supabase
        .from('community_feed_comments')
        .select('id, feed_id, user_id, body, user_name, created_at, updated_at, image_url')
        .eq('feed_id', feedId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return (data ?? []).map((row) => ({
        id: row.id as string,
        feed_id: row.feed_id as number,
        user_id: row.user_id as string,
        body: row.body as string,
        created_at: row.created_at as string,
        updated_at: (row.updated_at as string) ?? undefined,
        image_url: (row.image_url as string) ?? undefined,
        user_name: row.user_name as string,
        user_initials: getInitials(row.user_name as string),
      }));
    },
    staleTime: 30_000,
    retry: 1,
    enabled: feedId > 0,
  });
};

export const useCreateComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      feedId,
      body,
      imageFile,
    }: {
      feedId: number;
      body: string;
      imageFile?: File | null;
    }) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) throw new Error('Must be logged in to comment');

      const userName =
        user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email ?? 'Unknown';
      const initials = userName
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

      let imageUrl: string | undefined;
      if (imageFile) {
        imageUrl = await uploadCommentImage(imageFile);
      }

      const { error } = await supabase.from('community_feed_comments').insert({
        feed_id: feedId,
        user_id: user.id,
        user_name: userName,
        user_initials: initials,
        body,
        image_url: imageUrl ?? null,
      });

      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: commentKeys.byFeed(variables.feedId) });
      queryClient.invalidateQueries({ queryKey: communityKeys.all });
    },
  });
};
