import { useState } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  FileText,
  MapPin,
  Clock,
  MoveRight,
  CheckCheck,
  X,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useMyReports } from '@/features/complaint/api/use-my-reports';

const statusIcon = {
  submitted: Clock,
  in_progress: MoveRight,
  resolved: CheckCheck,
} as const;

const statusColors = {
  submitted: 'bg-gray-100 text-gray-600',
  in_progress: 'bg-amber-50 text-amber-700',
  resolved: 'bg-green-50 text-green-700',
} as const;

const PAGE_SIZE = 6;

function ImagePreview({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleFullscreenToggle = () => {
    const el = document.getElementById('preview-img');
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(() => {});
    } else {
      document
        .exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(() => {});
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={() => {
        if (document.fullscreenElement) document.exitFullscreen();
        setIsFullscreen(false);
        onClose();
      }}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (document.fullscreenElement) document.exitFullscreen();
          setIsFullscreen(false);
          onClose();
        }}
        className="absolute top-4 right-4 z-10 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
        aria-label="Close"
      >
        <X className="h-6 w-6" />
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleFullscreenToggle();
        }}
        className="absolute top-4 right-16 z-10 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
        aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
      >
        {isFullscreen ? <Minimize2 className="h-6 w-6" /> : <Maximize2 className="h-6 w-6" />}
      </button>
      <img
        id="preview-img"
        src={src}
        alt={alt}
        loading="lazy"
        onClick={(e) => {
          e.stopPropagation();
          handleFullscreenToggle();
        }}
        className="max-h-screen max-w-screen cursor-zoom-in object-contain"
      />
    </div>
  );
}

export const ProfileReportsPage = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [previewImage, setPreviewImage] = useState<{ src: string; alt: string } | null>(null);
  const { data, isLoading } = useMyReports(page, PAGE_SIZE);
  const reports = data?.reports ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 0;

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Profile
          </Button>
        </div>

        <div className="mb-6">
          <h1 className="text-foreground text-2xl font-bold">My Reports</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {total} {total === 1 ? 'report' : 'reports'} submitted
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="border-primary/20 border-t-primary h-8 w-8 animate-spin rounded-full border-4" />
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-card shadow-card flex flex-col items-center justify-center rounded-xl border px-6 py-16">
            <div className="bg-muted mb-4 flex h-14 w-14 items-center justify-center rounded-xl">
              <FileText className="text-muted-foreground/50 h-7 w-7" />
            </div>
            <p className="text-foreground text-sm font-semibold">No reports yet</p>
            <p className="text-muted-foreground mt-1 text-xs">
              Submit a complaint from the map to get started
            </p>
            <Button onClick={() => navigate('/map')} size="sm" className="mt-4 font-bold">
              Go to map
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {reports.map((report) => {
                const Icon = statusIcon[report.status as keyof typeof statusIcon] ?? FileText;
                const imageUrl = report.image_url;
                return (
                  <div
                    key={report.id}
                    className="bg-card shadow-card w-full rounded-xl border p-4 text-left"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="bg-primary/10 flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (report.latitude && report.longitude) {
                            navigate(`/map?lat=${report.latitude}&lng=${report.longitude}`);
                          }
                        }}
                        title="View on map"
                      >
                        <MapPin className="text-primary h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-foreground text-sm font-semibold">{report.title}</p>
                          <span
                            className={cn(
                              'flex shrink-0 cursor-pointer items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold',
                              statusColors[report.status as keyof typeof statusColors] ??
                                'bg-blue-50 text-blue-700',
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (imageUrl) {
                                setPreviewImage({ src: imageUrl, alt: report.title });
                              }
                            }}
                            title="View image"
                          >
                            <Icon className="h-3 w-3" />
                            {report.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-muted-foreground mt-0.5 text-xs">
                          {new Date(report.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                        {report.description && (
                          <p className="text-muted-foreground mt-2 line-clamp-2 text-xs leading-relaxed">
                            {report.description}
                          </p>
                        )}
                      </div>
                    </div>
                    {imageUrl && (
                      <div
                        className="mt-2 cursor-pointer overflow-hidden rounded-lg border"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewImage({ src: imageUrl, alt: report.title });
                        }}
                      >
                        <img
                          src={imageUrl}
                          alt={report.title}
                          loading="lazy"
                          className="max-h-48 w-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Button
                    key={p}
                    variant={p === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPage(p)}
                    className="min-w-[36px]"
                  >
                    {p}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}

        {previewImage && (
          <ImagePreview
            src={previewImage.src}
            alt={previewImage.alt}
            onClose={() => setPreviewImage(null)}
          />
        )}
      </div>
    </div>
  );
};
