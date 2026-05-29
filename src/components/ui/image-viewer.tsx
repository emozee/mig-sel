import { useState } from 'react';
import { X } from 'lucide-react';
import { DialogRoot, DialogContent } from '@/components/ui/dialog';

export function ClickableImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <img
        src={src}
        alt={alt}
        className={`cursor-pointer ${className ?? ''}`}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
      />
      <DialogRoot open={open} onOpenChange={setOpen}>
        <DialogContent className="!inset-0 !top-0 !left-0 flex h-dvh w-full max-w-full !translate-x-0 !translate-y-0 !items-center !justify-center !rounded-none !border-0 !bg-emerald-950/95 !p-0 sm:max-w-full">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }}
            className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white/80 transition-colors hover:bg-white/30"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={src}
            alt={alt}
            className="max-h-[90vh] max-w-[95vw] rounded-lg object-contain"
          />
        </DialogContent>
      </DialogRoot>
    </>
  );
}
