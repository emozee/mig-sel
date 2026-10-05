import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/features/auth/api/use-session';
import type { Delivery, Redemption, ShopCard, ShopSettings } from './types';

export function useShop() {
  return useQuery({
    queryKey: ['shop', 'catalogue'],
    queryFn: async () => {
      const [settings, cards] = await Promise.all([
        supabase.from('shop_settings').select('*').single(),
        supabase.from('shop_cards').select('*').order('sort_order').order('title'),
      ]);
      if (settings.error) throw settings.error;
      if (cards.error) throw cards.error;
      return { settings: settings.data as ShopSettings, cards: cards.data as ShopCard[] };
    },
    refetchInterval: 60000,
  });
}

export function useWallet() {
  const { data: session } = useSession();
  return useQuery({
    queryKey: ['shop', 'wallet', session?.user.id],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('point_wallets')
        .select('balance')
        .eq('user_id', session!.user.id)
        .maybeSingle();
      if (error) throw error;
      return Number(data?.balance ?? 0);
    },
    refetchInterval: 30000,
  });
}

export function useRedemptions(admin = false, enabled = true, page = 0, status = 'all') {
  const { data: session } = useSession();
  return useQuery({
    queryKey: ['shop', 'requests', session?.user.id, admin, page, status],
    enabled: !!session && enabled,
    queryFn: async () => {
      let query = supabase
        .from('shop_redemptions')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });
      if (!admin) query = query.eq('user_id', session!.user.id);
      if (status !== 'all') query = query.eq('status', status);
      const { data, error, count } = await query.range(page * 20, page * 20 + 19);
      if (error) throw error;
      return { rows: data as Redemption[], count: count ?? 0 };
    },
    refetchInterval: 30000,
  });
}

export function useRedemption(id: string | null, enabled: boolean) {
  const { data: session } = useSession();
  return useQuery({
    queryKey: ['shop', 'request', session?.user.id, id],
    enabled: !!session && enabled && !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shop_redemptions')
        .select('*')
        .eq('id', id!)
        .maybeSingle();
      if (error) throw error;
      return data as Redemption | null;
    },
    refetchInterval: 30000,
  });
}

export function useDeliveries() {
  return useQuery({
    queryKey: ['shop', 'deliveries'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('shop_recent_deliveries');
      if (error) throw error;
      return data as Delivery[];
    },
    refetchInterval: 60000,
  });
}

export function useShopMutation<T>(action: (input: T) => Promise<void>) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: action,
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['shop'] });
    },
  });
}
