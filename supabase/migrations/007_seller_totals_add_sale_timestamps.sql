-- Ensure by-seller totals include first/last movement timestamps.
-- This helps CSV metadata stay correct with historical multi-user data.

create or replace view public.seller_product_totals as
select
  s.id as seller_id,
  s.display_name as seller_display_name,
  p.id as product_id,
  p.name as product_name,
  p.price_cents,
  greatest(coalesce(sum(e.delta), 0), 0)::integer as units_sold,
  (greatest(coalesce(sum(e.delta), 0), 0) * p.price_cents)::bigint as earnings_cents,
  min(e.created_at) as first_sale_at,
  max(e.created_at) as last_sale_at
from public.sellers s
join public.sales_events e on e.seller_id = s.id
join public.products p on p.id = e.product_id and p.active
group by s.id, s.display_name, p.id, p.name, p.price_cents
having greatest(coalesce(sum(e.delta), 0), 0) > 0;

grant select on public.seller_product_totals to authenticated;
grant select on public.seller_product_totals to anon;
