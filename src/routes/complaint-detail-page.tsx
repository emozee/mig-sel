import { useState, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  MoveRight,
  Upload,
  Loader2,
  X,
  Save,
  Trophy,
  Menu,
  UserCheck,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DashboardSidebar } from '@/components/layout/dashboard-sidebar';
import { useComplaint } from '@/features/complaint/api/use-complaint';
import { useUpdateComplaint } from '@/features/complaint/api/use-update-complaint';
import { useApproveComplaint } from '@/features/complaint/api/use-approve-complaint';
import { useDisapproveComplaint } from '@/features/complaint/api/use-disapprove-complaint';
import { uploadGrievanceImage } from '@/features/auth/grievance/components/use-upload-image';
import { ImageLightbox } from '@/features/auth/grievance/components/image-lightbox';
import {
  URGENCY_BADGE_WITH_HOVER as URGENCY_BADGE,
  STATUS_BADGE,
  STATUS_LABELS,
  URGENCY_LABELS,
  CATEGORY_LABELS,
  STATUS_URGENCY_ORDER,
  STATUS_ORDER,
} from '@/features/complaint/constants';
import { Field } from '@/components/ui/field';
import { useClickOutside } from '@/hooks/use-click-outside';
import type { ComplaintStatus, ComplaintUrgency } from '@/features/complaint/types';

