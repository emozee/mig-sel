import { Dialog as DialogPrimitive } from 'radix-ui';
import { X, Map, Satellite, Grid3x3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MapFilters, MapStyleOption, TimeframeOption } from '../hooks/use-map-filters';

interface FilterLayersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: MapFilters;
  onMapStyleChange: (style: MapStyleOption) => void;
  onShowResolvedChange: (show: boolean) => void;
  onTimeframeChange: (timeframe: TimeframeOption) => void;
}

const MAP_STYLE_OPTIONS: { key: MapStyleOption; label: string; icon: typeof Map }[] = [
  { key: 'standard', label: 'Standard View', icon: Map },
  { key: 'satellite', label: 'Satellite View', icon: Satellite },
  { key: 'infrastructure', label: 'Infrastructure View', icon: Grid3x3 },
];

const TIMEFRAMES: { key: TimeframeOption; label: string }[] = [
  { key: 'all', label: 'All Time' },
  { key: '24h', label: 'Past 24 Hours' },
  { key: 'week', label: 'This Week' },
];

export function FilterLayersSheet({
  open,
  onOpenChange,
  filters,
  onMapStyleChange,
  onShowResolvedChange,
  onTimeframeChange,
}: FilterLayersSheetProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            'fixed bottom-0 left-1/2 z-50 w-[95%] max-w-xl -translate-x-1/2',
            'bg-card flex max-h-[70vh] flex-col rounded-t-3xl shadow-2xl',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'duration-300',
          )}
        >
          <div className="flex justify-center pt-3 pb-1">
            <div className="bg-muted-foreground/30 h-1 w-10 rounded-full" />
          </div>

          <div className="flex items-center justify-between px-5 py-2">
            <h2 className="text-foreground text-base font-semibold">Filters & Layers</h2>
            <DialogPrimitive.Close className="text-muted-foreground hover:bg-accent hover:text-accent-foreground flex h-7 w-7 items-center justify-center rounded-full transition-colors">
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          </div>

          <div className="border-border mx-5 border-t" />

          <div className="flex-1 overflow-y-auto px-5 py-3">
            <section className="mb-5">
              <h3 className="text-muted-foreground mb-3 text-xs font-bold tracking-wider uppercase">
                Map Layers
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {MAP_STYLE_OPTIONS.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => onMapStyleChange(key)}
                    className={cn(
                      'flex flex-col items-center gap-2 rounded-xl border px-3 py-3 text-xs font-semibold transition-all',
                      filters.mapStyle === key
                        ? 'border-primary/50 bg-primary/10 text-primary'
                        : 'border-border bg-accent/50 text-muted-foreground hover:border-foreground/20 hover:text-foreground/80',
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-5 w-5',
                        filters.mapStyle === key ? 'text-primary' : 'text-muted-foreground',
                      )}
                    />
                    <span className="text-center leading-tight">{label}</span>
                  </button>
                ))}
              </div>
            </section>

            <div className="border-border mb-5 border-t" />

            <section className="mb-5">
              <h3 className="text-muted-foreground mb-3 text-xs font-bold tracking-wider uppercase">
                Filter by Status
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => onShowResolvedChange(false)}
                  className={cn(
                    'flex-1 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all',
                    !filters.showResolved
                      ? 'border-primary/50 bg-primary/10 text-primary'
                      : 'border-border bg-accent/50 text-muted-foreground hover:border-foreground/20 hover:text-foreground/80',
                  )}
                >
                  Active / Pending Only
                </button>
                <button
                  onClick={() => onShowResolvedChange(true)}
                  className={cn(
                    'flex-1 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all',
                    filters.showResolved
                      ? 'border-primary/50 bg-primary/10 text-primary'
                      : 'border-border bg-accent/50 text-muted-foreground hover:border-foreground/20 hover:text-foreground/80',
                  )}
                >
                  Include Resolved
                </button>
              </div>
            </section>

            <div className="border-border mb-5 border-t" />

            <section className="mb-5">
              <h3 className="text-muted-foreground mb-3 text-xs font-bold tracking-wider uppercase">
                Filter by Timeframe
              </h3>
              <div className="flex gap-2">
                {TIMEFRAMES.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => onTimeframeChange(key)}
                    className={cn(
                      'flex-1 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all',
                      filters.timeframe === key
                        ? 'border-primary/50 bg-primary/10 text-primary'
                        : 'border-border bg-accent/50 text-muted-foreground hover:border-foreground/20 hover:text-foreground/80',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </section>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
