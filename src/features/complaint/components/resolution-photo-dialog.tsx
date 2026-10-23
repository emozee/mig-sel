import { useState } from 'react';
import { CheckCircle2, Loader2, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DialogRoot,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';

interface ResolutionPhotoDialogProps {
  open: boolean;
  isSaving: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (file: File) => void;
}

export const ResolutionPhotoDialog = ({
  open,
  isSaving,
  onOpenChange,
  onConfirm,
}: ResolutionPhotoDialogProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const clearImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (isSaving) return;
    if (!nextOpen) clearImage();
    onOpenChange(nextOpen);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <DialogRoot open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogTitle>Upload an after photo</DialogTitle>
        <DialogDescription>
          Add a clear photo of the completed work. This photo will appear beside the original report
          image in the public feed.
        </DialogDescription>

        <div>
          <label className="text-muted-foreground text-xs font-bold tracking-wide uppercase">
            Completion proof (required)
          </label>
          <div className="mt-2">
            {imagePreview ? (
              <div className="border-border relative overflow-hidden rounded-xl border">
                <img
                  src={imagePreview}
                  alt="After photo preview"
                  className="max-h-72 w-full object-contain"
                />
                <button
                  type="button"
                  aria-label="Remove after photo"
                  onClick={clearImage}
                  disabled={isSaving}
                  className="absolute top-2 right-2 rounded-full bg-black/65 p-1.5 text-white hover:bg-black/80 disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="border-border text-muted-foreground hover:border-primary hover:text-primary flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-10 text-sm transition-colors">
                <span className="bg-primary/10 flex h-11 w-11 items-center justify-center rounded-full">
                  <Upload className="h-5 w-5" />
                </span>
                Choose after photo
                <span className="text-[11px]">JPEG, PNG, WebP, or GIF up to 10 MB</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!selectedFile || isSaving}
            onClick={() => selectedFile && onConfirm(selectedFile)}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            {isSaving ? 'Resolving...' : 'Upload Photo & Resolve'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
};
