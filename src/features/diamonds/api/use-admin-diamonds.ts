import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { diamondKeys } from './use-create-diamond';
import { grievanceKeys } from '@/features/auth/grievance/api/use-grievances';
import { communityKeys } from '@/features/reports-feed/api/use-reports-feed';
import type { PendingDiamondReview } from '../types';

function mapPendingDiamond(row: Record<string, unknown>): PendingDiamondReview {
  return {
    id: row.id as number,
    userId: (row.user_id ?? row.userId) as string,
    body: row.body as string,
    imageUrls: (row.image_urls ?? row.imageUrls ?? []) as string[],
    linkedGrievanceId: (row.linked_grievance_id ?? row.linkedGrievanceId) as string | undefined,
    createdAt: (row.created_at ?? row.createdAt) as string,
    userName: (row.user_name ?? row.userName) as string,
    userAvatar: (row.user_avatar ?? row.userAvatar) as string | undefined,
    collaboratorCount: (row.collaborator_count ?? row.collaboratorCount ?? 0) as number,
    grievanceTitle: (row.grievance_title ?? row.grievanceTitle) as string,
  };
}

export const usePendingDiamonds = () => {
  return useQuery({
    queryKey: [...diamondKeys.all, 'pending'],
    staleTime: 30_000,
    queryFn: async (): Promise<PendingDiamondReview[]> => {
      const { data, error } = await supabase.rpc('get_pending_diamonds');
      if (error) throw error;
      return (data ?? []).map(mapPendingDiamond);
    },
  });
};

export const useAcceptDiamond = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (diamondId: number) => {
      const { error } = await supabase.rpc('accept_diamond', { diamond_id: diamondId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: diamondKeys.all });
      queryClient.invalidateQueries({ queryKey: grievanceKeys.all });
      queryClient.invalidateQueries({ queryKey: communityKeys.all });
    },
  });
};

export const useRejectDiamond = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (diamondId: number) => {
      const { error } = await supabase.rpc('reject_diamond', { diamond_id: diamondId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: diamondKeys.all });
    },
  });
};

export const useAdminRemoveCollaborator = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      diamondId,
      collaboratorId,
    }: {
      diamondId: number;
      collaboratorId: string;
    }) => {
      const { error } = await supabase.rpc('remove_diamond_collaborator', {
        diamond_id: diamondId,
        collaborator_id: collaboratorId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...diamondKeys.all, 'pending'] });
    },
  });
};
