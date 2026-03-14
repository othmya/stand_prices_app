-- Add product "funzzeig" (Artefactos, 2 €).
insert into public.products (id, name, price_cents)
values ('00000000-0000-0000-0000-00000000000a'::uuid, 'funzzeig', 200)
on conflict (id) do nothing;
