# mig-sel (mig-sel)

React 19 + Vite + TypeScript + TailwindCSS v4 + shadcn/ui + TanStack Query + React Router v7 + Supabase.

## Session context — READ FIRST (do not ask the user to repeat any of this)

Non-negotiable facts about this project — full session history lives at the bottom of this file.

- **`.env` targets PRODUCTION Supabase** (project `sblxdxqoxnmgctdmuvtb`, region Sydney). Dev server hits prod data/storage/functions. Never run destructive operations without explicit confirmation.
- **Admins review every grievance** before approval/map display. AI moderation may therefore fail-open (accept on error) by design.
- **AI photo classifier**: `supabase/functions/classify-grievance-image/index.ts` (Deno). Model `Qwen/Qwen3-VL-30B-A3B-Instruct:deepinfra` via `https://router.huggingface.co/v1/chat/completions` using `HUGGINGFACE_API_KEY`. CLIP/zero-shot and `api-inference.huggingface.co` are DEAD — do not revert to them. featherless-ai rejects image inputs via the router — keep the `:deepinfra` pin. Results cached by SHA-256 in `public.image_classifications`; frontend passes the hash.
- **Dead-code scans**: use `npx knip` (configured via `knip.json`). Unused exports were intentionally kept for future use — don't flag them again.
- **Deno editor types** come from `supabase/functions/globals.d.ts` + local `tsconfig.json` — no Deno extension required; don't "fix" those files as if they were Node code.
- **Owner context**: solo founder pitching MIGSEL to investors (PELSUP programme, notes in `Pitching course/session-notes.md`). Plain English. Never invent traction numbers — placeholders must be marked clearly.
- Pending user to-do: rotate the Supabase access token that was shared in chat once.

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
- **chatbot knowledge updates**: seed files use `on conflict (question) do nothing` to avoid duplicates from repeated runs (corrections may use `do update`).
- **DB migrations are managed via Supabase CLI:** `npx supabase db push` applies pending migrations (requires `SUPABASE_ACCESS_TOKEN` env var).
- **Migration version uniqueness:** Each migration file must have a unique version prefix (the leading number). Duplicates will cause `schema_migrations_pkey` conflicts. Files like `20250527_add_upvote_count_trigger.sql` were renamed to `20250527000001_add_upvote_count_trigger.sql` to avoid this.
- OpenCode skill `supabase-postgres-best-practices` is locked in.
- **Auto-update chatbot knowledge base:** Whenever a feature is added or modified, update chatbot knowledge via a NEW migration with relevant Q&A entries (`supabase/migrations/20250529000006_seed_chatbot_knowledge.sql` holds the original set). The knowledge base must always reflect the current state of the app.
- **Storage deletions cannot use SQL** — `storage.objects` has a protect trigger; use the Storage API (service role). For one-off cleanups, deploy a temporary key-protected edge function, then delete it and its secret afterwards.

## Cached Egress Reduction (always apply)

Every time data-fetching code is written or modified, cached egress impact MUST be considered:

1. **Never use `select('*')`** — always list explicit columns needed by the component.
2. **Set appropriate `staleTime`** — at least 2-5 min for slow-changing data (map, KB, leaderboard, profiles). Use 60s only for rapidly-changing data.
3. **Server-side filtering** — push WHERE/filter logic to Supabase queries, never download full tables and filter in JS.
4. **Server-side pagination** — use `.range()` on list queries. Never load all rows and paginate client-side.
5. **Lazy-load** — defer expensive queries (e.g., comments, details) until the dialog/modal is opened.
6. **Narrow invalidation** — mutations should only invalidate query keys that are directly affected, not blanket-invalidate 5+ keys.
7. **Image optimization** — use `loading="lazy"` on `<img>`, use Supabase image transforms (`?width=...&quality=...`) on storage URLs, restrict upload file types and sizes.
8. **Cache-Control headers** — set aggressive caching on static assets via deployment config.

---

## Session history (append-only — add a dated entry after each working session)

### 2026-08-23 — AI moderation debugging day

