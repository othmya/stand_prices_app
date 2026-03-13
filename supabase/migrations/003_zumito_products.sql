-- Run in Supabase SQL Editor if you already have the old 3 products and want the full Zumito list.
-- Updates the first 3 rows to Zumito items and inserts the rest (keeps existing sales_events valid).

update public.products set name = 'Zumito 1', price_cents = 220 where id = '00000000-0000-0000-0000-000000000001'::uuid;
update public.products set name = 'Zumito 2', price_cents = 220 where id = '00000000-0000-0000-0000-000000000002'::uuid;
update public.products set name = 'Camiseta Zumit', price_cents = 1000 where id = '00000000-0000-0000-0000-000000000003'::uuid;

insert into public.products (id, name, price_cents)
values
  ('00000000-0000-0000-0000-000000000004'::uuid, 'Camiseta Corme', 1000),
  ('00000000-0000-0000-0000-000000000005'::uuid, 'camiseta pirata', 1000),
  ('00000000-0000-0000-0000-000000000006'::uuid, 'totebag', 700),
  ('00000000-0000-0000-0000-000000000007'::uuid, 'guía de pirateo', 200),
  ('00000000-0000-0000-0000-000000000008'::uuid, 'guía de contabili', 200),
  ('00000000-0000-0000-0000-000000000009'::uuid, 'postal', 100)
on conflict (id) do nothing;
