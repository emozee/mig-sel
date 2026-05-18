import { createBrowserRouter } from 'react-router-dom';
import { LandingPage } from './landing-page';
import { HomePage } from './home-page';
import { LoginPage } from './login-page';
import { NotFoundPage } from './not-found-page';
import { AuthCallbackPage } from './auth-callback-page';
import { MapPage } from './map-page';
import { ProtectedRoute } from '@/components/layout/protected-route';
import { AdminRoute } from '@/components/layout/admin-route';

export const router = createBrowserRouter([
  {
    path: '/',
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
    path: '/dashboard',
    element: <ProtectedRoute />,
    children: [
      {
        element: <AdminRoute />,
        children: [{ index: true, element: <HomePage /> }],
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
