-- Keep global "Por producto" aligned with "Por zumiter":
-- sum only positive net units per seller/product (ignores negative seller nets).

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

create or replace view public.total_earnings as
select
  coalesce(sum(pt.earnings_cents), 0)::bigint as total_earnings_cents
from public.product_totals pt;

grant select on public.product_totals to anon;
grant select on public.total_earnings to anon;
