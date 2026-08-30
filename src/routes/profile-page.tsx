import { useNavigate } from 'react-router';
import {
  ArrowLeft,
  FileText,
  RefreshCw,
  Trophy,
  ShoppingBag,
  Building2,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { goBackSafe } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useUserProfile } from '@/features/gamification/api/use-user-profile';
import { useMyReports } from '@/features/complaint/api/use-my-reports';
import { useMyDiamonds } from '@/features/diamonds/api/use-my-diamonds';
import { EditProfileDialog } from '@/features/gamification/components/edit-profile-dialog';
import { MapDock } from '@/components/layout/map-dock';
import { FloatingChat } from '@/features/chatbot/components/floating-chat';

export const ProfilePage = () => {
  const navigate = useNavigate();
  const { data: profile } = useUserProfile();
  const { data: myReportsResult } = useMyReports(1, 1);
  const { data: myDiamonds } = useMyDiamonds(1, 1);
  const isOfficial = profile?.role === 'official' || profile?.role === 'super_admin';

  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';
  const isInspector = profile?.role === 'inspector' || profile?.role === 'super_admin';
  const updatesCount = myDiamonds?.count ?? 0;

  const activities = [
    {
      icon: FileText,
      label: 'My Reports',
      sub: `${myReportsResult?.total ?? 0} total`,
      href: '/profile/reports',
    },
    {
      icon: RefreshCw,
      label: 'My Updates',
      sub: `${updatesCount} posted`,
      href: '/profile/updates',
    },
    {
      icon: Trophy,
      label: 'Leaderboard',
      sub: 'Top contributors',
      href: '/leaderboard',
    },
    {
      icon: ShoppingBag,
      label: 'Shop',
      sub: 'Redeem points',
      href: '/shop',
    },
  ];

  return (
    <div className="bg-background min-h-dvh">
      <div className="mx-auto max-w-2xl px-4 py-6 pb-24">
        <div className="mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => goBackSafe(navigate)}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
        </div>

        {/* Profile Card */}
        <div className="bg-card shadow-card mb-6 overflow-hidden rounded-xl border">
          {/* Gradient banner */}
          <div className="from-primary/5 via-primary/10 to-primary/5 relative bg-gradient-to-r px-6 pb-4">
            <div className="flex justify-end pt-1">
              <EditProfileDialog />
            </div>

            <div className="-mt-0.5 flex items-end gap-5">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="bg-muted shadow-elevated flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl border-4 border-white">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.username ?? 'Your avatar'}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="from-primary/10 to-primary/5 text-primary flex h-full w-full items-center justify-center bg-gradient-to-br text-xl font-bold">
                      {(profile?.username ?? 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              {/* Name + points */}
              <div className="min-w-0 flex-1 pb-3">
                <div className="flex items-center gap-2">
                  <h1 className="text-foreground truncate text-xl font-bold">
                    {profile?.username ?? 'User'}
                  </h1>
                  {profile?.role && profile.role !== 'user' && (
                    <span className="bg-primary/10 text-primary shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold capitalize">
                      {profile.role}
                    </span>
                  )}
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-foreground text-2xl font-bold">{profile?.points ?? 0}</span>
                  <span className="text-muted-foreground text-xs font-medium">points</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How points work */}
        <p className="text-muted-foreground mb-6 flex items-center gap-1.5 text-sm">
          <Sparkles className="h-4 w-4 shrink-0" />
          +1 submit &middot; +1 in progress &middot; +2 resolved
        </p>

        {/* My Activities */}
        <div className="mb-6">
          <h3 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
            My Activities
          </h3>
          <div className="bg-card shadow-card divide-y rounded-xl border">
            {activities.map(({ icon: Icon, label, sub, href }) => (
              <button
                key={href}
                onClick={() => navigate(href)}
                className="hover:bg-muted/50 flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors"
              >
                <div className="bg-primary/10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                  <Icon className="text-primary h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-foreground text-sm font-semibold">{label}</p>
                  <p className="text-muted-foreground text-xs">{sub}</p>
                </div>
                <ChevronRight className="text-muted-foreground h-4 w-4" />
              </button>
            ))}
          </div>
        </div>

        {/* Official Dashboard (hidden for super_admin — they use the admin dashboard) */}
        {isOfficial && profile?.role !== 'super_admin' && (
          <button
            onClick={() => navigate('/official')}
            className="border-primary/20 text-primary hover:bg-primary/5 mb-3 flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors"
          >
            <Building2 className="h-4 w-4" />
            Official Dashboard
          </button>
        )}

        {/* Inspector Portal (hidden for super_admin — they use the admin dashboard) */}
        {isInspector && profile?.role !== 'super_admin' && (
          <button
            onClick={() => navigate('/inspector')}
            className="border-primary/20 text-primary hover:bg-primary/5 mb-3 flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors"
          >
            <Building2 className="h-4 w-4" />
            Inspector Portal
          </button>
        )}

        {/* Admin / Super Admin Dashboard */}
        {isAdmin && (
          <button
            onClick={() => navigate('/dashboard')}
            className="border-primary/20 text-primary hover:bg-primary/5 flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors"
          >
            <Building2 className="h-4 w-4" />
            {profile?.role === 'super_admin' ? 'Super Admin Dashboard' : 'Admin Dashboard'}
          </button>
        )}
      </div>

      <div className="fixed right-4 bottom-24 z-40">
        <FloatingChat />
      </div>

      <MapDock />
    </div>
  );
};
