-- Plot / Compilation / Export schema (per Scott's spec, 2026-09-25).
--
-- No new base tables for objects themselves — 'arc', 'plot_beat', and
-- 'compilation' are just object `type` values, same as every other type in
-- this app. This migration adds the one new table the spec calls for:
-- compilation_entries, the ordering/staging layer between a 'compilation'
-- object and the objects it compiles.
--
-- Same access model as objects/edges (0001): authenticated-only, no anon
-- policy. Compilations are a GM authoring tool, not published content —
-- unlike taverns/businesses (0002/0003) there is no public read case here.

create table if not exists compilation_entries (
    id              uuid primary key default gen_random_uuid(),
    compilation_id  uuid not null references objects (id) on delete cascade,
    object_id       uuid not null references objects (id) on delete cascade,

    -- Lifecycle of this object WITHIN this specific compilation. The same
    -- object can be 'placed' in one compilation and 'draft' in another.
    status          text not null default 'draft'
                    check (status in ('draft', 'placed', 'cut')),

    -- Fractional sort key, meaningful only when status = 'placed'. Move
    -- up/down swaps two entries' position values directly rather than
    -- renumbering the whole list.
    position        numeric,

    -- Loose bucket for draft/unplaced items, so they can be grouped roughly
    -- before committing to an exact position. Free text, not an enum — the
    -- world's still taking shape.
    rough_era       text,

    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now(),

    unique (compilation_id, object_id)
);

create index if not exists idx_compilation_entries_compilation
    on compilation_entries (compilation_id, status, position);

drop trigger if exists compilation_entries_set_updated_at on compilation_entries;
create trigger compilation_entries_set_updated_at
  before update on compilation_entries
  for each row
  execute function set_updated_at();

alter table compilation_entries enable row level security;

create policy "Authenticated users can read compilation entries"
  on compilation_entries for select
  to authenticated
  using (true);

create policy "Authenticated users can write compilation entries"
  on compilation_entries for all
  to authenticated
  using (true)
  with check (true);
