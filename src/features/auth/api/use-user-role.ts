import { useCurrentUser } from './use-current-user';

export const useUserRole = () => {
  const { user, isLoading, ...rest } = useCurrentUser();

  const role = user?.app_metadata?.role ?? user?.user_metadata?.role;
  const isAdmin = role === 'admin' || role === 'super_admin';
  const isSuperAdmin = role === 'super_admin';
  const isInspector = role === 'inspector' || role === 'super_admin';

  return { isAdmin, isSuperAdmin, isInspector, isLoading, user, ...rest };
};
