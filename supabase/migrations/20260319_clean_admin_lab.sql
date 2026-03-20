create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null unique,
  role text not null default 'admin',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.valuation_submissions (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  business_name text not null,
  first_name text not null,
  last_name text,
  email text not null,
  whatsapp text not null,
  respondent_role text,
  level1 text,
  level2 text,
  policy_group_id text,
  primary_state text,
  adjusted_value_millions numeric,
  low_estimate_millions numeric,
  high_estimate_millions numeric,
  readiness_score numeric,
  confidence_score numeric,
  answers_snapshot_jsonb jsonb,
  request_snapshot_jsonb jsonb not null,
  result_snapshot_jsonb jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_scenarios (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text default '',
  source_type text not null,
  source_submission_id uuid references public.valuation_submissions(id) on delete set null,
  tags text[] not null default '{}',
  notes text default '',
  answers_snapshot_jsonb jsonb,
  request_snapshot_jsonb jsonb,
  result_snapshot_jsonb jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.internal_observations (
  id text primary key,
  case_id text not null,
  company_alias text,
  case_type text not null,
  case_stage text not null,
  transaction_context text not null,
  policy_group_id text not null,
  level1 text,
  level2 text,
  primary_state text,
  metric text not null,
  basis text not null,
  value numeric not null,
  source_kind text not null,
  size_band text not null,
  quality text not null,
  observed_at text not null,
  source_name text not null,
  source_url text,
  source_date text,
  notes text,
  calibration_eligible boolean not null default false,
  entered_by text,
  source_submission_id text,
  source_submission_timestamp text,
  approval_status text not null default 'draft',
  approval_notes text,
  approved_by text,
  approved_at text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists valuation_submissions_created_at_idx on public.valuation_submissions (created_at desc);
create index if not exists valuation_submissions_policy_group_id_idx on public.valuation_submissions (policy_group_id);
create index if not exists valuation_submissions_email_idx on public.valuation_submissions (email);
create index if not exists valuation_submissions_state_idx on public.valuation_submissions (primary_state);
create index if not exists admin_scenarios_updated_at_idx on public.admin_scenarios (updated_at desc);
create index if not exists internal_observations_observed_at_idx on public.internal_observations (observed_at desc);
create index if not exists internal_observations_policy_group_id_idx on public.internal_observations (policy_group_id);

drop trigger if exists admin_users_set_updated_at on public.admin_users;
create trigger admin_users_set_updated_at
before update on public.admin_users
for each row
execute function public.set_updated_at();

drop trigger if exists valuation_submissions_set_updated_at on public.valuation_submissions;
create trigger valuation_submissions_set_updated_at
before update on public.valuation_submissions
for each row
execute function public.set_updated_at();

drop trigger if exists admin_scenarios_set_updated_at on public.admin_scenarios;
create trigger admin_scenarios_set_updated_at
before update on public.admin_scenarios
for each row
execute function public.set_updated_at();

drop trigger if exists internal_observations_set_updated_at on public.internal_observations;
create trigger internal_observations_set_updated_at
before update on public.internal_observations
for each row
execute function public.set_updated_at();

alter table public.admin_users enable row level security;
alter table public.valuation_submissions enable row level security;
alter table public.admin_scenarios enable row level security;
alter table public.internal_observations enable row level security;
