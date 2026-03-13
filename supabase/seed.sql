-- Run after schema.sql. Idempotent: insert only if no rows.

insert into public.products (id, name, price_cents)
values
  ('00000000-0000-0000-0000-000000000001'::uuid, 'Zine', 200),
  ('00000000-0000-0000-0000-000000000002'::uuid, 'T-shirt', 1000),
  ('00000000-0000-0000-0000-000000000003'::uuid, 'Totebag', 700)
on conflict (id) do nothing;

-- Placeholder sellers; add more via dashboard or SQL.
insert into public.sellers (id, display_name)
values
  ('00000000-0000-0000-0000-000000000001'::uuid, 'Seller 1'),
  ('00000000-0000-0000-0000-000000000002'::uuid, 'Seller 2')
on conflict (id) do nothing;
