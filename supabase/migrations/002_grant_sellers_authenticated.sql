-- Run this in Supabase SQL Editor if you get "Failed to load seller" after sign-up.
-- Gives the authenticated role permission to read/insert/update the sellers table (RLS still applies).
grant select, insert, update on public.sellers to authenticated;
