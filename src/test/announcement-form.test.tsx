import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AnnouncementForm } from '@/features/announcements/components/announcement-form';
import { renderWithProviders } from './test-utils';

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
}));

vi.mock('@/features/gamification/api/use-user-profile', () => ({
  useUserProfile: () => ({ data: { id: 'official-1', role: 'official' } }),
}));

vi.mock('@/features/announcements/api/use-create-announcement', () => ({
  useCreateAnnouncement: () => ({ mutate: mocks.create, isPending: false }),
}));

describe('AnnouncementForm', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sends the selected notification location', () => {
    renderWithProviders(<AnnouncementForm />);

    fireEvent.change(screen.getByPlaceholderText('Announcement title'), {
      target: { value: 'Water service update' },
    });
    fireEvent.change(screen.getByPlaceholderText('Write your announcement...'), {
      target: { value: 'Service will resume by 5 PM.' },
    });
    fireEvent.change(screen.getByLabelText('Notify residents in'), {
      target: { value: 'Thimphu' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Post Announcement' }));

    expect(mocks.create).toHaveBeenCalledWith(
      {
        title: 'Water service update',
        body: 'Service will resume by 5 PM.',
        type: 'announcement',
        expiresAt: undefined,
        targetLocation: 'Thimphu',
      },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });
});
