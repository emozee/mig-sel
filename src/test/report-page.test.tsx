import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { ReportPage } from '@/routes/report-page';
import { renderWithProviders } from './test-utils';

const mocks = vi.hoisted(() => ({
  geo: {
    coords: null as { lat: number; lng: number } | null,
    accuracy: null as number | null,
    error: 'Location unavailable. Make sure GPS/location is turned on.' as string | null,
    errorType: 'position_unavailable' as string | null,
    loading: false,
    supported: true,
    permissionDenied: false,
  },
  requestLocation: vi.fn(),
  uploadImage: vi.fn(),
  createGrievance: vi.fn(),
  queueModeration: vi.fn(),
  computeFileHash: vi.fn(),
  findDuplicateImage: vi.fn(),
}));

vi.mock('@/features/auth/grievance/hooks/use-geo-location', () => ({
  useGeoLocation: () => ({ ...mocks.geo, requestLocation: mocks.requestLocation }),
}));

vi.mock('@/features/auth/grievance/components/use-upload-image', () => ({
  uploadGrievanceImage: mocks.uploadImage,
}));

vi.mock('@/features/auth/grievance/components/use-create-grievance', () => ({
  useCreateGrievance: () => ({ mutateAsync: mocks.createGrievance }),
}));

vi.mock('@/features/auth/api/use-current-user', () => ({
  useCurrentUser: () => ({ user: { id: 'user-1' } }),
}));

vi.mock('@/features/auth/grievance/api/classify-grievance-image', () => ({
  queueGrievanceImageClassification: mocks.queueModeration,
}));

vi.mock('@/features/auth/grievance/api/find-duplicate-image', () => ({
  computeFileHash: mocks.computeFileHash,
  findDuplicateImage: mocks.findDuplicateImage,
}));

vi.mock('@/components/layout/map-dock', () => ({ MapDock: () => null }));

describe('ReportPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(mocks.geo, {
      coords: null,
      accuracy: null,
      error: 'Location unavailable. Make sure GPS/location is turned on.',
      errorType: 'position_unavailable',
      loading: false,
      supported: true,
      permissionDenied: false,
    });
    mocks.computeFileHash.mockResolvedValue('a'.repeat(64));
    mocks.findDuplicateImage.mockResolvedValue([]);
    mocks.uploadImage.mockResolvedValue('https://example.com/report.jpg');
    mocks.createGrievance.mockResolvedValue({ id: '123e4567-e89b-12d3-a456-426614174000' });
    mocks.queueModeration.mockResolvedValue(undefined);
  });

  it('retries location without clearing the selected photo', async () => {
    renderWithProviders(<ReportPage />);
    const input = document.querySelector<HTMLInputElement>('input[type="file"]');
    const photo = new File(['photo'], 'road.jpg', { type: 'image/jpeg' });

    fireEvent.change(input!, { target: { files: [photo] } });
    expect(await screen.findByText('road.jpg')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(mocks.requestLocation).toHaveBeenCalledOnce();
    expect(screen.getByText('road.jpg')).toBeInTheDocument();
  });

  it('finishes submission without waiting for AI moderation', async () => {
    Object.assign(mocks.geo, {
      coords: { lat: 26.87, lng: 90.49 },
      error: null,
      errorType: null,
    });
    mocks.queueModeration.mockReturnValue(new Promise(() => {}));

    renderWithProviders(<ReportPage />);
    const input = document.querySelector<HTMLInputElement>('input[type="file"]');
    const photo = new File(['photo'], 'pothole.jpg', { type: 'image/jpeg' });

    fireEvent.change(input!, { target: { files: [photo] } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit Report' }));

    expect(await screen.findByText('Report submitted to GMC successfully!')).toBeInTheDocument();
    expect(mocks.queueModeration).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
  });
});
