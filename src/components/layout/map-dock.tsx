import { useNavigate, useLocation } from 'react-router';
import { useCallback, useState } from 'react';
import { Map, Gem, FileText, Camera, User, type LucideIcon } from 'lucide-react';
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
        'flex flex-col items-center gap-0.5 rounded-xl px-2 py-1 transition-all duration-200',
        isActive
          ? 'bg-primary/10 text-primary shadow-primary/20 ring-primary/20 shadow-sm ring-1'
          : 'text-slate-500 hover:text-slate-900',
        className,
      )}
    >
      <Icon
        className={cn(
          'h-5 w-5 transition-all duration-300',
          isActive && 'drop-shadow-[0_0_4px_var(--primary)]',
          anim && 'animate-nav-bounce',
        )}
      />
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
    if (path.startsWith('/reports-feed')) return 'reports-feed';
    if (path.startsWith('/diamond')) return 'diamond';

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
      <div className="relative rounded-2xl border border-slate-200 bg-white px-4 pt-3 pb-2 shadow-xl">
        {/* Elevated FAB – floats at the dock's top edge */}
        <div className="absolute -top-5 left-1/2 z-10 -translate-x-1/2">
          <button
            onClick={() => {
              navigate('/report');
            }}
            className="bg-primary hover:bg-primary/90 flex items-center justify-center rounded-full p-3.5 text-white shadow-xl transition-transform hover:scale-105 active:scale-95"
          >
            <Camera className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation row */}
        <div className="flex items-center justify-around">
          <NavItem
            icon={Map}
            label="Map"
            isActive={activeTab === 'map'}
            onClick={() => navigate('/map')}
          />

          <NavItem
            icon={Gem}
            label="Diamond"
            isActive={activeTab === 'diamond'}
            onClick={() => navigate('/diamond')}
          />

          <NavItem
            icon={FileText}
            label="Reports Feed"
            isActive={activeTab === 'reports-feed'}
            onClick={() => navigate('/reports-feed')}
          />

          <NavItem
            icon={User}
            label={isAdmin ? 'Profile' : isInspector ? 'Dashboard' : 'Profile'}
            isActive={activeTab === 'profile'}
            onClick={() => {
              if (isAdmin) {
                navigate('/profile');
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
  );
};
