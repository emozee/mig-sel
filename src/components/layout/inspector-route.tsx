import { Navigate, Outlet } from 'react-router';
import { useIsInspector } from '@/features/auth/api/use-is-inspector';
import { Loader2 } from 'lucide-react';

export const InspectorRoute = () => {
  const { data: isInspector, isLoading } = useIsInspector();

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!isInspector) return <Navigate to="/map" replace />;

  return <Outlet />;
};
