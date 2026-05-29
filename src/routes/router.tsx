import { createBrowserRouter, redirect } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { getUserRole } from '@/lib/role-query';
import { LandingPage } from './landing-page';
import { LoginPage } from './login-page';
import { AdminPage } from './admin-page';
import { InspectorPage } from './inspector-page';
import { NotFoundPage } from './not-found-page';
import { AuthCallbackPage } from './auth-callback-page';
import { MapPage } from './map-page';
import { ReportPage } from './report-page';
import { ComplaintDetailPage } from './complaint-detail-page';
import { LeaderboardPage } from './leaderboard-page';
import { CommunityPage } from './community-page';
import { ShopPage } from './shop-page';
import { ProfilePage } from './profile-page';
import { ProtectedRoute } from '@/components/layout/protected-route';
import { AdminRoute } from '@/components/layout/admin-route';
import { InspectorRoute } from '@/components/layout/inspector-route';

export const router = createBrowserRouter([
  {
    path: '/',
    loader: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return null;

      const role = await getUserRole(session);

      if (role === 'admin') return redirect('/dashboard');
      if (role === 'inspector') return redirect('/inspector');
      return redirect('/map');
    },
    element: <LandingPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/auth/callback',
    element: <AuthCallbackPage />,
  },
  {
    path: '/map',
    element: <ProtectedRoute />,
    children: [{ index: true, element: <MapPage /> }],
  },
  {
    path: '/report',
    element: <ProtectedRoute />,
    children: [{ index: true, element: <ReportPage /> }],
  },
  {
    path: '/leaderboard',
    element: <ProtectedRoute />,
    children: [{ index: true, element: <LeaderboardPage /> }],
  },
  {
    path: '/community',
    element: <ProtectedRoute />,
    children: [{ index: true, element: <CommunityPage /> }],
  },
  {
    path: '/shop',
    element: <ProtectedRoute />,
    children: [{ index: true, element: <ShopPage /> }],
  },
  {
    path: '/profile',
    element: <ProtectedRoute />,
    children: [{ index: true, element: <ProfilePage /> }],
  },
  {
    path: '/inspector',
    element: <ProtectedRoute />,
    children: [
      {
        element: <InspectorRoute />,
        children: [{ index: true, element: <InspectorPage /> }],
      },
    ],
  },
  {
    path: '/dashboard',
    element: <ProtectedRoute />,
    children: [
      {
        element: <AdminRoute />,
        children: [
          { index: true, element: <AdminPage /> },
          { path: 'complaint/:id', element: <ComplaintDetailPage /> },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
