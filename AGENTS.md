# mig-sel (mig-sel)

React 19 + Vite + TypeScript + TailwindCSS v4 + shadcn/ui + TanStack Query + React Router v7 + Supabase.

## Commands

| Command              | What it does                                    |
| -------------------- | ----------------------------------------------- |
| `npm run dev`        | Vite dev server                                 |
| `npm run build`      | `tsc -b && vite build` (typecheck before build) |
| `npm run lint`       | ESLint flat config on `.`                       |
| `npm run format`     | Prettier on `.`                                 |
| `npm test`           | `vitest run` (7 tests exist)                    |
| `npm run test:watch` | `vitest` (watch mode)                           |

Pre-commit hook currently runs `npm test`. `lint-staged` is configured but not wired into the hook.

## Architecture

- **Feature-based** layout under `src/features/<name>/`. Each feature has optional subdirs: `api/`, `components/`, `hooks/`, `schemas/`, `types/`, `utils/`.
- **No barrel files** (`index.ts`). Always import directly: `@/features/posts/api/use-posts` not `@/features/posts`.
- **ESLint enforces** cross-feature imports are only allowed from those 6 subdirectory names. Shared code must be promoted to top-level `src/lib/`, `src/hooks/`, `src/schemas/`, etc.
- **`@/`** path alias points to `src/` (configured in vite.config.ts and tsconfig.json).

## Key conventions

- `verbatimModuleSyntax` — use `import type` for type-only imports.
- `erasableSyntaxOnly` — no `enum`, no `namespace`, no `constructor parameter properties`.
- Files and folders are **kebab-case**. Components export PascalCase, hooks export camelCase with `use` prefix, schemas get `-schema` suffix.
- TanStack Query hooks live in `features/*/api/` — never call `useQuery`/`useMutation` directly in a component.
- React Router v7 with `createBrowserRouter`. Pages in `src/routes/`, kept thin — logic belongs in features.
- shadcn/ui: components in `components/ui/` are locally owned (not a package). Add with `npx shadcn@latest add <name>`.
- Supabase client: single instance in `lib/supabase.ts`. Env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

## Notable quirks

- Tailwind v4: uses `@import 'tailwindcss'` in CSS, not legacy `@tailwind` directives.
- `tsconfig.json` references `tsconfig.app.json` (src) and `tsconfig.node.json` (vite.config.ts). Both are separate TypeScript projects.
- Husky pre-commit file runs `npm test` — it may need updating to `npx lint-staged` if you want pre-commit lint/format.
- 7 tests exist in `src/test/` using Vitest + React Testing Library + jsdom. Test setup in `src/test/setup.ts` (jest-dom matchers) and `src/test/test-utils.tsx` (renderWithProviders wrapper with router + query client).
- **chatbot knowledge updates**: seed files use `on conflict (question) do nothing` to avoid duplicates from repeated runs.
- **DB migrations are managed via Supabase CLI:** `npx supabase db push` applies pending migrations (requires `SUPABASE_ACCESS_TOKEN` env var).
- **Migration version uniqueness:** Each migration file must have a unique version prefix (the leading number). Duplicates will cause `schema_migrations_pkey` conflicts. Files like `20250527_add_upvote_count_trigger.sql` were renamed to `20250527000001_add_upvote_count_trigger.sql` to avoid this.
- OpenCode skill `supabase-postgres-best-practices` is locked in.
- **chatbot knowledge updates**: seed files use `on conflict (question) do nothing` to avoid duplicates from repeated runs.
- **Auto-update chatbot knowledge base:** Whenever I add or modify a feature, I must also update `supabase/migrations/20250529000006_seed_chatbot_knowledge.sql` with relevant Q&A entries and create a new migration to push changes. The chatbot knowledge base must always reflect the current state of the app.

## Cached Egress Reduction (always apply)

Every time I write or modify data-fetching code, I MUST consider cached egress impact:

1. **Never use `select('*')`** — always list explicit columns needed by the component.
2. **Set appropriate `staleTime`** — at least 2-5 min for slow-changing data (map, KB, leaderboard, profiles). Use 60s only for rapidly-changing data.
3. **Server-side filtering** — push WHERE/filter logic to Supabase queries, never download full tables and filter in JS.
4. **Server-side pagination** — use `.range()` on list queries. Never load all rows and paginate client-side.
5. **Lazy-load** — defer expensive queries (e.g., comments, details) until the dialog/modal is opened.
6. **Narrow invalidation** — mutations should only invalidate query keys that are directly affected, not blanket-invalidate 5+ keys.
7. **Image optimization** — use `loading="lazy"` on `<img>`, use Supabase image transforms (`?width=...&quality=...`) on storage URLs, restrict upload file types and sizes.
8. **Cache-Control headers** — set aggressive caching on static assets via deployment config.
