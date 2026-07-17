import { Navigate, Outlet } from 'react-router';
import { useIsSuperAdmin } from '@/features/auth/api/use-is-super-admin';
import { Loader2 } from 'lucide-react';

export const SuperAdminRoute = () => {
  const { data: isSuperAdmin, isLoading } = useIsSuperAdmin();

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!isSuperAdmin) return <Navigate to="/map" replace />;

  return <Outlet />;
};
