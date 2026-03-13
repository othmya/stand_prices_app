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

export type SaleMovement = {
  seller_id: string
  product_id: string
  seller_display_name: string
  product_name: string
  delta: number
  created_at: string
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

/** Raw movements timeline for CSV export (includes timestamp). */
export async function fetchSalesMovements(): Promise<SaleMovement[]> {
  const { data, error } = await supabase
    .from('sales_events')
    .select('seller_id, product_id, delta, created_at, sellers!inner(display_name), products!inner(name)')
    .order('created_at', { ascending: true })
  if (error) throw error

  return (data ?? [])
    .map(
      (row: {
        seller_id: string
        product_id: string
        delta: number
        created_at: string
        sellers: { display_name: string } | { display_name: string }[]
        products: { name: string } | { name: string }[]
      }) => {
        const seller = Array.isArray(row.sellers) ? row.sellers[0] : row.sellers
        const product = Array.isArray(row.products) ? row.products[0] : row.products
        return {
          seller_id: row.seller_id,
          product_id: row.product_id,
          delta: row.delta,
          created_at: row.created_at,
          seller_display_name: seller?.display_name ?? '',
          product_name: product?.name ?? '',
        }
      }
    )
    .filter((row) => row.seller_display_name !== '' && row.product_name !== '')
}

export async function recordSale(
  productId: string,
  sellerId: string,
  delta: 1 | -1
): Promise<void> {
  const { error } = await supabase.from('sales_events').insert({
    product_id: productId,
    seller_id: sellerId,
    delta,
  })
  if (error) throw error
}
