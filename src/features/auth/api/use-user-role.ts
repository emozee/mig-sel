import { useCurrentUser } from './use-current-user';

export const useUserRole = () => {
  const { user, isLoading, ...rest } = useCurrentUser();

  const isAdmin = user?.app_metadata?.role === 'admin' || user?.user_metadata?.role === 'admin';

  return { isAdmin, isLoading, user, ...rest };
};
