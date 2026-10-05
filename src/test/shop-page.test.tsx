import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { ShopPage } from '@/routes/shop-page';
import { ShopDetailPage } from '@/routes/shop-detail-page';
import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

function renderShop(initialPath = '/shop') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(
    [
      { path: '/shop', element: <ShopPage /> },
      { path: '/shop/:slug', element: <ShopDetailPage /> },
    ],
    { initialEntries: [initialPath] },
  );
  return render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

const mocks = vi.hoisted(() => ({ signedIn: false, rpc: vi.fn() }));
vi.mock('@/lib/supabase', () => ({ supabase: { rpc: mocks.rpc } }));
vi.mock('@/features/auth/api/use-session', () => ({
  useSession: () => ({ data: mocks.signedIn ? { user: { id: 'user-1' } } : null }),
}));
vi.mock('@/features/gamification/api/use-user-profile', () => ({
  useUserProfile: () => ({ data: { points: 200 } }),
}));
vi.mock('@/components/layout/map-dock', () => ({ MapDock: () => null }));
vi.mock('@/features/chatbot/components/floating-chat', () => ({ FloatingChat: () => null }));
vi.mock('@/features/notifications/components/notification-bell', () => ({
  NotificationBell: () => null,
}));
vi.mock('@/features/shop/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/shop/api')>();
  return {
    ...actual,
    useShop: () => ({
      data: {
        settings: {
          id: true,
          enabled: true,
          starts_at: '2020-01-01T00:00:00Z',
          ends_at: '2099-01-01T00:00:00Z',
          nu_per_point: 1,
          delivery_message: 'Within 24 hours',
          updated_at: 'settings-v1',
        },
        cards: [
          {
            id: 'card-1',
            title: 'B-Mobile data',
            description: 'Prepaid',
            operator: 'bmobile',
            recharge_type: 'data',
            enabled: true,
            sort_order: 1,
            pricing_mode: 'rate',
            fixed_points: null,
            fixed_nu: null,
            package_amounts: [19, 49, 99],
            min_nu: 1,
            max_nu: 1000,
            updated_at: 'card-v1',
          },
          {
            id: 'card-2',
            title: 'TashiCell data',
            description: 'Prepaid',
            operator: 'tashicell',
            recharge_type: 'data',
            enabled: true,
            sort_order: 2,
            pricing_mode: 'rate',
            fixed_points: null,
            fixed_nu: null,
            package_amounts: [19, 49, 99],
            min_nu: 1,
            max_nu: 1000,
            updated_at: 'card-v2',
          },
          {
            id: 'card-3',
            title: 'B-Mobile talk time',
            description: 'Prepaid',
            operator: 'bmobile',
            recharge_type: 'talktime',
            enabled: true,
            sort_order: 3,
            pricing_mode: 'rate',
            fixed_points: null,
            fixed_nu: null,
            package_amounts: [],
            min_nu: 1,
            max_nu: 1000,
            updated_at: 'card-v3',
          },
          {
            id: 'card-4',
            title: 'TashiCell talk time',
            description: 'Prepaid',
            operator: 'tashicell',
            recharge_type: 'talktime',
            enabled: true,
            sort_order: 4,
            pricing_mode: 'rate',
            fixed_points: null,
            fixed_nu: null,
            package_amounts: [],
            min_nu: 1,
            max_nu: 1000,
            updated_at: 'card-v4',
          },
        ],
      },
    }),
    useWallet: () => ({ data: 200 }),
    useRedemptions: () => ({ data: { rows: [], count: 0 } }),
    useRedemption: (id: string | null) => ({
      data:
        id === 'req-1'
          ? {
              id,
              amount_nu: 99,
              recharge_type: 'data',
              status: 'delivered',
              phone: '+97517123456',
              points: 99,
              created_at: '2026-10-01T00:00:00Z',
              note: '',
            }
          : null,
      isPending: false,
    }),
    useDeliveries: () => ({
      data: [
        {
          masked_phone: '+975 17••••••',
          operator: 'bmobile',
          recharge_type: 'data',
          amount_nu: 99,
          delivered_at: '2026-10-01T00:00:00Z',
        },
        {
          recipient_label: 'Migsel member',
          reward_label: 'Community Reward voucher',
          delivered_at: '2026-10-02T00:00:00Z',
        },
      ],
    }),
  };
});

describe('shop redemption journey', () => {
  beforeEach(() => {
    mocks.signedIn = false;
    mocks.rpc.mockReset();
  });
  it('shows masked announcements publicly while requiring sign-in to redeem', () => {
    renderShop();
    expect(screen.getByText('+975 17••••••')).toBeInTheDocument();
    expect(screen.getByText('Community Reward voucher')).toBeInTheDocument();
    expect(screen.getByText('City Service Priority')).toBeInTheDocument();
    expect(screen.getByText('Mobile Recharge')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View Mobile Recharge' })).toBeInTheDocument();
    expect(screen.queryByText('My recharges')).not.toBeInTheDocument();
  });
  it('opens an undefined reward on its own coming-soon page', () => {
    renderShop();
    fireEvent.click(screen.getByRole('link', { name: 'View City Service Priority' }));
    expect(screen.getByRole('heading', { name: 'Coming soon' })).toBeInTheDocument();
    expect(screen.queryByText('Recent rewards delivered')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to shop' })).toBeInTheDocument();
  });
  it('links to the exact recharge request from a status notification', () => {
    mocks.signedIn = true;
    renderShop('/shop/mobile-recharge?request=req-1');
    expect(screen.getByRole('region', { name: 'Selected recharge request' })).toHaveTextContent(
      'delivered',
    );
    expect(screen.getByRole('region', { name: 'Selected recharge request' })).toHaveTextContent(
      '+97517123456',
    );
  });
  it('requires review and reuses the same request ID after an uncertain response', async () => {
    mocks.signedIn = true;
    mocks.rpc
      .mockResolvedValueOnce({ error: { message: 'Network timeout' } })
      .mockResolvedValueOnce({ error: null });
    renderShop();
    expect(screen.queryByRole('region', { name: 'Recharge request' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: 'View Mobile Recharge' }));
    expect(screen.getByRole('region', { name: 'Recharge request' })).toBeInTheDocument();
    expect(screen.queryByText('Recent rewards delivered')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Operator'), { target: { value: 'tashicell' } });
    fireEvent.change(screen.getByLabelText('Recharge type'), { target: { value: 'talktime' } });
    fireEvent.change(screen.getByLabelText('Operator'), { target: { value: 'bmobile' } });
    fireEvent.change(screen.getByLabelText('Recharge type'), { target: { value: 'data' } });
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Recipient mobile number'), {
      target: { value: '17123456' },
    });
    fireEvent.change(screen.getByLabelText('Points to redeem'), { target: { value: '99' } });
    fireEvent.click(screen.getByRole('button', { name: 'Review request' }));
    expect(mocks.rpc).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm redemption' }));
    await screen.findByRole('alert');
    fireEvent.click(screen.getByRole('button', { name: 'Retry same request' }));
    await waitFor(() => expect(mocks.rpc).toHaveBeenCalledTimes(2));
    expect(mocks.rpc.mock.calls[0]).toEqual(mocks.rpc.mock.calls[1]);
    expect(mocks.rpc.mock.calls[0][1]).toMatchObject({
      p_phone: '+97517123456',
      p_points: 99,
      p_public_display: true,
      p_settings_version: 'settings-v1',
      p_card_version: 'card-v1',
    });
    await waitFor(() =>
      expect(screen.queryByText('Confirm your recharge')).not.toBeInTheDocument(),
    );
  });
});
