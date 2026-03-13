-- Run after schema. View for product totals (units sold) and earnings.

create or replace view public.product_totals as
select
  p.id as product_id,
  p.name,
  p.price_cents,
  coalesce(sum(e.delta), 0)::integer as units_sold,
  (coalesce(sum(e.delta), 0) * p.price_cents)::bigint as earnings_cents
from public.products p
left join public.sales_events e on e.product_id = p.id
where p.active
group by p.id, p.name, p.price_cents;

-- Total earnings across all products (single row).
create or replace view public.total_earnings as
select
  coalesce(sum(e.delta * p.price_cents), 0)::bigint as total_earnings_cents
from public.sales_events e
join public.products p on p.id = e.product_id;

-- Per-seller, per-product: who sold what (for tracking and export).
create or replace view public.seller_product_totals as
select
  s.id as seller_id,
  s.display_name as seller_display_name,
  p.id as product_id,
  p.name as product_name,
  p.price_cents,
  coalesce(sum(e.delta), 0)::integer as units_sold,
  (coalesce(sum(e.delta), 0) * p.price_cents)::bigint as earnings_cents
from public.sellers s
join public.sales_events e on e.seller_id = s.id
join public.products p on p.id = e.product_id and p.active
group by s.id, s.display_name, p.id, p.name, p.price_cents
having coalesce(sum(e.delta), 0) <> 0;

grant select on public.product_totals to anon;
grant select on public.total_earnings to anon;
grant select on public.seller_product_totals to authenticated;
grant select on public.seller_product_totals to anon;
