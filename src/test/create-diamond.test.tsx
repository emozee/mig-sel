import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCreateDiamond } from '@/features/diamonds/api/use-create-diamond';

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  rpc: vi.fn(),
  uploadImages: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: mocks.getUser },
    rpc: mocks.rpc,
  },
}));

vi.mock('@/features/diamonds/api/upload-diamond-images', () => ({
  uploadDiamondImages: mocks.uploadImages,
}));

describe('useCreateDiamond', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'owner-1' } } });
    mocks.uploadImages.mockResolvedValue(['https://example.com/solution.jpg']);
    mocks.rpc.mockResolvedValue({ error: null });
  });

  it('creates the post and collaborators in one RPC call', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useCreateDiamond(), { wrapper });
    const file = new File(['image'], 'solution.jpg', { type: 'image/jpeg' });

    await act(async () => {
      await result.current.mutateAsync({
        body: 'Cleared the blocked drain',
        files: [file],
        linkedGrievanceId: 'grievance-1',
        collaboratorIds: ['collaborator-1'],
      });
    });

    expect(mocks.uploadImages).toHaveBeenCalledWith([file]);
    expect(mocks.rpc).toHaveBeenCalledWith('create_diamond_with_collaborators', {
      p_body: 'Cleared the blocked drain',
      p_image_urls: ['https://example.com/solution.jpg'],
      p_linked_grievance_id: 'grievance-1',
      p_collaborator_ids: ['collaborator-1'],
    });
  });
});
