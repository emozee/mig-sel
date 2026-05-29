import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { diamondKeys } from './use-create-diamond';
import type { PendingDiamondReview } from '../types';

export const usePendingDiamonds = () => {
  return useQuery({
    queryKey: [...diamondKeys.all, 'pending'],
    staleTime: 30_000,
    queryFn: async (): Promise<PendingDiamondReview[]> => {
      const { data, error } = await supabase.rpc('get_pending_diamonds');
      if (error) throw error;
      return (data ?? []) as unknown as PendingDiamondReview[];
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
