# Pulse Beyond

Offline-oriented, tablet-first PWA for recording fictional crew observations, coordinating a scripted emergency scenario, and preparing a factual handoff. It is not validated medical equipment, flight-qualified software, clinical decision support, or NASA-endorsed.

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

- `artifacts/crewcheck/` — Pulse Beyond PWA frontend, local data layer, emergency, measurement, mission, and handoff views.
- `artifacts/crewcheck/src/lib/local-store.ts` — IndexedDB record types and browser persistence.
- `artifacts/crewcheck/public/sw.js` — production service-worker app-shell caching.
- `artifacts/crewcheck/src/content/` — reviewable emergency and measurement wording, plus source index.
- `artifacts/crewcheck/README.md` and `DEMO.md` — run limitations and demo walkthrough.

## Architecture decisions

- Core records stay in browser IndexedDB; the shared API server and PostgreSQL are not used for Pulse Beyond. Keep the existing internal storage identifiers when rebranding so saved records remain available.
- Mission, equipment, crew, and sensor examples are fictional. Do not present them as live inventory or NASA data.
- NASA 3D assets are optional illustrative references, separate from fictional habitat zones. They do not establish verified current layouts, medical procedures, equipment positions or live telemetry. Self-host their decoding dependencies for offline use.
- Emergency flow is deterministic; unknown details remain unknown and only reviewed onboard procedures are referenced.
- Private wellbeing entries are not included in handoff exports, but this shared-device prototype has no access control.

## Product

The prototype includes general emergency-help recording, crew observation/review, manual measurement entry, mission profiles, fictional routines/equipment, a non-causal habitat timeline, and offline handoff exports. Earlier chest-pain demo records are preserved as historical records. Source-reviewed procedures, real data integrations, AI, live devices, and production-grade access control are not implemented.

## Usability requirements

- The users are not doctors. Use plain observations, not diagnoses or clinical interpretation.
- The product name is Pulse Beyond. Use the user-supplied astronaut logo and its midnight navy, cream, gold and turquoise palette.
- Keep tablet screens simple: essentials and one next action first; expose setup, research, history, and forms only when requested.
- Crew members must be able to describe how they feel in their own words using both typing and optional voice. Guide reporting with plain follow-ups, not diagnoses. Voice needs explicit consent and an editable transcript; typing must remain available offline.
- Emergency is general help for any urgent concern, not a chest-pain-only scenario. Do not require symptom classification, measurements, or completing a form before showing how to get onboard help.
- Demo material and honest testing evidence are preparation for a later presentation. Do not start creating the presentation until the user explicitly asks.

## User preferences

- Use Free Mode first. Notify the user before recommending or switching to paid Power usage.

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
