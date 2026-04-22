-- Borra todas las ventas del evento anterior. Conserva:
--   - auth.users (cuentas de Supabase Auth)
--   - public.sellers (vendedores enlazados a esas cuentas)
--   - public.products (catálogo y precios)
-- Solo se eliminan los totales netos por vendedor y producto.

truncate table public.seller_product_sales;

-- Si aún existiera la tabla antigua (antes de la migración 008), vaciarla también.
do $$
begin
  if to_regclass('public.sales_events') is not null then
    truncate table public.sales_events;
  end if;
end $$;
