# AfrexitPro

Owner-first valuation app for Nigerian SMEs.

This repository currently contains:

- a React + Vite frontend in the repo root
- a local valuation backend in `server/valuation`
- the canonical valuation-engine plan in `docs/valuation-engine/afrexit-valuation-engine-master-plan.md`
- the adaptive questionnaire product draft in `docs/ADAPTIVE_QUESTIONNAIRE_PRD.md`

## Current Status

Based on the master plan, the owner-phase valuation foundation is already in place:

- canonical request/result contracts exist
- the shared policy registry is wired on frontend and backend
- the owner-mode backend is modularized around request validation, normalization, method selection, approaches, bridge, confidence, history, and output
- benchmark/admin workflows, internal observations, and regression fixtures already exist

Current active work in this repo is the next UX layer on top of that foundation:

- adaptive questionnaire flow
- partial valuation updates during intake
- richer multi-year financial intake
- ongoing benchmark provenance cleanup and calibration refinement

## Run Locally

1. Install dependencies:

```bash
npm install
```

2. Normal local dev starts only the app stack:

```bash
npm run dev
```

This starts the Vite frontend and the local valuation backend. It does not start Docker or local Supabase.
The current `.env.local` keeps the admin dev bypass enabled, so local admin testing works without Supabase.

3. If you want Dockerized local Supabase as well:

```bash
npm run dev:with-supabase
```

You can also manage the Dockerized Supabase stack directly:

```bash
npm run supabase:start
npm run supabase:status
npm run supabase:stop
npm run supabase:reset
```

4. If you later switch to hosted Supabase, keep using `npm run dev`, turn both admin bypass flags off in `.env.local`, and add real hosted Supabase credentials there.

5. Open:

- main app: `http://localhost:5173/`
- Public app: `http://localhost:5173/`
- Admin lab: `http://localhost:5173/admin-lab.html`
- local backend: `http://localhost:8788/`

## Useful Scripts

- `npm run dev` starts frontend and backend together
- `npm run dev:with-supabase` starts frontend/backend and injects a running local Docker Supabase into that session
- `npm run dev:full` is an alias for `npm run dev:with-supabase`
- `npm run dev:frontend` starts only the Vite frontend
- `npm run dev:backend` starts only the local valuation backend
- `npm run supabase:start` starts or reuses the local Docker Supabase stack
- `npm run supabase:status` shows whether local Docker Supabase is already running
- `npm run supabase:stop` stops the local Docker Supabase stack
- `npm run supabase:reset` force-cleans local Supabase Docker containers, networks, and data volume when Docker gets stuck
- `npm run valuation:fixtures` runs owner-mode regression fixtures against local modules
- `npm run valuation:fixtures:api` runs owner-mode regression fixtures against the local API

## Notes

- The valuation backend is local-only and intentionally separate from any live estimator flow.
- Frontend API calls default to `http://localhost:8788` unless `VITE_VALUATION_API_URL` is set.
- Backend port defaults to `8788` unless `VALUATION_PORT` is set.
- With admin dev bypass enabled and no Supabase configured, admin auth is bypassed and admin data uses in-memory storage for the current backend process.
- If you switch between `npm run dev` and `npm run dev:with-supabase`, stop any already-running frontend/backend once before switching modes so the right env is injected.
- If `npm run dev:with-supabase` detects a broken local Supabase Docker state, it will attempt one automatic local reset before failing.
