import { Navigate, Outlet } from 'react-router';
import { useUserRole } from '@/features/auth/api/use-user-role';

export const AdminRoute = () => {
  const { isAdmin, isLoading } = useUserRole();

  if (isLoading) return null;

  if (!isAdmin) return <Navigate to="/map" replace />;

  return <Outlet />;
};
