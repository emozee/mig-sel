import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Check, X, Users, Link2, Clock, AlertTriangle, Loader2, ExternalLink } from 'lucide-react';
import {
  usePendingDiamonds,
  useAcceptDiamond,
  useRejectDiamond,
  useAdminRemoveCollaborator,
} from '../api/use-admin-diamonds';
import { useDiamondCollaborators } from '../api/use-diamond-collaborators';

export const DiamondReview = () => {
  const { data: pending, isLoading, isError } = usePendingDiamonds();
  const { mutate: accept, isPending: acceptPending } = useAcceptDiamond();
  const { mutate: reject, isPending: rejectPending } = useRejectDiamond();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="animate-pulse rounded-xl bg-white p-4 shadow-sm">
            <div className="h-4 w-3/4 rounded bg-gray-200" />
            <div className="mt-2 h-3 w-1/2 rounded bg-gray-200" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-5 text-center">
        <AlertTriangle className="h-5 w-5 text-red-400" />
        <p className="text-sm font-medium text-red-700">Failed to load pending diamonds</p>
      </div>
    );
  }

  if (!pending?.length) {
    return (
      <div className="rounded-xl bg-white p-6 text-center shadow-sm">
        <Check className="text-primary mx-auto h-8 w-8" />
        <p className="mt-2 text-sm text-gray-500">No pending direct-solve requests</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {pending.map((d) => (
        <DiamondReviewCard
          key={d.id}
          diamond={d}
          expanded={expandedId === d.id}
          onToggle={() => setExpandedId(expandedId === d.id ? null : d.id)}
          onAccept={() => accept(d.id)}
          onReject={() => reject(d.id)}
          acceptPending={acceptPending}
          rejectPending={rejectPending}
        />
      ))}
    </div>
  );
};

function DiamondReviewCard({
  diamond,
  expanded,
  onToggle,
  onAccept,
  onReject,
  acceptPending,
  rejectPending,
}: {
  diamond: {
    id: number;
    userName: string;
    body: string;
    imageUrls: string[];
    grievanceTitle: string;
    collaboratorCount: number;
    createdAt: string;
  };
  expanded: boolean;
  onToggle: () => void;
  onAccept: () => void;
  onReject: () => void;
  acceptPending: boolean;
  rejectPending: boolean;
}) {
  const navigate = useNavigate();
  const { data: collaborators } = useDiamondCollaborators(expanded ? diamond.id : 0);
  const { mutate: removeCollab } = useAdminRemoveCollaborator();
  const [removingId, setRemovingId] = useState<string | null>(null);

  const rawDiamond = diamond as Record<string, unknown>;
  const reviewImages: string[] =
    (rawDiamond.image_urls as string[] | undefined) ??
    (rawDiamond.imageUrls as string[] | undefined) ??
    [];

  const handleRemoveCollab = (userId: string) => {
    setRemovingId(userId);
    removeCollab(
      { diamondId: diamond.id, collaboratorId: userId },
      { onSettled: () => setRemovingId(null) },
    );
  };

  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100">
          <Clock className="h-4 w-4 text-amber-600" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">{diamond.userName}</span>
            <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
              Pending
            </span>
          </div>
          <p className="mt-0.5 line-clamp-1 text-sm text-gray-600">{diamond.body}</p>
          <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-2 text-[11px]">
            <span className="inline-flex items-center gap-0.5">
              <Link2 className="h-3 w-3" />
              {diamond.grievanceTitle}
            </span>
            {diamond.collaboratorCount > 0 && (
              <span className="inline-flex items-center gap-0.5">
                <Users className="h-3 w-3" />
                {diamond.collaboratorCount} volunteer{diamond.collaboratorCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 px-4 py-3">
          {reviewImages.length > 0 && (
            <div className="mb-3">
              <p className="text-muted-foreground mb-1.5 text-xs font-medium">Photos</p>
              <div className="flex flex-wrap gap-1.5">
                {reviewImages.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt=""
                    className="h-20 w-20 rounded-lg object-cover ring-1 ring-gray-200"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ))}
              </div>
            </div>
          )}
          {collaborators && collaborators.length > 0 && (
            <div className="mb-3 space-y-1.5">
              <p className="text-muted-foreground text-xs font-medium">Volunteers</p>
              {collaborators.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-lg bg-gray-50 px-2.5 py-1.5"
                >
                  <div className="flex items-center gap-2">
                    {c.avatarUrl ? (
                      <img src={c.avatarUrl} alt="" className="h-6 w-6 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-[9px] font-bold text-gray-500">
                        {c.userInitials}
                      </div>
                    )}
                    <span className="text-xs text-gray-700">{c.userName}</span>
                  </div>
                  <button
                    type="button"
                    disabled={removingId === c.userId}
                    onClick={() => handleRemoveCollab(c.userId)}
                    className="text-muted-foreground flex h-6 w-6 items-center justify-center rounded-full transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                  >
                    {removingId === c.userId ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <X className="h-3 w-3" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate(`/diamond?post=${diamond.id}`)}
              className="text-muted-foreground hover:text-primary flex items-center gap-1 text-xs font-medium transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              View Post
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onAccept}
                disabled={acceptPending || rejectPending}
                className="bg-primary hover:bg-primary/90 flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-colors disabled:opacity-50"
              >
                {acceptPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Check className="h-3 w-3" />
                )}
                Accept
              </button>
              <button
                type="button"
                onClick={onReject}
                disabled={acceptPending || rejectPending}
                className="flex items-center gap-1 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-200 disabled:opacity-50"
              >
                {rejectPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <X className="h-3 w-3" />
                )}
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
