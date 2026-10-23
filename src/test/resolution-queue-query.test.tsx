import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useResolutionQueue } from '@/features/complaint/api/use-resolution-queue';

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  statusFilter: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: { from: mocks.from },
}));

vi.mock('@/features/auth/api/use-session', () => ({
  useSession: () => ({ data: { user: { id: 'inspector-1' } } }),
}));

describe('useResolutionQueue', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    const query = {
      select: vi.fn(),
      eq: vi.fn(),
      in: mocks.statusFilter,
      neq: vi.fn(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    };
    query.select.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.in.mockReturnValue(query);
    query.neq.mockReturnValue(query);
    mocks.from.mockReturnValue(query);
  });

  it('includes public and in-progress reports', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useResolutionQueue(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mocks.statusFilter).toHaveBeenCalledWith('status', ['in-progress', 'public']);
  });
});
