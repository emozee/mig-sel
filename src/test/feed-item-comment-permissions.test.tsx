import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FeedItem } from '@/features/reports-feed/components/feed-item';
import { renderWithProviders } from './test-utils';
import type { FeedComment } from '@/features/reports-feed/types';

const mocks = vi.hoisted(() => ({
  user: { id: 'user-a' } as { id: string } | null,
  isAdmin: false,
  comments: [] as FeedComment[],
  createComment: vi.fn(),
  editComment: vi.fn(),
  deleteComment: vi.fn(),
}));

vi.mock('react-router', async (importOriginal) => {
  const original = await importOriginal<typeof import('react-router')>();
  return { ...original, useNavigate: () => vi.fn() };
});

vi.mock('@/features/auth/api/use-current-user', () => ({
  useCurrentUser: () => ({ user: mocks.user }),
}));

vi.mock('@/features/auth/api/use-is-admin', () => ({
  useIsAdmin: () => ({ data: mocks.isAdmin }),
}));

vi.mock('@/features/reports-feed/api/use-toggle-upvote', () => ({
  useToggleUpvote: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('@/features/reports-feed/api/use-delete-feed-item', () => ({
  useDeleteFeedItem: () => ({ mutate: vi.fn() }),
}));

vi.mock('@/features/reports-feed/api/use-feed-comments', () => ({
  useFeedComments: () => ({ data: mocks.comments, isLoading: false }),
  useCreateComment: () => ({ mutate: mocks.createComment, isPending: false }),
}));

vi.mock('@/features/reports-feed/api/use-edit-comment', () => ({
  useEditComment: () => ({ mutate: mocks.editComment, isPending: false }),
}));

vi.mock('@/features/reports-feed/api/use-delete-comment', () => ({
  useDeleteComment: () => ({ mutate: mocks.deleteComment }),
}));

vi.mock('@/features/reports-feed/components/comment-section', () => ({
  CommentSection: () => null,
}));

const comment: FeedComment = {
  id: '100',
  feed_id: 10,
  user_id: 'user-a',
  user_name: 'User A',
  user_initials: 'UA',
  body: 'Image viewer comment',
  created_at: '2026-09-20T00:00:00Z',
};

const item = {
  id: 10,
  userName: 'Reporter',
  userInitials: 'R',
  action: 'reported waste',
  location: 'Thimphu',
  timestamp: new Date('2026-09-20T00:00:00Z'),
  upvoteCount: 0,
  commentCount: 1,
  isUpvoted: false,
  image_url: 'https://example.com/report.jpg',
};

const openImageViewer = () => {
  fireEvent.click(screen.getByAltText('Activity photo'));
};

describe('image viewer comment permissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.user = { id: 'user-a' };
    mocks.isAdmin = false;
    mocks.comments = [comment];
  });

  it('lets an owner edit and delete their comment', async () => {
    renderWithProviders(<FeedItem item={item} />);
    openImageViewer();

    expect(await screen.findByText('Image viewer comment')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit comment' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete comment' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Write a comment...')).toBeInTheDocument();
  });

  it('lets an admin delete but not edit another user comment', async () => {
    mocks.user = { id: 'admin-a' };
    mocks.isAdmin = true;

    renderWithProviders(<FeedItem item={item} />);
    openImageViewer();

    expect(await screen.findByText('Image viewer comment')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit comment' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete comment' })).toBeInTheDocument();
  });

  it('hides edit and delete controls from another normal user', async () => {
    mocks.user = { id: 'user-b' };

    renderWithProviders(<FeedItem item={item} />);
    openImageViewer();

    expect(await screen.findByText('Image viewer comment')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit comment' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete comment' })).not.toBeInTheDocument();
  });
});
