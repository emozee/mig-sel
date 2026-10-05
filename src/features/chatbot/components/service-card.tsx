import { Building2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AskMigselService } from '@/features/chatbot/types';
import { VerificationBadge } from './verification-badge';

function safeUrl(value?: string): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null;
  } catch {
    return null;
  }
}

export function ServiceCard({ service }: { service: AskMigselService }) {
  const officialUrl = service.verified ? safeUrl(service.officialUrl) : null;
  const sourceUrl = service.verified ? safeUrl(service.sourceUrl) : null;

  return (
    <section className="border-border w-full min-w-0 rounded-xl border bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-start gap-2">
        <div className="bg-primary/10 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
          <Building2 className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-bold break-words text-slate-900">{service.name}</h3>
          <p className="text-xs break-words text-slate-500">{service.providerName}</p>
        </div>
      </div>
      <VerificationBadge verified={service.verified} lastVerifiedAt={service.lastVerifiedAt} />
      {service.description && (
        <p className="mt-2 text-xs leading-relaxed text-slate-600">{service.description}</p>
      )}
      {service.requirements && (
        <div className="mt-2 text-xs text-slate-600">
          <span className="font-bold text-slate-800">Requirements: </span>
          {service.requirements}
        </div>
      )}
      {service.fees && (
        <div className="mt-1 text-xs text-slate-600">
          <span className="font-bold text-slate-800">Fees: </span>
          {service.fees}
        </div>
      )}
      {service.processingTime && (
        <div className="mt-1 text-xs text-slate-600">
          <span className="font-bold text-slate-800">Processing time: </span>
          {service.processingTime}
        </div>
      )}
      {sourceUrl && (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary mt-2 inline-flex items-center gap-1 text-xs font-semibold underline underline-offset-2"
        >
          Source: {service.sourceName ?? 'Official source'}
          <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </a>
      )}
      {officialUrl && (
        <Button asChild size="xs" className="mt-3 w-full">
          <a href={officialUrl} target="_blank" rel="noopener noreferrer">
            Open Official Service
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </Button>
      )}
    </section>
  );
}
