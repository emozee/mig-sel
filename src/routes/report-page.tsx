import { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { ArrowLeft, MapPin, Camera, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useGeoLocation } from '@/features/auth/grievance/hooks/use-geo-location';
import { uploadGrievanceImage } from '@/features/auth/grievance/components/use-upload-image';
import { useCreateGrievance } from '@/features/auth/grievance/components/use-create-grievance';
import { useCurrentUser } from '@/features/auth/api/use-current-user';
import { checkNearbyGrievances } from '@/features/auth/grievance/api/check-nearby-grievances';
import type { NearbyGrievance } from '@/features/auth/grievance/api/check-nearby-grievances';
import { classifyGrievanceImage } from '@/features/auth/grievance/api/classify-grievance-image';
import type { ClassificationResult } from '@/features/auth/grievance/api/classify-grievance-image';
import {
  findDuplicateImage,
  computeFileHash,
} from '@/features/auth/grievance/api/find-duplicate-image';
import type { DuplicateImageResult } from '@/features/auth/grievance/api/find-duplicate-image';
import { ImageLightbox } from '@/features/auth/grievance/components/image-lightbox';
import { MapDock } from '@/components/layout/map-dock';

const CATEGORIES = [
  { value: 'road', label: 'Road Damage' },
  { value: 'garbage', label: 'Waste Management' },
  { value: 'lighting', label: 'Street Lighting' },
  { value: 'drainage', label: 'Drainage/Sewage' },
  { value: 'other', label: 'Other' },
] as const;

export const ReportPage = () => {
  const navigate = useNavigate();
  const { coords: gpsCoords, error: geoError, loading: geoLoading } = useGeoLocation();
  const { user } = useCurrentUser();
  const [isUploading, setIsUploading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showNearbyDialog, setShowNearbyDialog] = useState(false);
  const [nearbyGrievances, setNearbyGrievances] = useState<NearbyGrievance[]>([]);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const mutation = useCreateGrievance();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('other');
  const [showSpamDialog, setShowSpamDialog] = useState(false);
  const [classificationResult, setClassificationResult] = useState<ClassificationResult | null>(
    null,
  );
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);
  const [fileHash, setFileHash] = useState<string | null>(null);
  const [showDuplicateImageDialog, setShowDuplicateImageDialog] = useState(false);
  const [duplicateImages, setDuplicateImages] = useState<DuplicateImageResult[]>([]);

  const createGrievance = async (imageUrl: string) => {
    await mutation.mutateAsync({
      title: title || 'Community Report',
      description: description || '',
      category: category || 'other',
      latitude: gpsCoords!.lat,
      longitude: gpsCoords!.lng,
      image_url: imageUrl,
      reporter_id: user?.id ?? null,
      image_hash: fileHash ?? undefined,
    });
  };

  const doSubmit = async () => {
    setMessage(null);

    if (!selectedFile) {
      setMessage({ type: 'error', text: 'Please upload a photo to submit a report' });
      return;
    }

    if (!gpsCoords) {
      setMessage({ type: 'error', text: 'Location not available. Please wait for GPS detection.' });
      return;
    }

    setIsChecking(true);

    try {
      const nearby = await checkNearbyGrievances(gpsCoords.lat, gpsCoords.lng, 10, category);

      if (nearby.length > 0) {
        setNearbyGrievances(nearby);
        setShowNearbyDialog(true);
        return;
      }
    } catch (err) {
      console.error('Nearby check failed, proceeding without warning:', err);
    }

    if (fileHash) {
      try {
        const dup = await findDuplicateImage(fileHash, gpsCoords.lat, gpsCoords.lng, 10);

        if (dup.length > 0) {
          setDuplicateImages(dup);
          setShowDuplicateImageDialog(true);
          return;
        }
      } catch (err) {
        console.error('Duplicate image check failed, proceeding without warning:', err);
      }
    }

    setIsChecking(false);
    await doUploadClassifyAndCreate();
  };

  const doUploadClassifyAndCreate = async () => {
    setIsUploading(true);

    try {
      const imageUrl = await uploadGrievanceImage(selectedFile!);

      const result = await classifyGrievanceImage(imageUrl);

      const isDefinitelySpam =
        !result.is_grievance &&
        result.top_label !== 'unknown' &&
        result.top_label !== 'error' &&
        result.top_label !== 'loading' &&
        !result.error;

      if (isDefinitelySpam) {
        setClassificationResult(result);
        setPendingImageUrl(imageUrl);
        setShowSpamDialog(true);
        return;
      }

      await createGrievance(imageUrl);

      setMessage({ type: 'success', text: 'Report submitted to GMC successfully!' });
      setTimeout(() => navigate('/map'), 1500);
    } catch (error) {
      const messageText =
        error && typeof error === 'object' && 'message' in error
          ? String((error as { message: string }).message)
          : 'Failed to submit. Please try again.';
      toast.error(messageText);
      if (error && typeof error === 'object' && 'message' in error) {
        setMessage({ type: 'error', text: String((error as { message: string }).message) });
      } else {
        setMessage({ type: 'error', text: 'Failed to submit. Please try again.' });
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.[0]) return;
    if (files[0].size > 10 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File is too large. Maximum size is 10MB.' });
      e.target.value = '';
      return;
    }
    setMessage(null);
    setSelectedFile(files[0]);
    setFileHash(null);
    computeFileHash(files[0])
      .then(setFileHash)
      .catch(() => {
        /* hash is best-effort */
      });
  };

  return (
    <div className="bg-background flex h-dvh flex-col overflow-hidden font-sans">
      <header className="border-border flex h-14 shrink-0 items-center gap-3 border-b px-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold">New Report</h1>
      </header>

      <div className="flex-1 overflow-y-auto pb-24">
        <div className="mx-auto max-w-lg p-4 md:p-6">
          <form
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              doSubmit();
            }}
          >
            <div className="bg-surface-container border-outline-variant flex items-center gap-3 rounded-lg border p-3">
              <MapPin className="text-primary h-5 w-5 shrink-0" />
              <div className="text-body-sm">
                <p className="font-bold">Your Location</p>
                <p className="text-muted-foreground">
                  {geoError
                    ? geoError
                    : gpsCoords
                      ? `${gpsCoords.lat.toFixed(5)}, ${gpsCoords.lng.toFixed(5)}`
                      : geoLoading
                        ? 'Detecting your location...'
                        : 'Location unavailable'}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-label-sm text-muted-foreground font-bold uppercase">
                Title <span className="text-muted-foreground/50">(optional)</span>
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="border-outline bg-background focus:ring-primary w-full rounded-lg border p-3 outline-none focus:ring-2"
                placeholder="Brief title for the report"
              />
            </div>

            <div className="space-y-2">
              <label className="text-label-sm text-muted-foreground font-bold uppercase">
                Category <span className="text-muted-foreground/50">(optional)</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="border-outline bg-background focus:ring-primary w-full rounded-lg border p-3 outline-none focus:ring-2"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-label-sm text-muted-foreground font-bold uppercase">
                Description <span className="text-muted-foreground/50">(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="border-outline focus:ring-primary h-24 w-full rounded-lg border p-3 outline-none focus:ring-2"
                placeholder="Describe the issue (optional)"
              />
            </div>

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="space-y-2">
              <label className="text-label-sm text-muted-foreground font-bold uppercase">
                Photo <span className="text-destructive">*</span>
              </label>
              <div
                onClick={() => cameraInputRef.current?.click()}
                className="border-primary hover:bg-primary/5 flex cursor-pointer flex-col items-center justify-center space-y-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors"
              >
                <Camera className="text-primary h-7 w-7" />
                <p className="text-label-sm text-primary font-semibold">
                  {selectedFile ? selectedFile.name : 'Take a photo'}
                </p>
                <p className="text-body-xs text-muted-foreground">Use your device camera</p>
              </div>
            </div>

            {message && (
              <div
                className={`flex items-center gap-2 rounded-lg p-3 text-sm font-medium ${
                  message.type === 'success'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0" />
                )}
                {message.text}
              </div>
            )}

            <DialogRoot open={showNearbyDialog} onOpenChange={setShowNearbyDialog}>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>Nearby reports found</DialogTitle>
                  <DialogDescription>
                    {nearbyGrievances.length}{' '}
                    {nearbyGrievances.length === 1 ? 'report is' : 'reports are'} already submitted
                    within 10m of your location.
                  </DialogDescription>
                </DialogHeader>

                <div className="max-h-48 space-y-2 overflow-y-auto">
                  {nearbyGrievances.map((g) => (
                    <div
                      key={g.id}
                      className="border-outline-variant flex items-start gap-3 rounded-lg border p-2 text-sm"
                    >
                      {g.image_url && (
                        <ImageLightbox
                          src={g.image_url}
                          className="h-10 w-10 shrink-0 rounded object-cover"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{g.title}</p>
                        <p className="text-muted-foreground text-xs">
                          {g.distance_meters.toFixed(1)}m away &middot; {g.category}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowNearbyDialog(false);
                      setNearbyGrievances([]);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => {
                      setShowNearbyDialog(false);
                      setNearbyGrievances([]);
                      doUploadClassifyAndCreate();
                    }}
                  >
                    Submit anyway
                  </Button>
                </DialogFooter>
              </DialogContent>
            </DialogRoot>

            <DialogRoot open={showDuplicateImageDialog} onOpenChange={setShowDuplicateImageDialog}>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>Same photo already submitted</DialogTitle>
                  <DialogDescription>
                    This exact photo was already used for{' '}
                    {duplicateImages.length === 1
                      ? 'a report'
                      : `${duplicateImages.length} reports`}{' '}
                    within 10m of your location. You can still submit — an admin will review it.
                  </DialogDescription>
                </DialogHeader>

                <div className="max-h-36 space-y-2 overflow-y-auto">
                  {duplicateImages.map((d) => (
                    <div
                      key={d.id}
                      className="border-outline-variant flex items-start gap-3 rounded-lg border p-2 text-sm"
                    >
                      {d.image_url && (
                        <ImageLightbox
                          src={d.image_url}
                          className="h-10 w-10 shrink-0 rounded object-cover"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{d.title}</p>
                        <p className="text-muted-foreground text-xs">
                          {d.distance_meters.toFixed(1)}m away &middot; {d.category}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDuplicateImageDialog(false);
                      setDuplicateImages([]);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="default"
                    onClick={async () => {
                      setShowDuplicateImageDialog(false);
                      setDuplicateImages([]);
                      await doUploadClassifyAndCreate();
                    }}
                  >
                    Submit anyway
                  </Button>
                </DialogFooter>
              </DialogContent>
            </DialogRoot>

            <DialogRoot open={showSpamDialog} onOpenChange={setShowSpamDialog}>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>Photo may not show an issue</DialogTitle>
                  <DialogDescription>
                    Our AI analysis suggests this photo may not show a valid civic issue
                    {classificationResult ? (
                      <>
                        {' '}
                        (detected as: <strong>{classificationResult.top_label}</strong>)
                      </>
                    ) : null}
                    . You can still submit — an admin will review it.
                  </DialogDescription>
                </DialogHeader>

                <div className="text-muted-foreground space-y-1 text-xs">
                  {classificationResult?.scores &&
                    Object.entries(classificationResult.scores)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 3)
                      .map(([label, score]) => (
                        <div key={label} className="flex items-center justify-between">
                          <span className="truncate">{label}</span>
                          <span className="ml-2 shrink-0 font-mono">
                            {(score * 100).toFixed(0)}%
                          </span>
                        </div>
                      ))}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowSpamDialog(false);
                      setClassificationResult(null);
                      setPendingImageUrl(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="default"
                    onClick={async () => {
                      setShowSpamDialog(false);
                      setIsUploading(true);
                      try {
                        await createGrievance(pendingImageUrl!);
                        setMessage({
                          type: 'success',
                          text: 'Report submitted to GMC successfully!',
                        });
                        setTimeout(() => navigate('/map'), 1500);
                      } catch (error) {
                        const messageText =
                          error && typeof error === 'object' && 'message' in error
                            ? String((error as { message: string }).message)
                            : 'Failed to submit. Please try again.';
                        toast.error(messageText);
                        setMessage({ type: 'error', text: messageText });
                      } finally {
                        setIsUploading(false);
                        setPendingImageUrl(null);
                        setClassificationResult(null);
                      }
                    }}
                  >
                    Submit anyway
                  </Button>
                </DialogFooter>
              </DialogContent>
            </DialogRoot>

            <Button
              disabled={isUploading || isChecking || !selectedFile}
              type="submit"
              className="bg-primary text-primary-foreground h-12 w-full rounded-lg font-bold shadow-lg"
            >
              {isChecking ? 'Checking nearby...' : isUploading ? 'Submitting...' : 'Submit Report'}
            </Button>
          </form>
        </div>
      </div>

      <MapDock />
    </div>
  );
};
