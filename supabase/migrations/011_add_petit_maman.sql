-- Add product "Petit Maman" (Artefactos, 2 €).
insert into public.products (id, name, price_cents)
values ('00000000-0000-0000-0000-00000000000b'::uuid, 'Petit Maman', 200)
on conflict (id) do nothing;
