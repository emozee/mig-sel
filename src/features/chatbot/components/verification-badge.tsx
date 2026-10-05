import { AlertTriangle, BadgeCheck } from 'lucide-react';

export function VerificationBadge({
  verified,
  lastVerifiedAt,
}: {
  verified: boolean;
  lastVerifiedAt?: string;
}) {
  if (!verified) {
    return (
      <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700">
        <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
        Information not verified
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-x-1.5 text-xs font-semibold text-emerald-700">
      <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
      <span>Verified</span>
      {lastVerifiedAt && (
        <span className="font-normal text-slate-500">
          Last checked: {new Date(lastVerifiedAt).toLocaleDateString()}
        </span>
      )}
    </div>
  );
}
