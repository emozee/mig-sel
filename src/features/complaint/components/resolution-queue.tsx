import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCheck, ImagePlus, Loader2, MapPin, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useResolutionQueue, type ResolutionReport } from '../api/use-resolution-queue';
import { useResolveComplaint } from '../api/use-resolve-complaint';

const ResolutionCard = ({ report }: { report: ResolutionReport }) => {
  const resolveComplaint = useResolveComplaint();
  const [afterPhoto, setAfterPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const clearPhoto = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setAfterPhoto(null);
    setPreviewUrl(null);
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setAfterPhoto(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleResolve = () => {
    if (!afterPhoto) return;
    resolveComplaint.mutate(
      { id: report.id, afterPhoto },
      {
        onSuccess: clearPhoto,
      },
    );
  };

  return (
    <article className="bg-card shadow-card overflow-hidden rounded-xl border">
      <div className="grid gap-0 sm:grid-cols-2">
        <div className="relative min-h-52 bg-slate-100">
          {report.image_url ? (
            <img
              src={report.image_url}
              alt={`Before: ${report.title}`}
              loading="lazy"
              className="h-full min-h-52 w-full object-cover"
            />
          ) : (
            <div className="text-muted-foreground flex min-h-52 items-center justify-center text-xs">
              No original photo
            </div>
          )}
          <span className="absolute top-3 left-3 rounded-full bg-black/65 px-2.5 py-1 text-[10px] font-bold tracking-wide text-white uppercase">
            Before
          </span>
        </div>

        <div className="relative min-h-52 bg-emerald-50">
          {previewUrl ? (
            <>
              <img
                src={previewUrl}
                alt="After photo preview"
                className="h-full min-h-52 w-full object-cover"
              />
              <button
                type="button"
                aria-label="Remove after photo"
                onClick={clearPhoto}
                className="absolute top-3 right-3 rounded-full bg-black/65 p-1.5 text-white hover:bg-black/80"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          ) : (
            <label className="text-muted-foreground flex min-h-52 cursor-pointer flex-col items-center justify-center gap-2 p-6 text-center text-xs hover:text-emerald-700">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm">
                <ImagePlus className="h-5 w-5" />
              </span>
              Upload the completed-work photo
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </label>
          )}
          <span className="absolute top-3 left-3 rounded-full bg-emerald-700/90 px-2.5 py-1 text-[10px] font-bold tracking-wide text-white uppercase">
            After
          </span>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-foreground text-sm font-bold">{report.title}</h2>
            {report.location && (
              <p className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
                <MapPin className="h-3 w-3" />
                {report.location}
              </p>
            )}
          </div>
          <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700 uppercase">
            In Progress
          </span>
        </div>
        {report.description && (
          <p className="text-muted-foreground mt-3 text-xs leading-relaxed">{report.description}</p>
        )}
        <div className="mt-4 flex items-center justify-between gap-3 border-t pt-4">
          <p className="text-muted-foreground text-xs">An after photo is required to resolve.</p>
          <Button
            type="button"
            size="sm"
            onClick={handleResolve}
            disabled={!afterPhoto || resolveComplaint.isPending}
          >
            {resolveComplaint.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCheck className="h-4 w-4" />
            )}
            {resolveComplaint.isPending ? 'Resolving...' : 'Mark Resolved'}
          </Button>
        </div>
      </div>
    </article>
  );
};

export const ResolutionQueue = () => {
  const { data: reports = [], isLoading, isError, error } = useResolutionQueue();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <AlertTriangle className="h-5 w-5 text-red-500" />
        <p className="text-sm font-semibold text-red-700">Failed to load the resolution queue</p>
        <p className="text-xs text-red-600">{error.message}</p>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="bg-card shadow-card flex flex-col items-center justify-center rounded-xl border px-6 py-16 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-50">
          <CheckCheck className="h-7 w-7 text-emerald-600" />
        </div>
        <p className="text-foreground text-sm font-semibold">No reports awaiting resolution</p>
        <p className="text-muted-foreground mt-1 text-xs">
          Approved in-progress reports will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <ResolutionCard key={report.id} report={report} />
      ))}
    </div>
  );
};
