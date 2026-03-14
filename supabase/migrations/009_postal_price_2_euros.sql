-- Postales: 2 € (was 1 €).
update public.products set price_cents = 200 where name = 'postal' and price_cents = 100;
