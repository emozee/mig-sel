import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Trophy, Users, Camera, ShoppingBag, Settings } from 'lucide-react';
import { useIsAdmin } from '@/features/auth/api/use-is-admin';
import { useIsInspector } from '@/features/auth/api/use-is-inspector';
import { UserSettingsDialog } from '@/features/auth/components/user-settings-dialog';

interface NavItemProps {
  icon: typeof Trophy;
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
  const { data: isAdmin } = useIsAdmin();
  const { data: isInspector } = useIsInspector();
  const [activeTab, setActiveTab] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 left-1/2 z-50 w-[95%] max-w-xl -translate-x-1/2">
      <div className="relative rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-xl">
        {/* Elevated FAB – floats above the dock center */}
        <div className="absolute -top-8 left-1/2 z-10 -translate-x-1/2">
          <button
            onClick={() => {
              setActiveTab('report');
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
            {/* Leaderboard */}
            <NavItem
              icon={Trophy}
              label="Leaderboard"
              isActive={activeTab === 'leaderboard'}
              onClick={() => {
                setActiveTab('leaderboard');
                navigate('/leaderboard');
              }}
            />

            {/* Community */}
            <NavItem
              icon={Users}
              label="Community"
              isActive={activeTab === 'community'}
              onClick={() => {
                setActiveTab('community');
                navigate('/community');
              }}
            />
          </div>

          {/* Right group */}
          <div className="flex flex-1 items-center justify-around">
            {/* Shop */}
            <NavItem
              icon={ShoppingBag}
              label="Shop"
              isActive={activeTab === 'shop'}
              onClick={() => {
                setActiveTab('shop');
                navigate('/shop');
              }}
            />

            {/* Settings / Admin / Inspector */}
            <NavItem
              icon={Settings}
              label={isAdmin ? 'Admin' : isInspector ? 'Dashboard' : 'Settings'}
              isActive={activeTab === 'settings'}
              onClick={() => {
                setActiveTab('settings');
                if (isAdmin) {
                  navigate('/dashboard');
                } else if (isInspector) {
                  navigate('/inspector');
                } else {
                  setSettingsOpen(true);
                }
              }}
            />
          </div>
        </div>
      </div>
      <UserSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
};
