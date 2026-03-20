# Admin Lab + Supabase Storage

This build moves Afrexit valuation persistence and internal testing onto **Supabase Postgres + Supabase Auth** and treats **₦ millions** as the single monetary unit across intake, canonical requests, engine calculations, stored snapshots, and admin scenario testing.

## What changed

- Public submissions now persist to `valuation_submissions` in Supabase.
- Internal scenarios persist to `admin_scenarios`.
- Internal observation capture persists to `internal_observations`.
- Admin access is no longer local-host gated; it is authenticated with Supabase Auth and then allowlisted through `admin_users`.
- The internal testing surface is a separate frontend entry at `/admin-lab.html`.

## Environment

Frontend:

- `VITE_VALUATION_API_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Backend:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VALUATION_PORT`

The public questionnaire remains unauthenticated. Only admin routes require a Supabase bearer token that also matches an allowlisted row in `admin_users`.

## Supabase schema

Apply the migration in [20260319_clean_admin_lab.sql](/Users/deolunathan/Downloads/BB/AfrexitPro/supabase/migrations/20260319_clean_admin_lab.sql).

Core tables:

- `admin_users`
- `valuation_submissions`
- `admin_scenarios`
- `internal_observations`

Snapshots are stored as JSONB so the canonical request/result can be preserved exactly, while the most important reporting and search fields are also stored in indexed scalar columns.

## Admin workflow

1. Open `/admin-lab.html`.
2. Sign in with a Supabase user that is also present in `admin_users`.
3. Start from:
   - a blank scenario
   - a saved public submission
   - a saved admin scenario
4. Use **Scenario Lab** to edit answers directly and rerun valuation without replaying the public flow.
5. Use **Sensitivity Matrix** to mutate one question across multiple options from the same baseline.
6. Save useful baselines back into `admin_scenarios`.

## Monetary model

All monetary values are stored and calculated in **₦ millions**:

- questionnaire financial history
- working-capital inputs
- normalization inputs
- bridge inputs
- forecast inputs
- stored request snapshots
- stored result snapshots
- admin scenario edits

No supported runtime path should assume raw naira integers.

## Supported endpoints

Public:

- `POST /api/valuation`
- `POST /api/valuation/partial`

Admin:

- `GET /api/admin/submissions`
- `GET /api/admin/submissions/:id`
- `GET /api/admin/scenarios`
- `POST /api/admin/scenarios`
- `PATCH /api/admin/scenarios/:id`
- `POST /api/admin/scenarios/:id/run`
- `POST /api/admin/run`
- `POST /api/admin/sensitivity`
- `GET|POST|PATCH|DELETE /api/admin/internal-observations`

## Notes

- The runtime no longer uses NDJSON submission or observation files.
- Fixture regression and the sensitivity CLI remain useful for automated checks, but the admin lab is the main repeated-testing surface for humans.
