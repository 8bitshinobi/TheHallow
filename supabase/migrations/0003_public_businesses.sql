-- Extend the anonymous read policy from taverns to businesses. Same rule: the
-- object's type must be one of the generator-backed public types AND it must
-- have properties.visibility = 'public'. This replaces the taverns-only policy
-- from 0002 (one policy, not a parallel one). Still no anon write access and
-- no anon access to `edges`.

drop policy if exists "Anon can read public taverns" on objects;

create policy "Anon can read public taverns and businesses"
  on objects for select
  to anon
  using (type in ('tavern', 'business') and properties->>'visibility' = 'public');
