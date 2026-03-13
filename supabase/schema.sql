-- Products: zine (€2), t-shirt (€10), totebag (€7). Prices in cents.
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price_cents integer not null check (price_cents > 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Sellers: simple list, no auth. Select by name in UI.
create table if not exists public.sellers (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Sales events: one row per +1 or -1. delta in (-1, 1).
create table if not exists public.sales_events (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id),
  seller_id uuid not null references public.sellers(id),
  delta smallint not null check (delta in (-1, 1)),
  created_at timestamptz not null default now()
);

create index if not exists idx_sales_events_product_id on public.sales_events(product_id);
create index if not exists idx_sales_events_seller_id on public.sales_events(seller_id);
create index if not exists idx_sales_events_created_at on public.sales_events(created_at);
