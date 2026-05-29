import { useNavigate, useLocation } from 'react-router';
import { useCallback, useState } from 'react';
import {
  Map,
  Sparkles,
  Users,
  Trophy,
  Camera,
  ShoppingBag,
  User,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsAdmin } from '@/features/auth/api/use-is-admin';
import { useIsInspector } from '@/features/auth/api/use-is-inspector';

interface NavItemProps {
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  onClick: () => void;
  className?: string;
}

const NavItem = ({ icon: Icon, label, isActive, onClick, className = '' }: NavItemProps) => {
  const [anim, setAnim] = useState(false);

  const handleClick = useCallback(() => {
    setAnim(true);
    setTimeout(() => setAnim(false), 400);
    onClick();
  }, [onClick]);

  return (
    <button
      onClick={handleClick}
      className={cn(
        'flex flex-col items-center gap-0.5 transition-colors duration-200',
        isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900',
        className,
      )}
    >
      <Icon className={cn('h-5 w-5 transition-all duration-300', anim && 'animate-nav-bounce')} />
      <span className="text-[10px] leading-none font-semibold">{label}</span>
    </button>
  );
};

export const MapDock = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: isAdmin } = useIsAdmin();
  const { data: isInspector } = useIsInspector();

  const activeTab = (() => {
    const path = location.pathname;
    if (path.startsWith('/map')) return 'map';
    if (path.startsWith('/community')) return 'community';
    if (path.startsWith('/diamond')) return 'diamond';
    if (path.startsWith('/leaderboard')) return 'leaderboard';
    if (path.startsWith('/shop')) return 'shop';
    if (
      path.startsWith('/profile') ||
      path.startsWith('/dashboard') ||
      path.startsWith('/inspector')
    )
      return 'profile';
    return '';
  })();

  return (
    <div className="fixed bottom-6 left-1/2 z-50 w-[95%] max-w-xl -translate-x-1/2">
      <div className="relative rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-xl">
        {/* Elevated FAB – floats above the dock center */}
        <div className="absolute -top-8 left-1/2 z-10 -translate-x-1/2">
          <button
            onClick={() => {
              navigate('/report');
            }}
            className="flex items-center justify-center rounded-full bg-emerald-600 p-3.5 text-white shadow-xl transition-transform hover:scale-105 hover:bg-emerald-500 active:scale-95"
          >
            <Camera className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation row */}
        <div className="flex items-center">
          {/* Left group */}
          <div className="flex flex-1 items-center justify-around">
            <NavItem
              icon={Map}
              label="Map"
              isActive={activeTab === 'map'}
              onClick={() => navigate('/map')}
            />

            <NavItem
              icon={Sparkles}
              label="Diamond"
              isActive={activeTab === 'diamond'}
              onClick={() => navigate('/diamond')}
            />

            <NavItem
              icon={Users}
              label="Community"
              isActive={activeTab === 'community'}
              onClick={() => navigate('/community')}
            />
          </div>

          {/* Right group */}
          <div className="flex flex-1 items-center justify-around">
            <NavItem
              icon={Trophy}
              label="Leaderboard"
              isActive={activeTab === 'leaderboard'}
              onClick={() => navigate('/leaderboard')}
            />

            <NavItem
              icon={ShoppingBag}
              label="Shop"
              isActive={activeTab === 'shop'}
              onClick={() => navigate('/shop')}
            />

            <NavItem
              icon={User}
              label={isAdmin ? 'Admin' : isInspector ? 'Dashboard' : 'Profile'}
              isActive={activeTab === 'profile'}
              onClick={() => {
                if (isAdmin) {
                  navigate('/dashboard');
                } else if (isInspector) {
                  navigate('/inspector');
                } else {
                  navigate('/profile');
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
