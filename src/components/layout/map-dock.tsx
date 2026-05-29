import { useNavigate, useLocation } from 'react-router';
import {
  Map,
  Users,
  Trophy,
  Camera,
  MessageCircle,
  ShoppingBag,
  User,
  type LucideIcon,
} from 'lucide-react';
import { useIsAdmin } from '@/features/auth/api/use-is-admin';
import { useIsInspector } from '@/features/auth/api/use-is-inspector';

interface NavItemProps {
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  onClick: () => void;
  className?: string;
}

const NavItem = ({ icon: Icon, label, isActive, onClick, className = '' }: NavItemProps) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-0.5 transition-colors ${
      isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'
    } ${className}`}
  >
    <Icon className="h-5 w-5" />
    <span className="text-[10px] leading-none font-semibold">{label}</span>
  </button>
);

export const MapDock = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: isAdmin } = useIsAdmin();
  const { data: isInspector } = useIsInspector();

  const activeTab = (() => {
    const path = location.pathname;
    if (path.startsWith('/map')) return 'map';
    if (path.startsWith('/community')) return 'community';
    if (path.startsWith('/leaderboard')) return 'leaderboard';
    if (path.startsWith('/chat')) return 'chat';
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
            {/* Map */}
            <NavItem
              icon={Map}
              label="Map"
              isActive={activeTab === 'map'}
              onClick={() => {
                navigate('/map');
              }}
            />

            {/* Community */}
            <NavItem
              icon={Users}
              label="Community"
              isActive={activeTab === 'community'}
              onClick={() => {
                navigate('/community');
              }}
            />

            {/* Leaderboard */}
            <NavItem
              icon={Trophy}
              label="Leaderboard"
              isActive={activeTab === 'leaderboard'}
              onClick={() => {
                navigate('/leaderboard');
              }}
            />
          </div>

          {/* Right group */}
          <div className="flex flex-1 items-center justify-around">
            {/* Chat */}
            <NavItem
              icon={MessageCircle}
              label="Chat"
              isActive={activeTab === 'chat'}
              onClick={() => {
                navigate('/chat');
              }}
            />

            {/* Shop */}
            <NavItem
              icon={ShoppingBag}
              label="Shop"
              isActive={activeTab === 'shop'}
              onClick={() => {
                navigate('/shop');
              }}
            />

            {/* Profile / Admin / Inspector */}
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
