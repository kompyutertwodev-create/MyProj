# IdentityPlatform

An enterprise DDD monorepo for identity, tenant, billing, notification, and
audit management, built API-first with a strict composition-root / module
separation.

## Run & Operate

- `pnpm --filter @workspace/api run dev` — run the API composition root
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- Required env: none yet configured (DB/Redis/etc. wiring is deferred until
  `packages/platform`'s database/cache capabilities are built out)

## Stack

- pnpm workspaces, Node.js 22+, TypeScript 5.9
- API: Express 5, pino logging, zod validation
- Frontend: Next.js (`web`, `admin`), TanStack Query/Router/Form/Table/Virtual,
  Zustand, Tailwind CSS, shadcn/ui-style components, Lucide icons
- Mobile: Expo (SDK 53) / React Native
- DB (planned): PostgreSQL + Drizzle ORM
- Build: esbuild (ESM bundle) for `apps/api`

## Where things live

- `apps/` — composition roots only, no business logic: `api` (Express HTTP
  layer — **the only thing clients call**), `web`, `admin` (Next.js), `telegram`
  (bot), `mobile` (Expo)
- `modules/` — business logic, one per bounded context, hexagonal layout
  (domain / application / infrastructure / presentation): `iam`, `billing`,
  `subscription`, `tenant`, `notification`, `audit`, `catalog`, `content`,
  `viewing`, `media`, `search`, `analytics`, `access-control`, `features`,
  `devices`, `integrations`, `advertising`, `social`, `admin`, `reports`.
  `iam` is **Identity-First**: the first module built, not a shared
  dependency — other modules only ever hold a `userId: string`, never import
  IAM's domain types. Modules never import each other directly (not even via
  `contracts`) — only Event/Command/Query. See `docs/architecture.md` §3, §9.
- `packages/` — technical capabilities: `kernel` (DDD building blocks, zero
  deps), `contracts` (DTOs only, depends only on kernel), `platform`
  (backend: logger, config, database, cache, messaging, storage, security,
  observability, validation, errors, scheduler, locking, server),
  `platform/client` (`@workspace/platform-client` — frontend capabilities:
  http, query, router, forms, table, virtual, storage, state, theme,
  browser, auth, notifications, analytics, cookies, hooks), `ui` (UI
  components only — no hooks/constants/utils beyond `cn`/`composeRefs`/`slot`),
  `tooling` (eslint/prettier/tsconfig/test-utils/scripts)
- `docs/architecture.md` — the frozen v1.0 architecture decision record
  (dependency matrix, capability map, frontend TDR); read this before
  restructuring any package
- This is currently a **structure-only skeleton**: every package/module
  matches the architecture as empty scaffold files. Real logic exists so far
  only in `apps/api` (working Express composition root) and
  `packages/platform`'s logger. Everything else is intentionally deferred.
- The Replit artifact system was removed for this project — there is no
  `artifacts/` directory; the project deploys directly as an application.

## Architecture decisions

- See `docs/architecture.md` for the full frozen v1.0 record. Key points:
  Identity-First (not Identity-Centric), no `apps/api`-bypassing client
  calls, no `utils/shared/common` catch-alls anywhere, `platform/client` is
  a separate workspace package so frontend bundles never pull in backend
  native deps.

## Product

_Describe the high-level user-facing capabilities of this app once they exist._

## User preferences

- Uzbek-speaking; explains architecture in Uzbek. Wants the architecture
  docs' decisions followed exactly, no deviation without an explicit
  architecture-review decision.
- `apps/api` is the sole HTTP entrypoint — never add routes anywhere else.

## Gotchas

- There is no running workflow/preview right now (artifact was removed).
  Set up a workflow for `apps/api` (and `web`/`admin` if needed) before
  expecting anything to be visible in the preview pane.
- `packages/platform` (backend) and `packages/platform/client` (frontend)
  are two separate workspace packages, both physically nested under
  `packages/platform/` — don't confuse the folder nesting for a single
  package.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup,
  and package details.
- See `docs/architecture.md` before adding a package, moving a capability,
  or introducing a new top-level folder.

## Git Workflow Test

This change was created on the main development computer.

## Second Computer Test

This change was created on the second development computer.
