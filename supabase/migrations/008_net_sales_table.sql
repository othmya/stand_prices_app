-- Replace event-based sales with a single net-sales table (one row per seller+product).

-- New table: net units per (seller, product) with first/last sale timestamps
create table if not exists public.seller_product_sales (
  seller_id uuid not null references public.sellers(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  units_sold integer not null check (units_sold >= 0) default 0,
  first_sale_at timestamptz,
  last_sale_at timestamptz,
  primary key (seller_id, product_id)
);
create index if not exists idx_seller_product_sales_product_id on public.seller_product_sales(product_id);

-- Migrate existing net from sales_events (only rows with net > 0)
insert into public.seller_product_sales (seller_id, product_id, units_sold, first_sale_at, last_sale_at)
select
  e.seller_id,
  e.product_id,
  greatest(0, sum(e.delta))::integer as units_sold,
  min(e.created_at) as first_sale_at,
  max(e.created_at) as last_sale_at
from public.sales_events e
join public.products p on p.id = e.product_id and p.active
group by e.seller_id, e.product_id
having greatest(0, sum(e.delta)) > 0
on conflict (seller_id, product_id) do nothing;

-- Views from net table
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

-- RLS
alter table public.seller_product_sales enable row level security;

create policy "Allow read seller_product_sales"
  on public.seller_product_sales for select
  using (true);

create policy "Allow authenticated insert own seller_product_sales"
  on public.seller_product_sales for insert
  to authenticated
  with check (
    seller_id in (select id from public.sellers where auth_user_id = auth.uid())
  );

create policy "Allow authenticated update own seller_product_sales"
  on public.seller_product_sales for update
  to authenticated
  using (
    seller_id in (select id from public.sellers where auth_user_id = auth.uid())
  );

-- Functions to add/remove net units (called by app)
create or replace function public.record_sales_net(p_seller_id uuid, p_items jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare
  item jsonb;
begin
  if p_seller_id is null or not exists (select 1 from public.sellers where id = p_seller_id and auth_user_id = auth.uid()) then
    raise exception 'Not allowed';
  end if;
  for item in select * from jsonb_array_elements(p_items)
  loop
    insert into public.seller_product_sales (seller_id, product_id, units_sold, first_sale_at, last_sale_at)
    values (
      p_seller_id,
      (item->>'productId')::uuid,
      (item->>'quantity')::int,
      now(),
      now()
    )
    on conflict (seller_id, product_id) do update set
      units_sold = public.seller_product_sales.units_sold + (item->>'quantity')::int,
      last_sale_at = now();
  end loop;
end;
$$;

create or replace function public.record_deletions_net(p_seller_id uuid, p_items jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare
  item jsonb;
begin
  if p_seller_id is null or not exists (select 1 from public.sellers where id = p_seller_id and auth_user_id = auth.uid()) then
    raise exception 'Not allowed';
  end if;
  for item in select * from jsonb_array_elements(p_items)
  loop
    update public.seller_product_sales
    set units_sold = greatest(0, units_sold - (item->>'quantity')::int),
        last_sale_at = now()
    where seller_id = p_seller_id and product_id = (item->>'productId')::uuid;
  end loop;
end;
$$;

grant execute on function public.record_sales_net(uuid, jsonb) to authenticated;
grant execute on function public.record_deletions_net(uuid, jsonb) to authenticated;

-- Drop old table (and its policies)
drop table if exists public.sales_events cascade;

grant select on public.seller_product_sales to anon;
grant select on public.seller_product_sales to authenticated;
grant insert, update on public.seller_product_sales to authenticated;
