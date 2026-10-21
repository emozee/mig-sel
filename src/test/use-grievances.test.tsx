import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useGrievances } from '@/features/auth/grievance/api/use-grievances';

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  statusFilter: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: { from: mocks.from },
}));

describe('useGrievances', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    const query = {
      select: vi.fn(),
      eq: vi.fn(),
      or: mocks.statusFilter,
      order: vi.fn(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    };
    query.select.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.or.mockReturnValue(query);
    query.order.mockReturnValue(query);
    mocks.from.mockReturnValue(query);
  });

  it('requests public grievances as active map markers', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useGrievances(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mocks.statusFilter).toHaveBeenCalledWith(
      expect.stringContaining('status.in.(pending,in-progress,submitted,public)'),
    );
  });
});
