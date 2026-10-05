import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CommentSection } from '@/features/reports-feed/components/comment-section';
import { renderWithProviders } from './test-utils';
import type { FeedComment } from '@/features/reports-feed/types';

const mocks = vi.hoisted(() => ({
  user: null as { id: string } | null,
  isAdmin: false,
  comments: [] as FeedComment[],
  createComment: vi.fn(),
  editComment: vi.fn(),
  deleteComment: vi.fn(),
}));

vi.mock('@/features/auth/api/use-current-user', () => ({
  useCurrentUser: () => ({ user: mocks.user }),
}));

vi.mock('@/features/auth/api/use-is-admin', () => ({
  useIsAdmin: () => ({ data: mocks.isAdmin }),
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
};

const comment: FeedComment = {
  id: '100',
  feed_id: 10,
  user_id: 'user-a',
  user_name: 'User A',
  user_initials: 'UA',
  body: 'Original comment',
  created_at: '2026-09-20T00:00:00Z',
};

const openComments = () => {
  const trigger = screen.getByText('1').closest('button');
  if (!trigger) throw new Error('Comment trigger not found');
  fireEvent.click(trigger);
};

describe('comment permissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    mocks.user = { id: 'user-a' };
    mocks.isAdmin = false;
    mocks.comments = [comment];
  });

  it('lets a signed-in user create and manage their own comment', async () => {
    renderWithProviders(<CommentSection item={item} />);
    openComments();

    const composer = await screen.findByPlaceholderText('Write a comment...');
    fireEvent.change(composer, { target: { value: 'New comment' } });
    fireEvent.submit(composer.closest('form')!);

    expect(mocks.createComment).toHaveBeenCalledWith(
      { feedId: 10, body: 'New comment', imageFile: null },
      expect.any(Object),
    );
    expect(screen.getByRole('button', { name: 'Edit comment' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Comment actions' })).toBeInTheDocument();
  }, 15_000);

  it('hides edit and delete controls for another normal user', async () => {
    mocks.user = { id: 'user-b' };

    renderWithProviders(<CommentSection item={item} />);
    openComments();

    expect(await screen.findByText('Original comment')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Write a comment...')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit comment' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Comment actions' })).not.toBeInTheDocument();
  });

  it('lets an admin delete but not edit another user comment', async () => {
    mocks.user = { id: 'admin-a' };
    mocks.isAdmin = true;

    renderWithProviders(<CommentSection item={item} />);
    openComments();

    expect(await screen.findByText('Original comment')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit comment' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Comment actions' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(mocks.deleteComment).toHaveBeenCalledWith({ commentId: '100', feedId: 10 });
  });

  it('requires sign-in before creating a comment', async () => {
    mocks.user = null;

    renderWithProviders(<CommentSection item={item} />);
    openComments();

    expect(await screen.findByText('Sign in to add a comment.')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Write a comment...')).not.toBeInTheDocument();
  });
});
