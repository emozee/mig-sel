import { useState, useRef } from 'react';
import {
  Clock,
  CheckCircle2,
  MoveRight,
  MapPin,
  Trophy,
  Loader2,
  UserCheck,
  Trash2,
} from 'lucide-react';
import {
  DialogRoot,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  URGENCY_BADGE,
  STATUS_BADGE,
  CATEGORY_LABELS,
  STATUS_LABELS,
  URGENCY_LABELS,
  CATEGORY_COLORS,
  STATUS_ORDER,
} from '@/features/complaint/constants';
import { Field } from '@/components/ui/field';
import { ImageLightbox } from '@/features/auth/grievance/components/image-lightbox';
import { useUpdateComplaint } from '@/features/complaint/api/use-update-complaint';
import { useApproveComplaint } from '@/features/complaint/api/use-approve-complaint';
import { useDisapproveComplaint } from '@/features/complaint/api/use-disapprove-complaint';
import { useClickOutside } from '@/hooks/use-click-outside';
import type { Complaint, ComplaintStatus, ComplaintUrgency } from '@/features/complaint/types';

export function ComplaintDetailDialog({
  complaint,
  trigger,
}: {
  complaint: Complaint;
  trigger: React.ReactNode;
}) {
  const updateComplaint = useUpdateComplaint();
  const approveComplaint = useApproveComplaint();
  const disapproveComplaint = useDisapproveComplaint();
  const [showDisapproveConfirm, setShowDisapproveConfirm] = useState(false);
  const [editingUrgency, setEditingUrgency] = useState(false);
  const [editingStatus, setEditingStatus] = useState(false);
  const urgencyRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  useClickOutside(urgencyRef, () => setEditingUrgency(false));
  useClickOutside(statusRef, () => setEditingStatus(false));

  const handleUrgencyChange = (urgency: ComplaintUrgency) => {
    setEditingUrgency(false);
    if (urgency === complaint.urgency) return;
    updateComplaint.mutate({ id: complaint.id, urgency });
  };

  const handleStatusChange = (status: ComplaintStatus) => {
    setEditingStatus(false);
    if (status === complaint.status) return;
    const updates: Record<string, unknown> = { id: complaint.id, status };
    if (status === 'resolved') {
      updates.resolved_at = new Date().toISOString();
    }
    updateComplaint.mutate(updates as Parameters<typeof updateComplaint.mutate>[0]);
  };

  const statusPoints: Record<string, number> = {
    pending: 1,
    'in-progress': 2,
    resolved: 4,
  };

  return (
    <DialogRoot>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">{complaint.title}</DialogTitle>
          <DialogDescription>
            Reported on{' '}
            {new Date(complaint.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              {complaint.approved ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
                  <CheckCircle2 className="h-3 w-3" />
                  Approved
                </span>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => approveComplaint.mutate(complaint.id)}
                    disabled={approveComplaint.isPending}
                    className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-amber-600 px-3 py-1 text-xs font-bold text-white transition-all hover:bg-amber-700 disabled:opacity-50"
                  >
                    <UserCheck className="h-3 w-3" />
                    {approveComplaint.isPending ? 'Approving...' : 'Approve'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDisapproveConfirm(true)}
                    disabled={disapproveComplaint.isPending}
                    className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white transition-all hover:bg-red-700 disabled:opacity-50"
                    title="Permanently delete this report"
                  >
                    <Trash2 className="h-3 w-3" />
                    {disapproveComplaint.isPending ? 'Removing...' : 'Disapprove'}
                  </button>
                </>
              )}
            </div>
            <div ref={urgencyRef} className="relative">
              <button
                type="button"
                onClick={() => setEditingUrgency(!editingUrgency)}
                className="cursor-pointer rounded-full px-3 py-1 text-xs font-bold tracking-wide uppercase shadow-sm transition-all hover:opacity-80"
                style={{
                  backgroundColor: URGENCY_BADGE[complaint.urgency]?.bg || '#f3f4f6',
                  color: URGENCY_BADGE[complaint.urgency]?.text || '#1f2937',
                }}
              >
                {URGENCY_LABELS[complaint.urgency] || complaint.urgency}
              </button>
              {editingUrgency && (
                <div className="bg-card border-border/50 absolute left-0 z-50 mt-1 w-36 overflow-hidden rounded-xl border shadow-xl">
                  {(Object.keys(URGENCY_LABELS) as ComplaintUrgency[]).map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => handleUrgencyChange(u)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-xs font-bold tracking-wide uppercase transition-colors hover:opacity-80"
                      style={{
                        backgroundColor:
                          u === complaint.urgency ? URGENCY_BADGE[u].bg : 'transparent',
                        color: URGENCY_BADGE[u].text,
                      }}
                    >
                      {URGENCY_LABELS[u]}
                      {u === complaint.urgency && (
                        <span className="ml-auto text-[10px] opacity-60">Current</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div ref={statusRef} className="relative">
              <button
                type="button"
                onClick={() => setEditingStatus(!editingStatus)}
                className="inline-flex cursor-pointer items-center gap-1 rounded-full px-3 py-1 text-xs font-bold tracking-wide uppercase shadow-sm transition-all hover:opacity-80"
                style={{
                  backgroundColor: STATUS_BADGE[complaint.status]?.bg || '#f3f4f6',
                  color: STATUS_BADGE[complaint.status]?.text || '#1f2937',
                }}
              >
                {complaint.status === 'pending' ? (
                  <Clock className="h-3 w-3" />
                ) : complaint.status === 'resolved' ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <MoveRight className="h-3 w-3" />
                )}
                {STATUS_LABELS[complaint.status] || complaint.status}
              </button>
              {editingStatus && (
                <div className="bg-card border-border/50 absolute left-0 z-50 mt-1 w-40 overflow-hidden rounded-xl border shadow-xl">
                  {STATUS_ORDER.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleStatusChange(s)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-xs font-bold tracking-wide uppercase transition-colors hover:opacity-80"
                      style={{
                        backgroundColor:
                          s === complaint.status ? STATUS_BADGE[s].bg : 'transparent',
                        color: STATUS_BADGE[s].text,
                      }}
                    >
                      {s === 'pending' ? (
                        <Clock className="h-3 w-3" />
                      ) : s === 'resolved' ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <MoveRight className="h-3 w-3" />
                      )}
                      {STATUS_LABELS[s]}
                      {s === complaint.status && (
                        <span className="ml-auto text-[10px] opacity-60">Current</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {complaint.image_url && (
            <div className="border-border/50 overflow-hidden rounded-xl border bg-black/5 shadow-sm">
              <ImageLightbox
                src={complaint.image_url}
                alt={complaint.title}
                className="max-h-[50vh] w-full object-contain"
              />
            </div>
          )}

          <Field label="Description">
            <p className="leading-relaxed">{complaint.description}</p>
          </Field>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Category">
              <span className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: CATEGORY_COLORS[complaint.category] || '#6b7280' }}
                />
                {CATEGORY_LABELS[complaint.category] || complaint.category}
              </span>
            </Field>
            <Field label="Urgency">
              <select
                value={complaint.urgency}
                onChange={(e) => handleUrgencyChange(e.target.value as ComplaintUrgency)}
                className="cursor-pointer rounded-lg border px-2 py-1 text-xs font-bold tracking-wide uppercase outline-none"
                style={{
                  borderColor: URGENCY_BADGE[complaint.urgency]?.text || '#c2c9bb',
                  backgroundColor: URGENCY_BADGE[complaint.urgency]?.bg || '#f3f4f6',
                  color: URGENCY_BADGE[complaint.urgency]?.text || '#1f2937',
                }}
              >
                {(Object.keys(URGENCY_LABELS) as ComplaintUrgency[]).map((key) => (
                  <option key={key} value={key}>
                    {URGENCY_LABELS[key]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <span>{STATUS_LABELS[complaint.status] || complaint.status}</span>
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Latitude">
              <span className="font-mono text-xs">{complaint.latitude}</span>
            </Field>
            <Field label="Longitude">
              <span className="font-mono text-xs">{complaint.longitude}</span>
            </Field>
            <Field label="Location">
              <span className="flex items-center gap-1">
                <MapPin className="text-muted-foreground/60 h-3 w-3 shrink-0" />
                {complaint.location ?? '—'}
              </span>
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Reporter ID">
              <span className="font-mono text-xs">{complaint.reporter_id}</span>
            </Field>
            <Field label="Resolved At">
              <span className="text-xs">
                {complaint.resolved_at
                  ? new Date(complaint.resolved_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })
                  : '—'}
              </span>
            </Field>
            <Field label="Bonus Awarded">
              <span className="text-xs">{complaint.bonus_awarded}</span>
            </Field>
          </div>

          <div className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
            <Trophy className="h-4 w-4 text-amber-600" />
            <span className="text-xs font-medium text-amber-800">
              Points: <strong>{statusPoints[complaint.status] ?? 1}</strong>
              {' / 4 pts'}
            </span>
          </div>

          {complaint.parent_id && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <span className="font-semibold">Linked to parent:</span> {complaint.parent_id}
            </div>
          )}

          {complaint.resolved_image_url && (
            <div>
              <p className="text-muted-foreground/60 text-xs font-bold tracking-wide uppercase">
                Resolved Image
              </p>
              <ImageLightbox
                src={complaint.resolved_image_url}
                alt="Resolved"
                className="border-border/50 mt-1 max-h-[50vh] w-full rounded-xl border bg-black/5 object-contain shadow-sm"
              />
            </div>
          )}
        </div>

        {showDisapproveConfirm && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="mb-1 text-sm font-bold text-red-800">Disapprove Complaint?</p>
            <p className="mb-3 text-xs text-red-700">
              This will permanently delete <strong>{complaint.title}</strong>. Any points awarded
              will be revoked. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDisapproveConfirm(false)}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all hover:bg-red-100"
                style={{ color: '#72796e' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  disapproveComplaint.mutate(complaint.id, {
                    onSuccess: () => setShowDisapproveConfirm(false),
                  });
                }}
                disabled={disapproveComplaint.isPending}
                className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-red-700 disabled:opacity-50"
              >
                {disapproveComplaint.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                {disapproveComplaint.isPending ? 'Removing...' : 'Yes, Delete Permanently'}
              </button>
            </div>
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2">
          {updateComplaint.isPending && (
            <span className="text-muted-foreground flex items-center gap-1 text-xs">
              <Loader2 className="h-3 w-3 animate-spin" />
              Saving...
            </span>
          )}
          <DialogClose asChild>
            <Button variant="outline" size="sm">
              Close
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </DialogRoot>
  );
}