- User reported AI not rejecting selfies/dogs. Diagnosis journey: deployed edge function was STALE (missing cache code entirely — `image_classifications` stayed empty). Redeployed → cache verified working (dog → animal 0.95 blocked, repeat call served from cache).
- Root cause CONFIRMED via amber banner ("failed to send a request"): **functions gateway CORS preflight only allows `Content-Type` + `Authorization`** — supabase-js `functions.invoke` always sends `apikey` + `x-client-info`, so EVERY browser invocation was blocked since the VLM rebuild while curl/Node tests passed. Fix: wrapper now uses plain `fetch` with only the two allowed headers; token = session access_token ?? anon key; one refreshSession+retry on 401/403.
- Fixes shipped: `classify-grievance-image.ts` now retries once after `refreshSession()` on jwt/401-ish errors; report page shows an AMBER BANNER when classification fails open (`AI photo check unavailable (<reason>)`) so failures are never invisible; file-hash race fixed via `fileHashRef` (recomputed at submit if missing).
- **"Nearby reports found" dialog REMOVED** per founder decision — duplicate warning only fires for identical photo hashes within 10m. `check-nearby-grievances` RPC still exists in DB (unused by report flow).
- Test artifacts purged twice (3+2 grievance rows + storage JPGs) via temporary protected edge function pattern.
- KB migration `20260823000001_update_chatbot_kb_duplicate_policy.sql` updates chatbot answers re duplicate policy.
- Verification: build PASS, eslint 0 errors, tests 7/7. Awaiting user browser re-test — amber banner will reveal exact failure reason if it recurs.
- **Browser re-test PASSED**: dog photo now shows "Photo may not show an issue (detected as: animal, 95%)" — AI moderation works end-to-end in the real UI.
- Founder confusion re admin review resolved: founder's own account is NOT an admin; flagged-but-submitted reports appear under `/dashboard` → "Unapproved" tab for admins. Founder chose to log in as one of 5 existing admin accounts rather than be promoted.
- Founder confusion re admin review resolved: founder IS `super_admin` (Nima Yoezer). Role-parity fixes shipped: announcements form/list + auth-callback now include `super_admin`; migration `20260823000002_announcement_policies_role_parity.sql` broadens announcement write policies to official+admin+super_admin (UI previously promised admins what RLS denied). Complaints list staleTime 120s→60s so fresh submissions surface faster on `/dashboard` → "Unapproved" tab.
- **Role-parity PRINCIPLE (founder rule): `super_admin` must always have every power of every other role (admin, official, inspector) plus extras.** When adding any role-gated feature, include super_admin everywhere: UI checks, route guards, AND DB policies/RPCs. Full audit done 2026-08-23: use-is-official/use-is-inspector/use-user-role/profile-page now grant super_admin official+inspector access; migration `20260823000003_role_parity_super_admin.sql` broadened chatbot_knowledge write policies and admin_remove_diamond RPC to admin+super_admin.
- **AI flag visibility for admins**: `grievances.ai_label text` column added (migration `20260823000004_grievance_ai_label_and_kb.sql`); report page stores `top_label` when user submits via the spam dialog; admin monitor shows amber "AI: <label>" badge in the Category column. Permanent delete already existed (monitor trash/reject + complaint detail; grievances RLS is OFF so deletes are not policy-blocked).
- Second access token (sbp_ffadd…) pasted in chat — ROTATION STILL PENDING (now two tokens exposed).

### 2026-08-22 — AI classifier rebuilt end-to-end, cleanup day

- **Pitching course**: extracted Day 2 (`Speaking the Language of Startups.pdf`) + Day 3 (`Business-Etiquette-Investor-Comms-Professional-Writing.pptx.pdf`) slide decks with pypdf; wrote Day 2 + Day 3 entries into `Pitching course/session-notes.md`; drafted 3-sentence cold investor email (proof point still a PLACEHOLDER — no real traction numbers exist yet).
- **Classifier found silently broken**: function called retired `api-inference.huggingface.co`; fail-open meant nothing was ever classified. hf-inference no longer hosts ANY zero-shot-image-classification models (CLIP/SigLIP all dropped). First VLM attempt (Qwen2.5-VL-7B on featherless-ai) failed — featherless rejects image inputs through the HF router.
- **Final setup**: Qwen3-VL-30B-A3B pinned to deepinfra, strict-JSON prompt + synonym fallback parser, confidence score returned, 3× retry w/ backoff, SHA-256 hash cache in new `image_classifications` table (migration `20260822000001_image_classifications_cache_and_knowledge.sql` also corrected stale chatbot KB answers). Frontend call sites pass the computed file hash. Verified production: pothole→accepted 0.95, person_selfie/dog/landscape→blocked.
- **Test artifacts purged**: orphaned storage JPGs deleted via temporary protected edge function (removed afterwards — storage.blocks SQL deletes), dummy cache rows removed, grievances table verified empty for test window. Local test images: `C:\Users\User\Desktop\migsel-test-images\`.
- **Security**: a Supabase access token (sbp_…) was pasted into chat and used for deploys — USER STILL NEEDS TO ROTATE IT.
- **Dead-code sweep (knip)**: uninstalled react-router-dom, @supabase/ssr, canvg, pptxgenjs, zod, react-hook-form, @hookform/resolvers, shadcn, @types/jspdf, globals. Deleted 15 dead files (super-admin cluster, root-layout, grievance-drawer, form/label shadcn primitives, user-settings-dialog, filter-layers-sheet, impact-goals, complaint-detail-dialog, use-random-feed-avatar, use-my-location, leaf-icon, types/grievance.ts). Added `knip.json`. Unused exports intentionally KEPT for future work.
- **Deno editor errors fixed without extension**: added `supabase/functions/globals.d.ts` + `supabase/functions/tsconfig.json` (+ optional `.vscode` Deno-extension recommendation).
- Post-cleanup verification: build PASS, eslint 0 errors, tests 7/7.

### 2026-05-23 — Complaint merging overhaul (admin side)

All changes in `complaint-monitor.tsx` unless noted:

- **Merge rules relaxed**: masterOptions = ALL complaints with `parent_id === null`; pending can merge to any status; in-progress → in-progress/resolved; resolved cannot be linked; masters can merge into other masters (reversible).
- **Grandchildren reassignment**: merging a master into another master reassigns all its children to the new master, preserving status cascade.
- **Merge modal enriched**: each master option shows photo thumbnail, title/description clamp, category/urgency/status badges.
- **Photo-click details modal**: clicking a complaint's image opens full details (fullscreen lightbox, badges, location); children show parent info on amber background; parents show their merged children list.
- **Map tweak** (`grievance-map.tsx`): "photo merged — better evidence" notification hidden when the complaint itself is a parent (`!childrenMap.has(g.id)`).
- Points system unchanged: pending 1/1, in-progress 2/1, resolved 4/2 (master/child).
