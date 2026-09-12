-- The Hallow Archive — v1 schema
-- Two core tables implementing the object/connection model described in CLAUDE.md.

create extension if not exists "pgcrypto";

create table if not exists objects (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  name text not null,
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists objects_type_idx on objects (type);
create index if not exists objects_name_idx on objects (name);

create table if not exists edges (
  id uuid primary key default gen_random_uuid(),
  from_id uuid not null references objects (id) on delete cascade,
  to_id uuid not null references objects (id) on delete cascade,
  label text,
  created_at timestamptz not null default now(),
  constraint edges_no_self_link check (from_id <> to_id)
);

create index if not exists edges_from_id_idx on edges (from_id);
create index if not exists edges_to_id_idx on edges (to_id);

-- Keep updated_at current on every write.
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists objects_set_updated_at on objects;
create trigger objects_set_updated_at
  before update on objects
  for each row
  execute function set_updated_at();

-- v1 is single-user (Scott only, via Supabase Auth), so RLS is enabled with a
-- simple "must be logged in" policy rather than the per-player scoping that
-- phase 2 (player accounts + suggestion queue) will need.
alter table objects enable row level security;
alter table edges enable row level security;

create policy "Authenticated users can read objects"
  on objects for select
  to authenticated
  using (true);

create policy "Authenticated users can write objects"
  on objects for all
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can read edges"
  on edges for select
  to authenticated
  using (true);

create policy "Authenticated users can write edges"
  on edges for all
  to authenticated
  using (true)
  with check (true);
