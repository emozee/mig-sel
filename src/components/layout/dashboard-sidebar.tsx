import {
  Recycle,
  ClipboardList,
  LogOut,
  ChartLine,
  X,
  Map,
  FileText,
  Shield,
  Brain,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { cn } from '@/lib/utils';
import { useSignOut } from '@/features/auth/api/use-sign-out';

export type NavView = 'complaint' | 'table' | 'inspector' | 'role' | 'charts' | 'knowledge';

const navItems = [
  { id: 'complaint' as const, label: 'Complaint Monitoring', icon: ClipboardList },
  { id: 'table' as const, label: 'Waste Management', icon: Recycle },
  { id: 'inspector' as const, label: 'Inspector', icon: FileText },
  { id: 'role' as const, label: 'Role Assignment', icon: Shield },
  { id: 'charts' as const, label: 'Analytics', icon: ChartLine },
  { id: 'knowledge' as const, label: 'Knowledge Base', icon: Brain },
];

export function DashboardSidebar({
  activeView,
  onNavigate,
  isMobileOpen,
  onMobileClose,
}: {
  activeView: NavView;
  onNavigate: (view: NavView) => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}) {
  const navigate = useNavigate();
  const signOut = useSignOut();

  return (
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
          <span className="bg-primary/10 text-primary rounded-md px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase">
            Admin
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
            Main Menu
          </span>
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={cn(
                  'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all duration-300 ease-out outline-none',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-slate-900',
                )}
              >
                {isActive && <div className="bg-primary absolute left-0 h-5 w-0.5 rounded-full" />}
                <div className="flex h-5 w-5 items-center justify-center transition-transform duration-300 ease-out group-hover:translate-x-0.5">
                  <item.icon className="h-4 w-4" />
                </div>
                <span className="transition-all duration-300 ease-out group-hover:translate-x-0.5">
                  {item.label}
                </span>
                {!isActive && (
                  <span className="absolute inset-0 rounded-lg bg-slate-100/60 opacity-0 transition-all duration-300 ease-out group-hover:scale-100 group-hover:opacity-100" />
                )}
              </button>
            );
          })}
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
            onClick={() => signOut.mutate()}
            disabled={signOut.isPending}
            className="group text-muted-foreground relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all duration-300 ease-out outline-none hover:text-slate-900 disabled:opacity-50"
          >
            <span className="absolute inset-0 rounded-lg bg-slate-100/60 opacity-0 transition-all duration-300 ease-out group-hover:scale-100 group-hover:opacity-100" />
            <div className="relative flex h-5 w-5 items-center justify-center transition-transform duration-300 ease-out group-hover:translate-x-0.5">
              <LogOut className="h-4 w-4" />
            </div>
            <span className="relative transition-all duration-300 ease-out group-hover:translate-x-0.5">
              {signOut.isPending ? 'Signing out...' : 'Sign Out'}
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
}
