import { useCurrentUser } from './use-current-user';

export const useUserRole = () => {
  const { user, isLoading, ...rest } = useCurrentUser();

  const role = user?.app_metadata?.role ?? user?.user_metadata?.role;
  const isAdmin = role === 'admin';
  const isInspector = role === 'inspector';

  return { isAdmin, isInspector, isLoading, user, ...rest };
};
