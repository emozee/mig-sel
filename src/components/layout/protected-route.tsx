import { Navigate, Outlet } from 'react-router';
import { useSession } from '@/features/auth/api/use-session';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute = () => {
  const { data: session, isLoading } = useSession();

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!session) return <Navigate to="/" replace />;

  return <Outlet />;
};
