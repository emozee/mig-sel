import { Navigate, Outlet } from 'react-router';
import { useIsOfficial } from '@/features/auth/api/use-is-official';
import { Loader2 } from 'lucide-react';

export const OfficialRoute = () => {
  const { data: isOfficial, isLoading } = useIsOfficial();

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!isOfficial) return <Navigate to="/map" replace />;

  return <Outlet />;
};
