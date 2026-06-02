import { Navigate, Outlet } from 'react-router';
import { useIsAdmin } from '@/features/auth/api/use-is-admin';
import { Loader2 } from 'lucide-react';

export const AdminRoute = () => {
  const { data: isAdmin, isLoading } = useIsAdmin();

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return <Navigate to="/map" replace />;

  return <Outlet />;
};
