-- Run after schema.sql. Inserts products and updates name/price if row already exists.

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
  ('00000000-0000-0000-0000-000000000009'::uuid, 'postal', 200),
  ('00000000-0000-0000-0000-00000000000a'::uuid, 'funzeig', 200),
  ('00000000-0000-0000-0000-00000000000b'::uuid, 'Petit Maman', 200)
on conflict (id) do update set name = excluded.name, price_cents = excluded.price_cents;

-- Sellers are created when users sign up (no placeholder rows).
