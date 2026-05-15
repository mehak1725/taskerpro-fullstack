# TaskerPro — Futuristic Team Task Manager

A full-stack SaaS platform for engineering teams. Cinematic dark UI (Linear/Vercel aesthetic), real-time analytics dashboard, kanban project management, team collaboration, and role-based access control.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/nexus run dev` — run the React frontend (port 18245)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — JWT signing secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 18 + Vite, Tailwind CSS, shadcn/ui, framer-motion, recharts, wouter
- API: Express 5 with pino logging
- DB: PostgreSQL + Drizzle ORM
- Auth: JWT (jsonwebtoken) + bcryptjs, stored in localStorage as `nexus_token`
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for all API contracts)
- `lib/db/src/schema/index.ts` — Database schema (users, projects, tasks, teamMembers, activityLogs)
- `lib/api-client-react/src/generated/api.ts` — Generated React Query hooks (do not edit manually)
- `lib/api-zod/src/generated/` — Generated Zod schemas (do not edit manually)
- `artifacts/api-server/src/routes/` — All Express route handlers
- `artifacts/api-server/src/lib/jwt.ts` — JWT sign/verify using SESSION_SECRET
- `artifacts/nexus/src/pages/` — All page components
- `artifacts/nexus/src/contexts/AuthContext.tsx` — Auth state management

## Architecture decisions

- Contract-first API: OpenAPI spec → Orval codegen → React Query hooks + Zod validation
- JWT tokens stored in localStorage; `setAuthTokenGetter` injects Authorization header on all API requests
- All routes use the `requireAuth` middleware from `artifacts/api-server/src/middlewares/auth.ts`
- RBAC: admin vs member roles, admin is assigned to first user to register
- Projects have an `enrichProject` helper that aggregates task/member counts and progress %

## Product

- **Landing page** — cinematic hero with features, testimonials, stats, and CTA
- **Auth** — signup (creates admin) and login pages with JWT
- **Dashboard (Mission Control)** — stats cards, sprint velocity chart, task breakdown bar chart, upcoming deadlines, live activity feed
- **Projects** — CRUD project list with progress bars, status badges, and member counts
- **Kanban board** — per-project board with 4 columns (Todo / In Progress / Review / Done), inline status change, add/delete tasks
- **Tasks** — unified task table across all projects with filtering by status/priority
- **Team** — member directory with role badges
- **Settings** — profile update and password change

## User preferences

- Cinematic dark UI: deep space navy background, electric blue primary, violet accent
- No light mode — always dark
- Framer Motion animations throughout

## Gotchas

- Always run codegen after editing openapi.yaml: `pnpm --filter @workspace/api-spec run codegen`
- Never import deep paths from `@workspace/api-client-react` — always use the main index
- After schema changes, run `pnpm --filter @workspace/db run push` before testing
- API server must be restarted after code changes (it builds to `dist/` on start)
- Demo credentials: `alex@nexus.dev` / `nexus123`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
