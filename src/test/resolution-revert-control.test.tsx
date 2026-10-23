import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ResolutionRevertControl } from '@/features/complaint/components/resolution-revert-control';
import { getGrievanceImagePath } from '@/features/complaint/api/use-revert-resolution';
import { renderWithProviders } from './test-utils';

const mocks = vi.hoisted(() => ({
  isSuperAdmin: false,
  mutate: vi.fn(),
}));

vi.mock('@/features/auth/api/use-is-super-admin', () => ({
  useIsSuperAdmin: () => ({ data: mocks.isSuperAdmin }),
}));

vi.mock('@/features/complaint/api/use-revert-resolution', async (importOriginal) => {
  const original =
    await importOriginal<typeof import('@/features/complaint/api/use-revert-resolution')>();
  return {
    ...original,
    useRevertResolution: () => ({ mutate: mocks.mutate, isPending: false }),
  };
});

describe('ResolutionRevertControl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isSuperAdmin = false;
  });

  it('is hidden from regular admins', () => {
    renderWithProviders(
      <ResolutionRevertControl
        complaintId="report-1"
        imageUrl="https://example.supabase.co/storage/v1/object/public/grievances/reports/after.jpg"
      />,
    );

    expect(screen.queryByRole('button', { name: 'Revert Resolution' })).not.toBeInTheDocument();
  });

  it('asks a super admin to confirm before reverting', () => {
    mocks.isSuperAdmin = true;
    const imageUrl =
      'https://example.supabase.co/storage/v1/object/public/grievances/reports/after.jpg?width=800&quality=80';

    renderWithProviders(<ResolutionRevertControl complaintId="report-1" imageUrl={imageUrl} />);

    fireEvent.click(screen.getByRole('button', { name: 'Revert Resolution' }));
    expect(screen.getByText('Revert this resolution?')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Confirm Revert' }));
    expect(mocks.mutate).toHaveBeenCalledWith(
      { id: 'report-1', imageUrl },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });
});

describe('getGrievanceImagePath', () => {
  it('extracts the storage path from an optimized public URL', () => {
    expect(
      getGrievanceImagePath(
        'https://example.supabase.co/storage/v1/object/public/grievances/reports/after%20photo.jpg?width=800',
      ),
    ).toBe('reports/after photo.jpg');
  });

  it('rejects URLs outside the grievance reports folder', () => {
    expect(
      getGrievanceImagePath(
        'https://example.supabase.co/storage/v1/object/public/grievances/comment-images/file.jpg',
      ),
    ).toBeNull();
  });
});
