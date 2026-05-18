import { Navigate } from 'react-router';
import { useUserRole } from '@/features/auth/api/use-user-role';

export const AuthCallbackPage = () => {
  const { isAdmin, isLoading } = useUserRole();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-on-surface-variant text-sm font-medium">Redirecting...</div>
      </div>
    );
  }

  if (isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Navigate to="/map" replace />;
};
