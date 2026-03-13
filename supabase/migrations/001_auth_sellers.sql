-- Run after schema, seed, views, and policies. Adds auth link to sellers and RLS for signed-in users.
-- In Supabase Dashboard: enable Authentication > Providers > Email (and optionally "Confirm email" off for quick testing).

-- Link sellers to Supabase Auth (nullable for existing seed sellers).
alter table public.sellers
  add column if not exists auth_user_id uuid references auth.users(id) unique;

-- Authenticated users can read their own seller and create one on sign-up.
drop policy if exists "Allow anon read sellers" on public.sellers;
create policy "Allow anon read sellers"
  on public.sellers for select
  to anon using (true);

create policy "Allow authenticated read own seller"
  on public.sellers for select
  to authenticated using (auth_user_id = auth.uid());

create policy "Allow authenticated insert own seller"
  on public.sellers for insert
  to authenticated with check (auth_user_id = auth.uid());

create policy "Allow authenticated update own seller"
  on public.sellers for update
  to authenticated using (auth_user_id = auth.uid());

-- Only authenticated users can insert sales_events, and only for their own seller.
drop policy if exists "Allow anon insert sales_events" on public.sales_events;
create policy "Allow authenticated insert own sales"
  on public.sales_events for insert
  to authenticated
  with check (
    seller_id in (select id from public.sellers where auth_user_id = auth.uid())
  );

-- Keep read for anon so product_totals/total_earnings still work for everyone.
-- Authenticated also need read for the views.
create policy "Allow authenticated read sales_events"
  on public.sales_events for select
  to authenticated using (true);

-- Table grants so authenticated role can use RLS policies on sellers.
grant select, insert, update on public.sellers to authenticated;

-- Views: grant authenticated so signed-in users can load totals.
grant select on public.product_totals to authenticated;
grant select on public.total_earnings to authenticated;
grant select on public.products to authenticated;
