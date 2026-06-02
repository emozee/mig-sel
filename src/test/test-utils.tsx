import { type ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
}

interface WrapperOptions {
  initialEntries?: string[];
}

export function renderWithProviders(ui: ReactNode, options?: RenderOptions & WrapperOptions) {
  const queryClient = createTestQueryClient();
  const { initialEntries = ['/'], ...renderOptions } = options ?? {};

  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
      },
    ],
    { initialEntries },
  );

  return {
    ...render(<RouterProvider router={router} />, renderOptions),
    queryClient,
  };
}
