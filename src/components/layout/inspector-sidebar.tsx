import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Recycle, Map, LogOut, X, User, Award, Coins, Camera, Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSignOut } from '@/features/auth/api/use-sign-out';
import { useCurrentUser } from '@/features/auth/api/use-current-user';
import { useUserProfile } from '@/features/gamification/api/use-user-profile';
import { useUpdateProfile } from '@/features/gamification/api/use-update-profile';
import { uploadAvatar } from '@/features/gamification/api/use-upload-avatar';

export const InspectorSidebar = ({
  isMobileOpen,
  onMobileClose,
}: {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}) => {
  const navigate = useNavigate();
  const signOut = useSignOut();
  const { user } = useCurrentUser();
  const { data: profile } = useUserProfile();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const updateProfile = useUpdateProfile();

  const initials = profile?.username
    ? profile.username.slice(0, 2).toUpperCase()
    : (user?.email?.slice(0, 2).toUpperCase() ?? '?');

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    setUploading(true);
    try {
      let avatarUrl = avatarPreview;
      if (avatarFile) {
        avatarUrl = await uploadAvatar(user.id, avatarFile);
      }

      const nameChanged = displayName.trim() !== (profile?.username ?? '');
      const editCount = profile?.username_edit_count ?? 0;

      await updateProfile.mutateAsync({
        userId: user.id,
        username: displayName.trim() || null,
        avatar_url: avatarUrl,
        username_edit_count: nameChanged ? editCount + 1 : editCount,
      });

      setIsProfileOpen(false);
    } finally {
      setUploading(false);
    }
  };

  const nameChanged = displayName !== (profile?.username ?? '');
  const avatarChanged = avatarFile !== null;
  const hasChanges = nameChanged || avatarChanged;
  const isSaving = updateProfile.isPending || uploading;
  const editsRemaining = 1 - (profile?.username_edit_count ?? 0);
  const nameLocked = editsRemaining <= 0;

  return (
    <>
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-white/20 bg-white/70 backdrop-blur-xl transition-transform duration-300',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full',
          'md:translate-x-0',
        )}
      >
        <div className="flex h-16 shrink-0 items-center gap-3 border-b px-5">
          <div className="flex items-center justify-center">
            <img src="/3d logo.png" alt="Logo" className="h-10 w-auto rounded-lg object-contain" />
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-foreground text-lg font-bold tracking-tight">Migsel</span>
            <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-amber-700 uppercase">
              Inspector
            </span>
          </div>
          {onMobileClose && (
            <button
              onClick={onMobileClose}
              className="hover:bg-accent ml-auto rounded-lg p-1.5 transition-all md:hidden"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto p-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-muted-foreground/40 px-3 pb-2 text-[11px] font-semibold tracking-widest uppercase">
              Inspector Tools
            </span>
            <div className="group bg-primary/10 text-primary relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium">
              <div className="bg-primary absolute left-0 h-5 w-0.5 rounded-full" />
              <div className="flex h-5 w-5 items-center justify-center">
                <Recycle className="h-4 w-4" />
              </div>
              <span>Waste Reporting</span>
            </div>
          </div>
        </nav>

        <div className="border-t p-4">
          <div className="flex flex-col gap-1">
            <button
              onClick={() => navigate('/map')}
              className="group text-muted-foreground relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all duration-300 ease-out outline-none hover:text-slate-900"
            >
              <span className="absolute inset-0 rounded-lg bg-slate-100/60 opacity-0 transition-all duration-300 ease-out group-hover:scale-100 group-hover:opacity-100" />
              <div className="relative flex h-5 w-5 items-center justify-center transition-transform duration-300 ease-out group-hover:translate-x-0.5">
                <Map className="h-4 w-4" />
              </div>
              <span className="relative transition-all duration-300 ease-out group-hover:translate-x-0.5">
                Public Map
              </span>
            </button>
            <button
              onClick={() => {
                setDisplayName(profile?.username ?? '');
                setAvatarPreview(profile?.avatar_url ?? null);
                setAvatarFile(null);
                setIsProfileOpen(true);
              }}
              className="group text-muted-foreground relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all duration-300 ease-out outline-none hover:text-slate-900"
            >
              <span className="absolute inset-0 rounded-lg bg-slate-100/60 opacity-0 transition-all duration-300 ease-out group-hover:scale-100 group-hover:opacity-100" />
              <div className="relative flex h-5 w-5 items-center justify-center transition-transform duration-300 ease-out group-hover:translate-x-0.5">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt=""
                    className="h-5 w-5 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-4 w-4" />
                )}
              </div>
              <span className="relative transition-all duration-300 ease-out group-hover:translate-x-0.5">
                Profile
              </span>
            </button>
          </div>
        </div>
      </aside>

      {/* Profile slide-in panel */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-[60]">
          <div
            className="animate-fade-in absolute inset-0 bg-black/20"
            onClick={() => setIsProfileOpen(false)}
          />
          <div className="animate-in slide-in-from-left absolute top-0 left-0 flex h-full w-72 flex-col bg-white shadow-xl duration-300">
            <div className="flex h-16 shrink-0 items-center justify-between border-b px-5">
              <span className="text-lg font-semibold">Profile</span>
              <button
                onClick={() => setIsProfileOpen(false)}
                className="hover:bg-accent rounded-lg p-1.5 transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex flex-col items-center gap-4">
                {/* Avatar */}
                <div className="relative">
                  <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-emerald-100 text-2xl font-bold text-emerald-700">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="" className="h-full w-full object-cover" />
                    ) : (
                      initials
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-primary hover:bg-primary/90 absolute right-0 bottom-0 flex h-7 w-7 items-center justify-center rounded-full text-white shadow transition-colors"
                  >
                    <Camera className="h-3.5 w-3.5" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>

                {/* Name */}
                <div className="w-full space-y-1.5">
                  <label className="text-xs font-medium text-gray-500">Display Name</label>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter display name"
                    maxLength={50}
                    disabled={nameLocked}
                  />
                  {nameLocked ? (
                    <p className="text-xs text-amber-600">Name has already been changed.</p>
                  ) : (
                    <p className="text-xs text-gray-400">Name can only be changed once.</p>
                  )}
                </div>

                {/* Email */}
                <p className="-mt-2 text-sm text-gray-500">{user?.email}</p>

                {/* Role badge */}
                {profile?.role && (
                  <span className="inline-block rounded-full bg-blue-50 px-3 py-0.5 text-xs font-medium text-blue-600 capitalize">
                    {profile.role}
                  </span>
                )}

                {/* Role + Points */}
                <div className="flex w-full gap-4 rounded-lg bg-gray-50 p-3">
                  <div className="flex flex-1 items-center gap-2">
                    <Award className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Role</p>
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {profile?.role ?? 'Inspector'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-1 items-center gap-2">
                    <Coins className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Points</p>
                      <p className="text-sm font-medium text-gray-900">{profile?.points ?? 0}</p>
                    </div>
                  </div>
                </div>

                {/* Save */}
                <Button
                  onClick={handleSaveProfile}
                  disabled={isSaving || !hasChanges}
                  className="w-full"
                >
                  {isSaving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                  Save
                </Button>
              </div>
            </div>

            <div className="border-t p-4">
              <button
                onClick={() => signOut.mutate()}
                disabled={signOut.isPending}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition-all hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
              >
                <LogOut className="h-4 w-4" />
                {signOut.isPending ? 'Signing out...' : 'Sign Out'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
