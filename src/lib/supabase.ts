// import { createBrowserClient } from '@supabase/ssr';
// import type { Database } from '@/types/database';

// export const supabase = createBrowserClient<Database>(
//   import.meta.env.VITE_SUPABASE_URL,
//   import.meta.env.VITE_SUPABASE_ANON_KEY,
// );

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) throw new Error('Missing VITE_SUPABASE_URL env var');
if (!supabaseAnonKey) throw new Error('Missing VITE_SUPABASE_ANON_KEY env var');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
