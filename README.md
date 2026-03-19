# AfrexitPro

Owner-first valuation app for Nigerian SMEs.

This repository currently contains:

- a React + Vite frontend in the repo root
- a local valuation backend in `server/valuation-v2`
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

2. Start the full local stack:

```bash
npm run dev
```

3. Open:

- main app: `http://localhost:5173/`
- V2 lab entry: `http://localhost:5173/valuation-v2.html`
- local backend: `http://localhost:8788/`

## Useful Scripts

- `npm run dev` starts frontend and backend together
- `npm run dev:frontend` starts only the Vite frontend
- `npm run dev:backend` starts only the local valuation backend
- `npm run valuation:v2:fixtures` runs owner-mode regression fixtures against local modules
- `npm run valuation:v2:fixtures:api` runs owner-mode regression fixtures against the local API

## Notes

- The V2 backend is local-only and intentionally separate from any live estimator flow.
- Frontend API calls default to `http://localhost:8788` unless `VITE_VALUATION_API_URL` is set.
- Backend port defaults to `8788` unless `VALUATION_V2_PORT` is set.
