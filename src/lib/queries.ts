import { supabase } from './supabase'

export type Product = {
  id: string
  name: string
  price_cents: number
  active: boolean
  created_at: string
}

export type Seller = {
  id: string
  display_name: string
  active: boolean
  created_at: string
}

export type ProductTotal = {
  product_id: string
  name: string
  price_cents: number
  units_sold: number
  earnings_cents: number
}

export type TotalEarnings = {
  total_earnings_cents: number
}

export type SellerProductTotal = {
  seller_id: string
  seller_display_name: string
  product_id: string
  product_name: string
  price_cents: number
  units_sold: number
  earnings_cents: number
  first_sale_at: string | null
  last_sale_at: string | null
}


export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, price_cents, active, created_at')
    .eq('active', true)
    .order('name')
  if (error) throw error
  return data as Product[]
}

export async function fetchSellers(): Promise<Seller[]> {
  const { data, error } = await supabase
    .from('sellers')
    .select('id, display_name, active, created_at')
    .eq('active', true)
    .order('display_name')
  if (error) throw error
  return data as Seller[]
}

/** Seller linked to the current authenticated user (for recording sales). */
export async function fetchMySeller(): Promise<Seller | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data, error } = await supabase
    .from('sellers')
    .select('id, display_name, active, created_at')
    .eq('auth_user_id', user.id)
    .maybeSingle()
  if (error) throw error
  return data as Seller | null
}

/** Create a seller row for the current user (call after sign-up if fetchMySeller returns null). */
export async function ensureMySeller(displayName: string): Promise<Seller> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const existing = await fetchMySeller()
  if (existing) return existing
  const { data, error } = await supabase
    .from('sellers')
    .insert({ auth_user_id: user.id, display_name: displayName })
    .select('id, display_name, active, created_at')
    .single()
  if (error) throw error
  return data as Seller
}

export async function fetchProductTotals(): Promise<ProductTotal[]> {
  const { data, error } = await supabase
    .from('product_totals')
    .select('product_id, name, price_cents, units_sold, earnings_cents')
    .order('price_cents', { ascending: false })
  if (error) throw error
  return data as ProductTotal[]
}

export async function fetchTotalEarnings(): Promise<number> {
  const { data, error } = await supabase
    .from('total_earnings')
    .select('total_earnings_cents')
    .single()
  if (error) throw error
  return (data as TotalEarnings).total_earnings_cents
}

/** Who sold what: per-seller, per-product breakdown (for tracking and export). */
export async function fetchSellerProductTotals(): Promise<SellerProductTotal[]> {
  const { data, error } = await supabase
    .from('seller_product_totals')
    .select('seller_id, seller_display_name, product_id, product_name, price_cents, units_sold, earnings_cents, first_sale_at, last_sale_at')
    .order('seller_display_name')
    .order('price_cents', { ascending: false })
  if (error) throw error
  return data as SellerProductTotal[]
}

/** Add net sales (upsert: insert or add to existing units_sold). */
export async function recordSalesBatch(
  sellerId: string,
  items: { productId: string; quantity: number }[]
): Promise<void> {
  if (items.length === 0) return
  const payload = items.filter((i) => i.quantity > 0).map((i) => ({ productId: i.productId, quantity: i.quantity }))
  if (payload.length === 0) return
  const { error } = await supabase.rpc('record_sales_net', {
    p_seller_id: sellerId,
    p_items: payload,
  })
  if (error) throw error
}

/** Subtract net sales (correct/remove units for current seller). */
export async function recordDeletionsBatch(
  sellerId: string,
  items: { productId: string; quantity: number }[]
): Promise<void> {
  if (items.length === 0) return
  const payload = items.filter((i) => i.quantity > 0).map((i) => ({ productId: i.productId, quantity: i.quantity }))
  if (payload.length === 0) return
  const { error } = await supabase.rpc('record_deletions_net', {
    p_seller_id: sellerId,
    p_items: payload,
  })
  if (error) throw error
}
