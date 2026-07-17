import { useState } from 'react';
import { Search, Shield, Mail, User, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useSearchUser } from '@/features/admin/api/use-search-user';
import { useUpdateUserRole } from '@/features/admin/api/use-update-user-role';
import { useUserRole } from '@/features/auth/api/use-user-role';
import { Input } from '@/components/ui/input';

const BASE_ROLE_OPTIONS = [
  { value: 'user', label: 'User' },
  { value: 'inspector', label: 'Inspector' },
  { value: 'admin', label: 'Admin' },
  { value: 'official', label: 'Official' },
];

const extractErrorMessage = (err: unknown): string => {
  if (typeof err === 'object' && err !== null) {
    const obj = err as Record<string, unknown>;
    return String(obj.message ?? obj.error ?? err);
  }
  return String(err);
};

export const RoleAssignment = () => {
  const { isSuperAdmin } = useUserRole();
  const [searchInput, setSearchInput] = useState('');
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState('user');

  const ROLE_OPTIONS = isSuperAdmin
    ? [...BASE_ROLE_OPTIONS, { value: 'super_admin', label: 'Super Admin' }]
    : BASE_ROLE_OPTIONS;
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const { data: user, isLoading, error, isFetching } = useSearchUser(submittedEmail);
  const updateMutation = useUpdateUserRole();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchInput.trim().toLowerCase();
    if (!trimmed) return;
    setSuccessMessage(null);
    setUpdateError(null);
    setSubmittedEmail(trimmed);
  };

  const handleUpdateRole = () => {
    if (!submittedEmail) return;
    setSuccessMessage(null);
    setUpdateError(null);
    updateMutation.mutate(
      { email: submittedEmail, role: selectedRole },
      {
        onSuccess: () => {
          setSuccessMessage(
            `Role updated to "${ROLE_OPTIONS.find((r) => r.value === selectedRole)?.label}" for ${submittedEmail}`,
          );
        },
        onError: (err) => {
          setUpdateError(extractErrorMessage(err));
        },
      },
    );
  };

  const showResult = submittedEmail !== null && !isLoading && !isFetching && !error;
  const showSkeleton = (isLoading || isFetching) && submittedEmail !== null;

  return (
    <div className="animate-in fade-in-0 slide-in-from-bottom-2 space-y-6 duration-500 [animation-delay:200ms]">
      <div className="rounded-xl border border-white/20 bg-white/60 p-6 shadow-xs backdrop-blur-sm">
        <div className="mb-4 flex items-center gap-3 border-b border-slate-200/60 pb-4">
          <div className="bg-primary/10 flex h-9 w-9 items-center justify-center rounded-lg">
            <Shield className="text-primary h-4 w-4" />
          </div>
          <div>
            <h2 className="text-foreground text-sm font-semibold">Search User</h2>
            <p className="text-muted-foreground text-xs">
              Enter a Gmail address to find and update their role
            </p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex items-end gap-3">
          <div className="flex-1 space-y-1.5">
            <label className="text-foreground text-xs font-semibold tracking-wide">Email</label>
            <div className="relative">
              <Mail className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                type="email"
                placeholder="user@gmail.com"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={!searchInput.trim()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground inline-flex h-10 items-center gap-2 rounded-lg px-5 text-sm font-semibold shadow-xs transition-all hover:shadow-md active:scale-95 disabled:opacity-50"
          >
            <Search className="h-4 w-4" />
            Search
          </button>
        </form>
      </div>

      {successMessage && (
        <div className="animate-in fade-in-0 slide-in-from-top-2 border-primary/20 bg-primary/5 text-primary flex items-center gap-3 rounded-xl border px-5 py-4 text-sm duration-300">
          <CheckCircle className="text-primary h-5 w-5 shrink-0" />
          <span className="font-medium">{successMessage}</span>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-primary hover:text-primary ml-auto"
          >
            <span className="text-lg leading-none">&times;</span>
          </button>
        </div>
      )}

      {error && (
        <div className="animate-in fade-in-0 slide-in-from-top-2 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800 duration-300">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
          <span className="font-medium">{extractErrorMessage(error)}</span>
        </div>
      )}

      {updateError && (
        <div className="animate-in fade-in-0 slide-in-from-top-2 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800 duration-300">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
          <span className="font-medium">{updateError}</span>
        </div>
      )}

      {showSkeleton && (
        <div className="animate-pulse rounded-xl border border-white/20 bg-white/60 p-6 shadow-xs backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-slate-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-48 rounded bg-slate-200" />
              <div className="h-3 w-32 rounded bg-slate-200" />
              <div className="h-3 w-24 rounded bg-slate-200" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-9 w-32 rounded-lg bg-slate-200" />
            <div className="h-9 w-24 rounded-lg bg-slate-200" />
          </div>
        </div>
      )}

      {showResult && user && (
        <div className="animate-in fade-in-0 slide-in-from-bottom-2 rounded-xl border border-white/20 bg-white/60 p-6 shadow-xs backdrop-blur-sm duration-500">
          <div className="mb-4 flex items-center gap-3 border-b border-slate-200/60 pb-4">
            <div className="bg-primary/10 flex h-9 w-9 items-center justify-center rounded-lg">
              <User className="text-primary h-4 w-4" />
            </div>
            <div>
              <h2 className="text-foreground text-sm font-semibold">User Found</h2>
              <p className="text-muted-foreground text-xs">Details for the matching account</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="bg-primary/5 text-primary flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-bold">
              {(user.username ?? user.email).charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                <div>
                  <span className="text-muted-foreground block text-[11px] font-semibold tracking-widest uppercase">
                    Email
                  </span>
                  <span className="text-foreground truncate text-sm font-medium">{user.email}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px] font-semibold tracking-widest uppercase">
                    Username
                  </span>
                  <span className="text-foreground text-sm">{user.username ?? '\u2014'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px] font-semibold tracking-widest uppercase">
                    Points
                  </span>
                  <span className="text-foreground text-sm font-medium">{user.points}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px] font-semibold tracking-widest uppercase">
                    Current Role
                  </span>
                  <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                    {user.role ?? 'user'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col items-stretch gap-3 border-t border-slate-200/60 pt-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1.5 sm:max-w-xs">
              <label className="text-foreground text-xs font-semibold tracking-wide">
                New Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="border-input bg-background text-foreground focus-visible:border-ring focus-visible:ring-ring/30 flex h-10 w-full items-center rounded-lg border px-3 text-sm transition-all outline-none focus-visible:ring-2"
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleUpdateRole}
              disabled={updateMutation.isPending || selectedRole === (user.role ?? 'user')}
              className="bg-primary hover:bg-primary/90 text-primary-foreground inline-flex h-10 items-center justify-center gap-2 rounded-lg px-6 text-sm font-semibold shadow-xs transition-all hover:shadow-md active:scale-95 disabled:opacity-50"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4" />
                  Update Role
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {showResult && !user && (
        <div className="animate-in fade-in-0 slide-in-from-top-2 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800 duration-300">
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
          <span className="font-medium">
            No user found with email <strong>{submittedEmail}</strong>
          </span>
        </div>
      )}
    </div>
  );
};
