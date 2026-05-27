import { LogOut, Award, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { useSignOut } from '../api/use-sign-out';
import { useCurrentUser } from '../api/use-current-user';
import { useUserProfile } from '@/features/gamification/api/use-user-profile';

interface UserSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UserSettingsDialog = ({ open, onOpenChange }: UserSettingsDialogProps) => {
  const { user } = useCurrentUser();
  const { data: profile } = useUserProfile();
  const signOut = useSignOut();

  const initials = profile?.username
    ? profile.username.slice(0, 2).toUpperCase()
    : (user?.email?.slice(0, 2).toUpperCase() ?? '?');

  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 pt-2 pb-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-2xl font-bold text-emerald-700">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt=""
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              initials
            )}
          </div>

          <div className="text-center">
            <p className="text-lg font-semibold text-gray-900">{profile?.username ?? 'User'}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
            {profile?.role && (
              <span className="mt-1 inline-block rounded-full bg-blue-50 px-3 py-0.5 text-xs font-medium text-blue-600 capitalize">
                {profile.role}
              </span>
            )}
          </div>

          <div className="flex w-full gap-4 rounded-lg bg-gray-50 p-3">
            <div className="flex flex-1 items-center gap-2">
              <Award className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Role</p>
                <p className="text-sm font-medium text-gray-900 capitalize">
                  {profile?.role ?? 'User'}
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
        </div>

        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            className="w-full text-red-600 hover:bg-red-50 hover:text-red-700"
            disabled={signOut.isPending}
            onClick={() => signOut.mutate()}
          >
            <LogOut className="mr-2 h-4 w-4" />
            {signOut.isPending ? 'Signing out...' : 'Sign Out'}
          </Button>
          <DialogClose asChild>
            <Button variant="ghost" className="w-full text-gray-500">
              Close
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </DialogRoot>
  );
};
