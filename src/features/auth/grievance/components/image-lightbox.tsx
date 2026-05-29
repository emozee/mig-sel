import { useState, useCallback } from 'react';
import { X, Maximize2, Minimize2 } from 'lucide-react';

interface ImageLightboxProps {
  src: string;
  alt?: string;
  className?: string;
}

export function ImageLightbox({ src, alt, className }: ImageLightboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleFullscreenToggle = useCallback(() => {
    const el = document.getElementById('lightbox-img');
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
  }, []);

  return (
    <>
      <img
        src={src}
        alt={alt ?? ''}
        loading="lazy"
        onClick={() => setIsOpen(true)}
        className={`cursor-pointer ${className ?? ''}`}
      />

      {isOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={() => {
            if (document.fullscreenElement) {
              document.exitFullscreen();
              setIsFullscreen(false);
            }
            setIsOpen(false);
          }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (document.fullscreenElement) {
                document.exitFullscreen();
                setIsFullscreen(false);
              }
              setIsOpen(false);
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
            id="lightbox-img"
            src={src}
            alt={alt ?? ''}
            onClick={(e) => {
              e.stopPropagation();
              handleFullscreenToggle();
            }}
            className="max-h-screen max-w-screen cursor-zoom-in object-contain transition-transform"
          />
        </div>
      )}
    </>
  );
}
