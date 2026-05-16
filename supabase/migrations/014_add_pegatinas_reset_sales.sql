-- Add product "pegatinas" (1 €).
insert into public.products (id, name, price_cents)
values ('00000000-0000-0000-0000-00000000000c'::uuid, 'pegatinas', 100)
on conflict (id) do nothing;

-- Reset all logged sold items for the new event.
truncate table public.seller_product_sales;
