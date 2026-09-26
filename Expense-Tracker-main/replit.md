# Quiet Ledger

Quiet Ledger is a local-first personal expense tracker for reviewing monthly spending and keeping a simple, judgment-free ledger.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/expense-tracker/src/App.tsx` — dashboard, expense CRUD flow, filters, month navigation, and local persistence.
- `artifacts/expense-tracker/src/index.css` — visual theme, typography, motion, responsive layout, and shared utility styles.
- `artifacts/expense-tracker/package.json` — web artifact scripts and dependencies.

## Architecture decisions

- Expense data is stored in browser localStorage so the first build works without account or database setup.
- The dashboard seeds example entries only when no local ledger exists, then preserves user changes across reloads.
- The UI is intentionally a single-route personal utility with responsive navigation and modal-based editing.

## Product

Users can review monthly totals, remaining budget, spending rhythm, category breakdowns, and recent expenses. They can add, edit, delete, search, filter, and move between months.

## User preferences

None recorded.

## Gotchas

- The ledger is browser-local and does not sync between devices or browsers.
- The artifact workflow supplies `PORT` and `BASE_PATH`; use the managed workflow to run the app.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
