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

export async function fetchProductTotals(): Promise<ProductTotal[]> {
  const { data, error } = await supabase
    .from('product_totals')
    .select('product_id, name, price_cents, units_sold, earnings_cents')
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
