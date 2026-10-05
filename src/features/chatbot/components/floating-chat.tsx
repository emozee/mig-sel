import { useEffect, useRef, useState } from 'react';
import { Bot, X } from 'lucide-react';
import { AskMigselChat } from './ask-migsel-chat';

export const FloatingChat = () => {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [open]);

  return (
    <div className="flex flex-col items-end gap-2">
      {open && (
        <section
          ref={panelRef}
          aria-label="Ask MIGSEL"
          className="animate-fade-in flex h-[min(32rem,70dvh)] w-[min(22rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl bg-slate-50 shadow-xl ring-1 ring-black/10"
        >
          <header className="border-border flex shrink-0 items-center justify-between border-b bg-white px-3 py-2.5">
            <div className="flex min-w-0 items-center gap-2">
              <Bot className="text-primary h-4 w-4 shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <h2 className="truncate text-xs font-bold text-slate-900">Ask MIGSEL</h2>
                <p className="truncate text-[10px] text-slate-500">
                  Not sure where to go? Just ask.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close Ask MIGSEL"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 focus-visible:ring-2"
            >
              <X className="h-4 w-4" />
            </button>
          </header>
          <AskMigselChat compact />
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        title="Ask MIGSEL"
        aria-label={open ? 'Close Ask MIGSEL' : 'Open Ask MIGSEL'}
        aria-expanded={open}
        className="group bg-primary shadow-primary/30 ring-primary/20 hover:bg-primary/90 flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl text-white shadow-lg ring-1 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-95"
      >
        {open ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
      </button>
    </div>
  );
};
