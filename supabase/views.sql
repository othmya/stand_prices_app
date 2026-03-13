-- Run after schema. View for product totals (units sold) and earnings.
-- Data source: seller_product_sales (net units per seller+product).

create or replace view public.product_totals as
select
  p.id as product_id,
  p.name,
  p.price_cents,
  coalesce(sum(sps.units_sold), 0)::integer as units_sold,
  (coalesce(sum(sps.units_sold), 0) * p.price_cents)::bigint as earnings_cents
from public.products p
left join public.seller_product_sales sps on sps.product_id = p.id
where p.active
group by p.id, p.name, p.price_cents;

create or replace view public.total_earnings as
select coalesce(sum(pt.earnings_cents), 0)::bigint as total_earnings_cents
from public.product_totals pt;

create or replace view public.seller_product_totals as
select
  s.id as seller_id,
  s.display_name as seller_display_name,
  p.id as product_id,
  p.name as product_name,
  p.price_cents,
  sps.units_sold,
  (sps.units_sold * p.price_cents)::bigint as earnings_cents,
  sps.first_sale_at,
  sps.last_sale_at
from public.sellers s
join public.seller_product_sales sps on sps.seller_id = s.id
join public.products p on p.id = sps.product_id and p.active
where sps.units_sold > 0;

grant select on public.product_totals to anon;
grant select on public.total_earnings to anon;
grant select on public.seller_product_totals to authenticated;
grant select on public.seller_product_totals to anon;
