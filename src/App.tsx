import { useEffect, useState, useCallback } from 'react'
import SellerSelect from './components/SellerSelect'
import ProductCounter from './components/ProductCounter'
import {
  fetchSellers,
  fetchProductTotals,
  fetchTotalEarnings,
  recordSale,
  type Seller,
  type ProductTotal,
} from './lib/queries'

function formatEarnings(cents: number): string {
  return `€${(cents / 100).toFixed(2)}`
}

export default function App() {
  const [sellers, setSellers] = useState<Seller[]>([])
  const [totals, setTotals] = useState<ProductTotal[]>([])
  const [totalEarnings, setTotalEarnings] = useState<number>(0)
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setError(null)
      const [s, t, e] = await Promise.all([
        fetchSellers(),
        fetchProductTotals(),
        fetchTotalEarnings(),
      ])
      setSellers(s)
      setTotals(t)
      setTotalEarnings(e)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleDelta = useCallback(
    async (productId: string, delta: 1 | -1) => {
      if (!selectedSellerId) return
      try {
        setError(null)
        await recordSale(productId, selectedSellerId, delta)
        await load()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to record sale')
      }
    },
    [selectedSellerId, load]
  )

  if (loading) {
    return (
      <div className="app">
        <header className="app__header">
          <h1>Stand Sales</h1>
        </header>
        <p className="app__message">Loading…</p>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app__header">
        <h1>Stand Sales</h1>
        <p className="app__total-earnings" aria-live="polite">
          Total: {formatEarnings(totalEarnings)}
        </p>
      </header>

      {error && (
        <p className="app__error" role="alert">
          {error}
        </p>
      )}

      <SellerSelect
        sellers={sellers}
        selectedId={selectedSellerId}
        onSelect={setSelectedSellerId}
        loading={loading}
      />

      <div className="app__products">
        {totals.map((product) => (
          <ProductCounter
            key={product.product_id}
            product={product}
            onPlus={() => handleDelta(product.product_id, 1)}
            onMinus={() => handleDelta(product.product_id, -1)}
            disabled={!selectedSellerId}
          />
        ))}
      </div>
    </div>
  )
}
