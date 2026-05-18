import { createBrowserRouter } from 'react-router-dom';
import { LandingPage } from './landing-page';
import { HomePage } from './home-page';
import { LoginPage } from './login-page';
import { NotFoundPage } from './not-found-page';

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
    path: '/dashboard',
    element: <HomePage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
