import { useState, useRef } from 'react';
import { Send, X, Trash2, Pencil, Check, Loader2, BadgeCheck } from 'lucide-react';
import { useCurrentUser } from '@/features/auth/api/use-current-user';
import {
  useDiamondComments,
  useCreateDiamondComment,
  useEditDiamondComment,
  useDeleteDiamondComment,
} from '../api/use-diamond-comments';

interface DiamondCommentSectionProps {
  diamondId: number;
  open: boolean;
  onToggle?: () => void;
  onClose?: () => void;
}

export const DiamondCommentSection = ({
  diamondId,
  open,
  onToggle,
}: DiamondCommentSectionProps) => {
  const { user } = useCurrentUser();
  const { data: comments, isLoading } = useDiamondComments(diamondId);
  const { mutate: createComment, isPending: isCreating } = useCreateDiamondComment(diamondId);
  const { mutate: editComment, isPending: isEditing } = useEditDiamondComment(diamondId);
  const { mutate: deleteComment } = useDeleteDiamondComment(diamondId);

  const [newBody, setNewBody] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBody.trim() || isCreating) return;
    createComment({ body: newBody.trim() }, { onSuccess: () => setNewBody('') });
  };

  const handleEditSave = (commentId: string) => {
    if (!editBody.trim() || isEditing) return;
    editComment({ commentId, body: editBody.trim() }, { onSuccess: () => setEditId(null) });
  };

  const latestComment = comments?.[comments.length - 1];

  if (!open) {
    if (!comments?.length) return null;
    return (
      <div className="border-t border-gray-100 px-4 py-2">
        <p
          onClick={onToggle}
          className="cursor-pointer text-xs font-medium text-gray-500 hover:text-gray-700"
        >
          View all {comments.length} comment{comments.length !== 1 ? 's' : ''}
        </p>
        {latestComment && (
          <div className="mt-1 flex items-start gap-2">
            {latestComment.avatarUrl ? (
              <img
                src={latestComment.avatarUrl}
                alt=""
                className="h-5 w-5 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-200 text-[7px] font-bold text-gray-500">
                {latestComment.userInitials}
              </div>
            )}
            <p className="text-[11px] text-gray-500">
              <span className="font-semibold text-gray-700">{latestComment.userName}</span>{' '}
              {latestComment.body}
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="border-t border-gray-100 bg-gray-50/50">
      <div className="max-h-40 space-y-2 overflow-y-auto px-4 py-2">
        {isLoading ? (
          <p className="py-2 text-center text-[11px] text-gray-400">Loading comments...</p>
        ) : !comments?.length ? (
          <p className="py-2 text-center text-[11px] text-gray-400">No comments yet.</p>
        ) : (
          comments.map((c) => {
            const isOwner = user?.id === c.userId;
            const isEditingThis = editId === c.id;
            return (
              <div key={c.id} className="flex items-start gap-2">
                {c.avatarUrl ? (
                  <img
                    src={c.avatarUrl}
                    alt=""
                    className="h-6 w-6 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-200 text-[9px] font-bold text-gray-500">
                    {c.userInitials}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[11px] font-semibold text-gray-900">{c.userName}</span>
                    {c.userRole === 'official' && (
                      <BadgeCheck className="h-3 w-3 shrink-0 text-blue-500" />
                    )}
                    <span className="text-[10px] text-gray-400">
                      {new Date(c.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    {c.updatedAt && c.updatedAt !== c.createdAt && (
                      <span className="text-[10px] text-gray-400 italic">Edited</span>
                    )}
                    {isOwner && !isEditingThis && (
                      <div className="ml-auto flex items-center gap-0.5">
                        <button
                          onClick={() => {
                            setEditId(c.id);
                            setEditBody(c.body);
                          }}
                          className="rounded p-0.5 text-gray-300 hover:text-gray-600"
                        >
                          <Pencil className="h-2.5 w-2.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Delete comment?')) deleteComment(c.id);
                          }}
                          className="rounded p-0.5 text-gray-300 hover:text-red-500"
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    )}
                  </div>
                  {isEditingThis ? (
                    <div className="mt-0.5 flex items-center gap-1">
                      <input
                        value={editBody}
                        onChange={(e) => setEditBody(e.target.value)}
                        className="focus:border-primary/40 h-6 flex-1 rounded border border-gray-200 bg-white px-1.5 text-[11px] outline-none"
                        maxLength={500}
                        autoFocus
                      />
                      <button
                        onClick={() => handleEditSave(c.id)}
                        disabled={isEditing || !editBody.trim()}
                        className="text-primary hover:bg-primary/10 flex h-6 w-6 items-center justify-center rounded disabled:opacity-40"
                      >
                        {isEditing ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Check className="h-3 w-3" />
                        )}
                      </button>
                      <button
                        onClick={() => setEditId(null)}
                        className="flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:bg-gray-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-[11px] leading-relaxed text-gray-700">{c.body}</p>
                  )}
                  {c.imageUrl && (
                    <img
                      src={c.imageUrl}
                      alt=""
                      loading="lazy"
                      className="mt-1 max-h-20 rounded-lg object-cover"
                    />
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {user && (
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-1.5 border-t border-gray-100 px-4 py-2"
        >
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-200 text-[8px] font-bold text-gray-500">
            {user.user_metadata?.full_name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <input
            ref={inputRef}
            value={newBody}
            onChange={(e) => setNewBody(e.target.value)}
            placeholder="Write a comment..."
            maxLength={500}
            className="h-7 flex-1 rounded-full bg-gray-100 px-3 text-[11px] outline-none"
          />
          <button
            type="submit"
            disabled={!newBody.trim() || isCreating}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-40"
          >
            {isCreating ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Send className="h-3 w-3" />
            )}
          </button>
        </form>
      )}
    </div>
  );
};
