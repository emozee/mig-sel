import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { router } from './routes/router';
import { queryClient } from './lib/query-client';
import { AuthProvider } from './providers/auth-provider';
import { Toaster } from 'sonner';
import './styles/globals.css';
import 'leaflet/dist/leaflet.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster
          position="top-center"
          richColors
          closeButton
          toastOptions={{ style: { fontSize: '13px' } }}
        />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
