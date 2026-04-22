-- Ensure postales product is 2 € (by id, so it always applies).
update public.products set price_cents = 200 where id = '00000000-0000-0000-0000-000000000009'::uuid;
