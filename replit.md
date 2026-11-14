# CrewCheck

Offline-oriented, tablet-first crew health training prototype for recording fictional observations, coordinating a scripted emergency scenario, and preparing a factual handoff. It is not validated medical equipment, flight-qualified software, clinical decision support, or NASA-endorsed.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/crewcheck run test:unit` — deterministic emergency-state tests
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

- `artifacts/crewcheck/` — CrewCheck PWA frontend, local data layer, emergency, measurement, mission, and handoff views.
- `artifacts/crewcheck/src/lib/local-store.ts` — IndexedDB record types and browser persistence.
- `artifacts/crewcheck/public/sw.js` — production service-worker app-shell caching.
- `artifacts/crewcheck/src/content/` — reviewable emergency and measurement wording, plus source index.
- `artifacts/crewcheck/README.md` and `DEMO.md` — run limitations and demo walkthrough.

## Architecture decisions

- Core records stay in browser IndexedDB; the shared API server and PostgreSQL are not used for CrewCheck.
- Mission, equipment, crew, and sensor examples are fictional. Do not present them as live inventory or NASA data.
- Emergency flow is deterministic; unknown details remain unknown and only reviewed onboard procedures are referenced.
- Private wellbeing entries are not included in handoff exports, but this shared-device prototype has no access control.

## Product

The first prototype milestone includes a fictional chest-pain scenario, crew observation/review, manual measurement entry, mission profiles, fictional routines/equipment, a non-causal habitat timeline, and offline handoff exports. Source-reviewed procedures, real data integrations, AI, live devices, and production-grade access control are not implemented.

## User preferences

- Use Free Mode first. Notify the user before recommending or switching to paid Power usage.

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
