-- Public read access for taverns, opt-in per object.
--
-- Anonymous visitors (the publishable key, no login) can SELECT only objects
-- that are of type 'tavern' AND have properties.visibility = 'public'.
-- Nothing is public by default: a tavern with no visibility property, or any
-- other value (e.g. 'private'), is invisible to anon. Enforced by Postgres,
-- not application code. There is deliberately NO anon insert/update/delete
-- policy and no anon access to `edges`.

create policy "Anon can read public taverns"
  on objects for select
  to anon
  using (type = 'tavern' and properties->>'visibility' = 'public');
