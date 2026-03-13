-- Run after schema.sql. Idempotent: insert only if no rows.

insert into public.products (id, name, price_cents)
values
  ('00000000-0000-0000-0000-000000000001'::uuid, 'Zumito 1', 220),
  ('00000000-0000-0000-0000-000000000002'::uuid, 'Zumito 2', 220),
  ('00000000-0000-0000-0000-000000000003'::uuid, 'Camiseta Zumit', 1000),
  ('00000000-0000-0000-0000-000000000004'::uuid, 'Camiseta Corme', 1000),
  ('00000000-0000-0000-0000-000000000005'::uuid, 'camiseta pirata', 1000),
  ('00000000-0000-0000-0000-000000000006'::uuid, 'totebag', 700),
  ('00000000-0000-0000-0000-000000000007'::uuid, 'guía de pirateo', 200),
  ('00000000-0000-0000-0000-000000000008'::uuid, 'guía de contabili', 200),
  ('00000000-0000-0000-0000-000000000009'::uuid, 'postal', 100)
on conflict (id) do nothing;

-- Sellers are created when users sign up (no placeholder rows).
