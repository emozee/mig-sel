import { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft,
  Upload,
  LoaderPinwheel,
  CheckCheck,
  Camera,
  Loader2,
  Sparkles,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUserProfile } from '@/features/gamification/api/use-user-profile';
import { useUpdateProfile } from '@/features/gamification/api/use-update-profile';
import { uploadAvatar } from '@/features/gamification/api/use-upload-avatar';
import { useCurrentUser } from '@/features/auth/api/use-current-user';
import { useSignOut } from '@/features/auth/api/use-sign-out';

const POINTS_BREAKDOWN = [
  { icon: Upload, label: 'Submit a report', points: 1, color: 'text-blue-600', bg: 'bg-blue-50' },
  {
    icon: LoaderPinwheel,
    label: 'Status → In Progress',
    points: 1,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  {
    icon: CheckCheck,
    label: 'Status → Resolved',
    points: 2,
    color: 'text-green-600',
    bg: 'bg-green-50',
  },
];

export const ProfilePage = () => {
  const navigate = useNavigate();
  const { data: profile } = useUserProfile();
  const { user } = useCurrentUser();
  const mutation = useUpdateProfile();
  const signOut = useSignOut();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(profile?.username ?? '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url ?? null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const hasUsername = !!profile?.username;

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!user?.id) return;
    try {
      let avatarUrl = avatarPreview;
      if (avatarFile) {
        avatarUrl = await uploadAvatar(user.id, avatarFile);
      }
      await mutation.mutateAsync({
        userId: user.id,
        ...(hasUsername ? {} : { username: displayName.trim() || null }),
        avatar_url: avatarUrl,
      });
    } catch {
      // error handled by mutation
    }
  };

  const hasNameChanged = !hasUsername && displayName !== (profile?.username ?? '');
  const hasAvatarChanged = avatarFile !== null;
  const hasChanges = hasNameChanged || hasAvatarChanged;
  const isSaving = mutation.isPending;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="text-gray-500 hover:text-gray-800"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black text-gray-900">Profile</h1>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <div className="mb-6 flex flex-col items-center gap-4">
            <div className="relative">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-gray-100 to-gray-200 shadow-inner ring-2 ring-gray-200">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Camera className="h-8 w-8 text-gray-400" />
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-primary hover:bg-primary/90 absolute right-0 bottom-0 flex h-7 w-7 items-center justify-center rounded-full text-white shadow-lg transition-all hover:scale-110"
              >
                <Upload className="h-3.5 w-3.5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
          </div>

          <div className="mb-6 space-y-2">
            <label className="text-sm font-bold text-gray-700">Display Name</label>
            {hasUsername ? (
              <>
                <div className="rounded-xl border border-gray-100 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-500">
                  {profile?.username}
                </div>
                <p className="text-xs text-gray-400">Username can only be set once.</p>
              </>
            ) : (
              <Input
                placeholder="Enter your display name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={50}
              />
            )}
          </div>

          <Button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="w-full rounded-xl font-bold shadow-sm"
          >
            {isSaving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>

          <hr className="my-6 border-gray-100" />

          {profile && (
            <div className="mb-6 rounded-xl bg-gradient-to-br from-gray-50 to-white p-4 ring-1 ring-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-600">Your Points</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-gray-900">{profile.points}</span>
                  <span className="text-xs font-semibold text-gray-400">pts</span>
                </div>
              </div>
            </div>
          )}

          <h3 className="mb-3 flex items-center gap-1.5 text-xs font-bold tracking-wider text-gray-400 uppercase">
            <Sparkles className="h-3 w-3" />
            How points work
          </h3>
          <div className="space-y-2">
            {POINTS_BREAKDOWN.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="flex items-center gap-3 rounded-xl p-3 transition-all hover:-translate-y-0.5 hover:bg-gray-50"
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${item.bg} ring-1 ring-black/5 ring-inset`}
                  >
                    <Icon className={`h-4 w-4 ${item.color}`} />
                  </div>
                  <span className="flex-1 text-sm font-medium text-gray-700">{item.label}</span>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-lg font-black text-gray-900">+{item.points}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <hr className="my-6 border-gray-100" />

          <button
            onClick={() => signOut.mutate()}
            disabled={signOut.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-3 text-sm font-bold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" />
            {signOut.isPending ? 'Signing out...' : 'Sign Out'}
          </button>
        </div>
      </div>
    </div>
  );
};
