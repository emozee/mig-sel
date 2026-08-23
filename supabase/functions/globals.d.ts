// Type shims so editors (tsserver) understand Deno-specific APIs used by
// Supabase Edge Functions. If the Deno VS Code extension is installed, it
// provides the real types and these shims are simply unused.

declare namespace Deno {
  export interface Env {
    get(key: string): string | undefined;
  }
  export const env: Env;
}

declare module 'https://deno.land/*';
declare module 'https://esm.sh/*';
