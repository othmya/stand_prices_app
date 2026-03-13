-- Run after schema. View for product totals (units sold) and earnings.

create or replace view public.product_totals as
with seller_product_effective as (
  select
    e.seller_id,
    e.product_id,
    greatest(coalesce(sum(e.delta), 0), 0)::integer as units_sold
  from public.sales_events e
  group by e.seller_id, e.product_id
)
select
  p.id as product_id,
  p.name,
  p.price_cents,
  coalesce(sum(spe.units_sold), 0)::integer as units_sold,
  (coalesce(sum(spe.units_sold), 0) * p.price_cents)::bigint as earnings_cents
from public.products p
left join seller_product_effective spe on spe.product_id = p.id
where p.active
group by p.id, p.name, p.price_cents;

-- Total earnings across all products (single row).
create or replace view public.total_earnings as
select
  coalesce(sum(pt.earnings_cents), 0)::bigint as total_earnings_cents
from public.product_totals pt;

-- Per-seller, per-product: who sold what (for tracking and export).
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

grant select on public.product_totals to anon;
grant select on public.total_earnings to anon;
grant select on public.seller_product_totals to authenticated;
grant select on public.seller_product_totals to anon;
