import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Some unit tests import the Supabase client even though their requests are
// mocked. Supply harmless local-only values when CI has no application env.
if (!import.meta.env.VITE_SUPABASE_URL) {
  vi.stubEnv('VITE_SUPABASE_URL', 'http://127.0.0.1:54321');
}
if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'unit-test-placeholder');
}
