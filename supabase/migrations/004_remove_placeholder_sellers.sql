-- Run in Supabase SQL Editor to remove the old "Seller 1" and "Seller 2" placeholders and their test sales.
-- Step 1: Remove any sales_events that reference those placeholder sellers.
delete from public.sales_events
where seller_id in (
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid
);

-- Step 2: Remove the placeholder seller rows.
delete from public.sellers
where id in (
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid
)
and auth_user_id is null;
