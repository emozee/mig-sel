import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComplaintMonitor } from '@/features/complaint/components/complaint-monitor';
import { renderWithProviders } from './test-utils';
import type { Complaint } from '@/features/complaint/types';

const mocks = vi.hoisted(() => ({
  resolve: vi.fn(),
  status: 'in-progress' as Complaint['status'],
}));

const complaint: Complaint = {
  id: 'report-1',
  created_at: '2026-10-23T00:00:00Z',
  title: 'Blocked drain',
  description: 'The drain is blocked.',
  category: 'drainage',
  status: 'in-progress',
  image_url: 'https://example.com/before.jpg',
  latitude: 27.47,
  longitude: 89.64,
  reporter_id: 'reporter-1',
  location: 'Main Street',
  resolved_image_url: null,
  urgency: 'medium',
  resolved_at: null,
  parent_id: null,
  bonus_awarded: 2,
  approved: true,
  ai_label: null,
};

vi.mock('react-router', async (importOriginal) => {
  const original = await importOriginal<typeof import('react-router')>();
  return { ...original, useNavigate: () => vi.fn() };
});

vi.mock('@/features/complaint/api/use-complaints', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/features/complaint/api/use-complaints')>();
  return {
    ...original,
    useComplaints: () => ({
      data: [{ ...complaint, status: mocks.status }],
      isLoading: false,
      error: null,
    }),
  };
});

vi.mock('@/features/complaint/api/use-approve-complaint', () => ({
  useApproveComplaint: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('@/features/complaint/api/use-disapprove-complaint', () => ({
  useDisapproveComplaint: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('@/features/complaint/api/use-resolve-complaint', () => ({
  useResolveComplaint: () => ({ mutate: mocks.resolve, isPending: false }),
}));

vi.mock('@/features/complaint/components/resolution-photo-dialog', () => ({
  ResolutionPhotoDialog: ({ open }: { open: boolean }) =>
    open ? <div>Resolution photo popup</div> : null,
}));

describe('ComplaintMonitor resolution workflow', () => {
  beforeEach(() => {
    mocks.status = 'in-progress';
    vi.clearAllMocks();
  });

  it('opens the photo popup instead of directly resolving from the status dropdown', () => {
    renderWithProviders(<ComplaintMonitor />);

    const statusSelect = screen.getByLabelText('Status for Blocked drain');
    expect(statusSelect).toHaveValue('in-progress');

    fireEvent.change(statusSelect, { target: { value: 'resolved' } });

    expect(screen.getByText('Resolution photo popup')).toBeInTheDocument();
    expect(statusSelect).toHaveValue('in-progress');
    expect(mocks.resolve).not.toHaveBeenCalled();
  });

  it('allows a public report to enter the required-photo resolution workflow', () => {
    mocks.status = 'public';
    renderWithProviders(<ComplaintMonitor />);

    const statusSelect = screen.getByLabelText('Status for Blocked drain');
    expect(statusSelect).toHaveValue('public');

    fireEvent.change(statusSelect, { target: { value: 'resolved' } });

    expect(screen.getByText('Resolution photo popup')).toBeInTheDocument();
    expect(statusSelect).toHaveValue('public');
    expect(mocks.resolve).not.toHaveBeenCalled();
  });
});
