# Valuation Backend

This backend powers both the public owner-mode questionnaire and the separate internal admin lab.

## Status

- The current `engine.mjs` is a frozen legacy heuristic for local experimentation.
- It should not be extended as the long-term Afrexit valuation model.
- The canonical redesign plan now lives in `docs/valuation-engine/afrexit-valuation-engine-master-plan.md`.
- The live backend entry now runs through `owner-engine.mjs`, which is the owner-phase engine built around the canonical schema and policy registry.
- Persistence and admin auth are now handled through Supabase Postgres + Supabase Auth.

## Run locally

1. From the repo root, start the normal local app stack:

```bash
npm run dev
```

This starts the frontend and backend only. It does not touch Docker. With the current local env, admin dev bypass stays enabled so the admin lab remains usable without Supabase.

2. If you want the app stack plus Dockerized local Supabase:

```bash
npm run dev:with-supabase
```

You can also manage the Dockerized Supabase stack directly with:

```bash
npm run supabase:start
npm run supabase:status
npm run supabase:stop
npm run supabase:reset
```

3. Open the public estimator:

```text
http://localhost:5173/
```

4. Open the internal admin lab:

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

- Admin routes require a Supabase bearer token and a matching `admin_users` allowlist row unless `ADMIN_DEV_BYPASS=true`.
- When admin dev bypass is enabled and Supabase is not configured, submissions, scenarios, and internal observations stay in memory for the current backend process.
- If local Supabase gets into an unhealthy Docker loop, `npm run dev:with-supabase` now attempts one automatic reset and `npm run supabase:reset` is the explicit cleanup command.
- Apply the schema in [20260319_clean_admin_lab.sql](/Users/deolunathan/Downloads/BB/AfrexitPro/supabase/migrations/20260319_clean_admin_lab.sql) before using the admin or persistence features.
- Setup details and endpoint scope are documented in [admin-lab-supabase-storage.md](/Users/deolunathan/Downloads/BB/AfrexitPro/docs/valuation-engine/admin-lab-supabase-storage.md).