export const ComplaintDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: complaint, isLoading, error } = useComplaint(id ?? '');
  const updateComplaint = useUpdateComplaint();
  const approveComplaint = useApproveComplaint();
  const disapproveComplaint = useDisapproveComplaint();

  const [urgencyOpen, setUrgencyOpen] = useState(false);
  const [showDisapproveConfirm, setShowDisapproveConfirm] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<ComplaintStatus | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const urgencyRef = useRef<HTMLDivElement>(null);

  useClickOutside(urgencyRef, () => setUrgencyOpen(false));

  const handleSidebarNavigate = () => {
    navigate('/dashboard');
    setSidebarOpen(false);
  };

  if (isLoading) {
    return (
      <div className="bg-muted flex min-h-screen">
        <DashboardSidebar activeView="complaint" onNavigate={handleSidebarNavigate} />
        <div className="flex flex-1 items-center justify-center md:ml-60">
          <p className="text-muted-foreground text-sm">Loading complaint...</p>
        </div>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="bg-muted flex min-h-screen">
        <DashboardSidebar activeView="complaint" onNavigate={handleSidebarNavigate} />
        <div className="flex flex-1 flex-col md:ml-60">
          <main className="flex-1 overflow-auto">
            <div className="mx-auto px-4 py-6 sm:px-6 lg:px-8" style={{ maxWidth: '1200px' }}>
              <Button variant="outline" size="sm" asChild>
                <Link to="/dashboard">
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Back to Dashboard
                </Link>
              </Button>
              <Card className="mt-6">
                <CardContent className="py-12 text-center">
                  <p className="text-destructive text-sm">Failed to load complaint.</p>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const c = complaint;

  const handleUrgencyChange = (urgency: ComplaintUrgency) => {
    setUrgencyOpen(false);
    updateComplaint.mutate({ id: c.id, urgency });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
  };

  const handleStatusSave = async () => {
    if (!selectedStatus) return;
    setIsSaving(true);
    try {
      let resolvedImageUrl: string | null = null;
      if (selectedFile) {
        resolvedImageUrl = await uploadGrievanceImage(selectedFile);
      }
      updateComplaint.mutate(
        { id: c.id, status: selectedStatus, resolved_image_url: resolvedImageUrl },
        {
          onSettled: () => {
            setIsSaving(false);
            setSelectedStatus(null);
            clearImage();
          },
        },
      );
    } catch {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-muted flex min-h-screen">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <DashboardSidebar
        activeView="complaint"
        onNavigate={handleSidebarNavigate}
        isMobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />

      <div className="flex flex-1 flex-col md:ml-60">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-white px-4 md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="hover:bg-accent rounded-lg p-1.5 transition-all"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-bold tracking-tight">{complaint.title}</h1>
            <p className="text-muted-foreground/70 truncate text-xs">Complaint Details</p>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div
            className="animate-fade-in mx-auto space-y-6 px-4 py-6 sm:px-6 lg:px-8"
            style={{ maxWidth: '1200px' }}
          >
            <Button variant="outline" size="sm" asChild>
              <Link to="/dashboard?view=complaint">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back to Complaint Monitoring
              </Link>
            </Button>

            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-foreground text-2xl font-bold tracking-tight">
                  {complaint.title}
                </h1>
                <p className="text-muted-foreground/70 mt-1 text-sm">
                  Reported on{' '}
                  {new Date(complaint.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {/* Approval status */}
                {complaint.approved ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700 shadow-sm">
                    <CheckCircle2 className="h-3 w-3" />
                    Approved
                  </span>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => approveComplaint.mutate(complaint.id)}
                      disabled={approveComplaint.isPending}
                      className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 shadow-sm transition-all hover:bg-amber-100 disabled:opacity-50"
                    >
                      <UserCheck className="h-3 w-3" />
                      {approveComplaint.isPending ? 'Approving...' : 'Approve'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDisapproveConfirm(true)}
                      disabled={disapproveComplaint.isPending}
                      className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-700 shadow-sm transition-all hover:bg-red-100 disabled:opacity-50"
                      title="Permanently delete this report"
                    >
                      <Trash2 className="h-3 w-3" />
                      {disapproveComplaint.isPending ? 'Removing...' : 'Disapprove'}
                    </button>
                  </>
                )}
                {/* Urgency dropdown */}
                <div ref={urgencyRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setUrgencyOpen(!urgencyOpen)}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold tracking-wide uppercase shadow-sm transition-all hover:opacity-90"
                    style={{
                      backgroundColor: URGENCY_BADGE[complaint.urgency]?.text,
                      color: '#fff',
                    }}
                    title="Click to change urgency"
                  >
                    {URGENCY_LABELS[complaint.urgency]}
                  </button>
                  {urgencyOpen && (
                    <div className="border-border/50 bg-card absolute right-0 z-50 mt-2 w-40 overflow-hidden rounded-xl border shadow-xl">
                      {STATUS_URGENCY_ORDER.map((u) => (
                        <button
                          key={u}
                          type="button"
                          onClick={() => handleUrgencyChange(u)}
                          className="flex w-full items-center gap-2 px-4 py-2.5 text-xs font-bold tracking-wide uppercase transition-colors"
                          style={{
                            backgroundColor:
                              u === complaint.urgency ? URGENCY_BADGE[u].text : 'transparent',
                            color: u === complaint.urgency ? '#fff' : URGENCY_BADGE[u].text,
                          }}
                          onMouseEnter={(e) => {
                            if (u !== complaint.urgency) {
                              e.currentTarget.style.backgroundColor = URGENCY_BADGE[u].hoverBg;
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (u !== complaint.urgency) {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }
                          }}
                        >
                          {URGENCY_LABELS[u]}
                          {u === complaint.urgency && (
                            <span className="ml-auto text-[10px] opacity-70">Current</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Status badge (read-only at top) */}
                <span
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold tracking-wide uppercase shadow-sm"
                  style={{
                    backgroundColor: STATUS_BADGE[complaint.status]?.bg,
                    color: STATUS_BADGE[complaint.status]?.text,
                  }}
                >
                  {complaint.status === 'pending' ? (
                    <Clock className="h-3 w-3" />
                  ) : complaint.status === 'resolved' ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <MoveRight className="h-3 w-3" />
                  )}
                  {STATUS_LABELS[complaint.status]}
                </span>
              </div>
            </div>

            {complaint.image_url && (
              <div className="border-border/50 overflow-hidden rounded-xl border bg-black/5 shadow-sm">
                <ImageLightbox
                  src={complaint.image_url}
                  alt="Complaint"
                  className="w-full object-contain"
                />
              </div>
            )}

            <Card>
              <CardContent className="space-y-6 p-6">
                <Field label="Description">
                  <p className="leading-relaxed">{complaint.description}</p>
                </Field>

                <div className="grid grid-cols-3 gap-6">
                  <Field label="Category">
                    <span>{CATEGORY_LABELS[complaint.category]}</span>
                  </Field>
                  <Field label="Urgency">
                    <span>{URGENCY_LABELS[complaint.urgency]}</span>
                  </Field>
                  <Field label="Status">
                    <span>{STATUS_LABELS[complaint.status]}</span>
                  </Field>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <Field label="Latitude">
                    <span className="font-mono text-xs">{complaint.latitude}</span>
                  </Field>
                  <Field label="Longitude">
                    <span className="font-mono text-xs">{complaint.longitude}</span>
                  </Field>
                  <Field label="Location">
                    <span>{complaint.location ?? '—'}</span>
                  </Field>
                </div>

                {complaint.resolved_image_url && (
                  <div>
                    <label className="text-muted-foreground/60 text-xs font-bold tracking-wide uppercase">
                      Resolved Image
                    </label>
                    <ImageLightbox
                      src={complaint.resolved_image_url}
                      alt="Resolved"
                      className="border-border/50 mt-1 w-full rounded-xl border bg-black/5 object-contain shadow-sm"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Points info */}
            <Card>
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
                    <Trophy className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-foreground text-sm font-bold tracking-tight">
                      Points Earned
                    </h2>
                    <p className="text-muted-foreground/70 text-xs">
                      Points awarded to the reporter for this complaint
                    </p>
                  </div>
                </div>
                {(() => {
                  const hasInProgress =
                    complaint.status === 'in-progress' || complaint.status === 'resolved';
                  const hasResolved = complaint.status === 'resolved';
                  return (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                        <p className="text-[10px] font-bold tracking-wide text-gray-400 uppercase">
                          Submission
                        </p>
                        <div className="mt-1 flex items-center gap-1.5">
                          <Upload className="h-4 w-4 text-green-600" />
                          <span className="text-lg font-bold text-green-700">+1</span>
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                        </div>
                      </div>
                      <div
                        className={`rounded-lg border p-3 ${hasInProgress ? 'border-green-200 bg-green-50' : selectedStatus === 'in-progress' ? 'border-amber-200 bg-amber-50' : 'border-gray-200 bg-gray-50'}`}
                      >
                        <p className="text-[10px] font-bold tracking-wide text-gray-400 uppercase">
                          In Progress
                        </p>
                        <div className="mt-1 flex items-center gap-1.5">
                          <MoveRight
                            className={`h-4 w-4 ${hasInProgress ? 'text-green-600' : selectedStatus === 'in-progress' ? 'text-amber-600' : 'text-gray-400'}`}
                          />
                          <span
                            className={`text-lg font-bold ${hasInProgress ? 'text-green-700' : selectedStatus === 'in-progress' ? 'text-amber-700' : 'text-gray-400'}`}
                          >
                            +1
                          </span>
                          {hasInProgress ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                          ) : selectedStatus === 'in-progress' ? (
                            <span className="text-[10px] font-semibold text-amber-600">
                              Pending
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div
                        className={`rounded-lg border p-3 ${hasResolved ? 'border-green-200 bg-green-50' : selectedStatus === 'resolved' ? 'border-amber-200 bg-amber-50' : 'border-gray-200 bg-gray-50'}`}
                      >
                        <p className="text-[10px] font-bold tracking-wide text-gray-400 uppercase">
                          Resolved
                        </p>
                        <div className="mt-1 flex items-center gap-1.5">
                          <CheckCircle2
                            className={`h-4 w-4 ${hasResolved ? 'text-green-600' : selectedStatus === 'resolved' ? 'text-amber-600' : 'text-gray-400'}`}
                          />
                          <span
                            className={`text-lg font-bold ${hasResolved ? 'text-green-700' : selectedStatus === 'resolved' ? 'text-amber-700' : 'text-gray-400'}`}
                          >
                            +2
                          </span>
                          {hasResolved ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                          ) : selectedStatus === 'resolved' ? (
                            <span className="text-[10px] font-semibold text-amber-600">
                              Pending
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {(() => {
                  const statusPoints: Record<string, number> = {
                    pending: 1,
                    'in-progress': 2,
                    resolved: 4,
                  };
                  const total = statusPoints[complaint.status] ?? 1;
                  return (
                    <p
                      className="mt-3 border-t pt-3 text-xs"
                      style={{ color: total === 4 ? '#16a34a' : '#6b7280' }}
                    >
                      {total === 4 ? (
                        <>
                          <CheckCircle2 className="mr-1 inline h-3.5 w-3.5 text-green-600" />
                          Max <strong>4 points</strong> awarded for this complaint.
                        </>
                      ) : (
                        <>
                          Currently <strong>{total} / 4</strong> points awarded. Select a new status
                          above to adjust.
                        </>
                      )}
                    </p>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Resolve section at bottom */}
            <Card>
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-2">
                  <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-lg">
                    <Save className="text-primary-foreground h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-foreground text-sm font-bold tracking-tight">
                      Resolve Complaint
                    </h2>
                    <p className="text-muted-foreground/70 text-xs">
                      Update the status and attach a resolution image
                    </p>
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="text-muted-foreground/60 text-xs font-bold tracking-wide uppercase">
                      New Status
                    </label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {STATUS_ORDER.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSelectedStatus(s)}
                          className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold tracking-wide uppercase shadow-sm transition-all hover:scale-105"
                          style={{
                            backgroundColor: selectedStatus === s ? STATUS_BADGE[s].bg : '#f3f4f6',
                            color: selectedStatus === s ? STATUS_BADGE[s].text : '#6b7280',
                            outline:
                              selectedStatus === s
                                ? `2px solid ${STATUS_BADGE[s].text}`
                                : undefined,
                            outlineOffset: 2,
                          }}
                        >
                          {s === 'pending' ? (
                            <Clock className="h-3.5 w-3.5" />
                          ) : s === 'resolved' ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          ) : (
                            <MoveRight className="h-3.5 w-3.5" />
                          )}
                          {STATUS_LABELS[s]}
                        </button>
                      ))}
                    </div>
                    {selectedStatus && selectedStatus !== complaint.status && (
                      <p className="mt-2 text-xs text-amber-600">
                        <Trophy className="mr-1 inline h-3 w-3" />
                        Update to <strong>{STATUS_LABELS[selectedStatus]}</strong> will adjust the
                        reporter's points accordingly
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-muted-foreground/60 text-xs font-bold tracking-wide uppercase">
                      Resolved Image (optional)
                    </label>
                    <div className="mt-2">
                      {imagePreview ? (
                        <div className="border-border/50 relative overflow-hidden rounded-lg border">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="aspect-square w-full rounded-lg object-cover"
                          />
                          <button
                            type="button"
                            onClick={clearImage}
                            className="absolute top-1 right-1 rounded-full bg-black/50 p-1 text-white transition-colors hover:bg-black/70"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <label className="border-border/50 text-muted-foreground/60 hover:border-muted-foreground/30 hover:text-muted-foreground/80 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed px-3 py-4 text-xs transition-colors">
                          <Upload className="h-4 w-4" />
                          Click to upload image
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-border/50 mt-6 flex items-center justify-end gap-2 border-t pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStatus(null);
                      clearImage();
                    }}
                    className="text-muted-foreground/60 hover:bg-accent hover:text-foreground rounded-lg px-4 py-2 text-xs font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleStatusSave}
                    disabled={!selectedStatus || isSaving}
                    className="bg-primary text-primary-foreground inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {isSaving && <Loader2 className="h-3 w-3 animate-spin" />}
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>

          {showDisapproveConfirm && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
              onClick={() => setShowDisapproveConfirm(false)}
            >
              <div
                className="mx-4 w-full max-w-sm rounded-xl border bg-white p-6 shadow-xl"
                onClick={(e) => e.stopPropagation()}
                style={{ borderColor: '#e5e2e1' }}
              >
                <h3 className="mb-2 text-sm font-bold" style={{ color: '#1c1b1b' }}>
                  Disapprove Complaint?
                </h3>
                <p className="mb-1 text-xs" style={{ color: '#72796e' }}>
                  This will permanently delete{' '}
                  <span className="font-semibold" style={{ color: '#42493e' }}>
                    {complaint.title}
                  </span>
                  . Any points awarded will be revoked. This action cannot be undone.
                </p>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDisapproveConfirm(false)}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all hover:bg-gray-100"
                    style={{ color: '#72796e' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      disapproveComplaint.mutate(complaint.id, {
                        onSuccess: () => navigate('/dashboard'),
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
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
