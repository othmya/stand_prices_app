-- Run after schema.sql and seed.sql. Enables RLS and anon access for static app.

alter table public.products enable row level security;
alter table public.sellers enable row level security;
alter table public.sales_events enable row level security;

-- Read-only for products and sellers (catalog + seller list).
create policy "Allow anon read products"
  on public.products for select
  to anon using (true);

create policy "Allow anon read sellers"
  on public.sellers for select
  to anon using (true);

-- App can insert sales events and read them (for totals).
create policy "Allow anon insert sales_events"
  on public.sales_events for insert
  to anon with check (true);

create policy "Allow anon read sales_events"
  on public.sales_events for select
  to anon using (true);
