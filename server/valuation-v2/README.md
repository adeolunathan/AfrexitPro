# Valuation V2 Local Backend

This backend is intentionally separate from the live Afrexit estimator.

## Status

- The current `engine.mjs` is a frozen legacy heuristic for local experimentation.
- It should not be extended as the long-term Afrexit valuation model.
- The canonical redesign plan now lives in `docs/valuation-engine/afrexit-valuation-engine-master-plan.md`.
- The local backend entry now runs through `owner-engine.mjs`, which is the new owner-phase skeleton built around the canonical schema and policy registry.

## Run locally

1. From the repo root, start the full local stack:

```bash
npm run dev
```

2. Open the V2 lab entry:

```text
http://localhost:5173/valuation-v2.html
```

Optional split commands:

```bash
npm run dev:frontend
```

```bash
npm run dev:backend
```

## Notes

- The V2 page is guarded so it only runs on localhost.
- The backend stores test submissions in `server/valuation-v2/data/submissions.ndjson`.
- Nothing here is wired into `src/App.tsx` or the current Google Apps Script flow.
