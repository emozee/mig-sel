import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ResolutionQueue } from '@/features/complaint/components/resolution-queue';
import { renderWithProviders } from './test-utils';

const mocks = vi.hoisted(() => ({
  mutate: vi.fn(),
}));

vi.mock('@/features/complaint/api/use-resolution-queue', () => ({
  useResolutionQueue: () => ({
    data: [
      {
        id: 'report-1',
        title: 'Blocked drain',
        description: 'Water cannot pass through the drain.',
        category: 'drainage',
        image_url: 'https://example.com/before.jpg',
        location: 'Main Street',
        created_at: '2026-10-20T00:00:00Z',
      },
    ],
    isLoading: false,
    isError: false,
    error: null,
  }),
}));

vi.mock('@/features/complaint/api/use-resolve-complaint', () => ({
  useResolveComplaint: () => ({ mutate: mocks.mutate, isPending: false }),
}));

describe('ResolutionQueue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn(() => 'blob:after-photo'),
      revokeObjectURL: vi.fn(),
    });
  });

  it('requires an after photo before an inspector can resolve a report', () => {
    renderWithProviders(<ResolutionQueue />);

    const resolveButton = screen.getByRole('button', { name: 'Mark Resolved' });
    expect(resolveButton).toBeDisabled();

    const afterPhoto = new File(['after'], 'after.jpg', { type: 'image/jpeg' });
    fireEvent.change(screen.getByLabelText('Upload the completed-work photo'), {
      target: { files: [afterPhoto] },
    });

    expect(screen.getByAltText('After photo preview')).toBeInTheDocument();
    expect(resolveButton).toBeEnabled();

    fireEvent.click(resolveButton);

    expect(mocks.mutate).toHaveBeenCalledWith(
      { id: 'report-1', afterPhoto },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });
});
