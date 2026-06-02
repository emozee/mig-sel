import type { ReactNode } from 'react';

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-muted-foreground/60 text-xs font-bold tracking-wide uppercase">{label}</p>
      <div className="text-foreground mt-0.5 text-sm">{children}</div>
    </div>
  );
}
