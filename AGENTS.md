# mig-sel (mig-sel)

React 19 + Vite + TypeScript + TailwindCSS v4 + shadcn/ui + TanStack Query + React Router v7 + Supabase.

## Commands

| Command | What it does |
|---------|-------------|
| `npm run dev` | Vite dev server |
| `npm run build` | `tsc -b && vite build` (typecheck before build) |
| `npm run lint` | ESLint flat config on `.` |
| `npm run format` | Prettier on `.` |
| `npm test` | Placeholder — no tests exist yet |

Pre-commit hook currently runs `npm test` (no-op). `lint-staged` is configured but not wired into the hook.

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
- No tests exist; `npm test` prints `"No tests yet"`.
- OpenCode skill `supabase-postgres-best-practices` is locked in.
