# Valuation Backend

This backend powers both the public owner-mode questionnaire and the separate internal admin lab.

## Status

- The current `engine.mjs` is a frozen legacy heuristic for local experimentation.
- It should not be extended as the long-term Afrexit valuation model.
- The canonical redesign plan now lives in `docs/valuation-engine/afrexit-valuation-engine-master-plan.md`.
- The live backend entry now runs through `owner-engine.mjs`, which is the owner-phase engine built around the canonical schema and policy registry.
- Persistence and admin auth are now handled through Supabase Postgres + Supabase Auth.

## Run locally

1. From the repo root, start the full local stack:

```bash
npm run dev
```

2. Open the public estimator:

```text
http://localhost:5173/
```

3. Open the internal admin lab:

```text
http://localhost:5173/admin-lab.html
```

Optional split commands:

```bash
npm run dev:frontend
```

```bash
npm run dev:backend
```

## Notes

- Admin routes require a Supabase bearer token and a matching `admin_users` allowlist row.
- Apply the schema in [20260319_clean_admin_lab.sql](/Users/deolunathan/Downloads/BB/AfrexitPro/supabase/migrations/20260319_clean_admin_lab.sql) before using the admin or persistence features.
- Setup details and endpoint scope are documented in [admin-lab-supabase-storage.md](/Users/deolunathan/Downloads/BB/AfrexitPro/docs/valuation-engine/admin-lab-supabase-storage.md).
