import { useEffect, useState, useCallback } from 'react'
import ProductCounter from './components/ProductCounter'
import SignIn from './components/SignIn'
import {
  fetchProductTotals,
  fetchTotalEarnings,
  fetchSellerProductTotals,
  fetchMySeller,
  ensureMySeller,
  recordSale,
  type Seller,
  type ProductTotal,
  type SellerProductTotal,
} from './lib/queries'
import type { User } from './lib/auth'
import { getSession, onAuthChange, signOut } from './lib/auth'

function formatEarnings(cents: number): string {
  return `€${(cents / 100).toFixed(2)}`
}

function downloadReport(
  totals: ProductTotal[],
  totalEarnings: number,
  bySeller: SellerProductTotal[],
  format: 'json' | 'csv'
) {
  const exportedAt = new Date().toISOString()
  const totalEuros = (totalEarnings / 100).toFixed(2)

  const bySellerGrouped = bySeller.reduce<Record<string, SellerProductTotal[]>>((acc, row) => {
    const name = row.seller_display_name
    if (!acc[name]) acc[name] = []
    acc[name].push(row)
    return acc
  }, {})

  if (format === 'json') {
    const payload = {
      exportedAt,
      totalEarningsCents: totalEarnings,
      totalEuros: `${totalEuros} €`,
      products: totals.map((p) => ({
        name: p.name,
        units_sold: p.units_sold,
        earnings_cents: p.earnings_cents,
        earnings_euros: `€${(p.earnings_cents / 100).toFixed(2)}`,
      })),
      bySeller: Object.entries(bySellerGrouped).map(([sellerName, rows]) => ({
        seller: sellerName,
        items: rows.map((r) => ({
          product: r.product_name,
          units_sold: r.units_sold,
          earnings_cents: r.earnings_cents,
          earnings_euros: `€${(r.earnings_cents / 100).toFixed(2)}`,
        })),
      })),
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `stand-sales-${exportedAt.slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  } else {
    const header = 'Product,Units sold,Earnings (€)'
    const rows = totals.map(
      (p) => `${p.name},${p.units_sold},${(p.earnings_cents / 100).toFixed(2)}`
    )
    const totalRow = `TOTAL,,${totalEuros}`
    let csv = [header, ...rows, totalRow].join('\n')
    csv += '\n\nBy seller\nSeller,Product,Units sold,Earnings (€)\n'
    for (const [sellerName, sellerRows] of Object.entries(bySellerGrouped)) {
      for (const r of sellerRows) {
        csv += `${sellerName},${r.product_name},${r.units_sold},${(r.earnings_cents / 100).toFixed(2)}\n`
      }
    }
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `stand-sales-${exportedAt.slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }
}

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [mySeller, setMySeller] = useState<Seller | null>(null)
  const [totals, setTotals] = useState<ProductTotal[]>([])
  const [totalEarnings, setTotalEarnings] = useState<number>(0)
  const [bySeller, setBySeller] = useState<SellerProductTotal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      setError(null)
      const [t, e, b] = await Promise.all([
        fetchProductTotals(),
        fetchTotalEarnings(),
        fetchSellerProductTotals(),
      ])
      setTotals(t)
      setTotalEarnings(e)
      setBySeller(b)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  const bySellerGrouped = bySeller.reduce<Record<string, SellerProductTotal[]>>((acc, row) => {
    const name = row.seller_display_name
    if (!acc[name]) acc[name] = []
    acc[name].push(row)
    return acc
  }, {})

  useEffect(() => {
    getSession().then(({ data: { session } }) => setUser(session?.user ?? null))
    const { data: { subscription } } = onAuthChange((u) => setUser(u ?? null))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!user) {
      setMySeller(null)
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        let seller = await fetchMySeller()
        if (!seller) {
          seller = await ensureMySeller(user.email?.split('@')[0] || 'Seller')
        }
        if (!cancelled) setMySeller(seller)
      } catch (err) {
        if (!cancelled) {
          const msg = (err as Error)?.message ?? (err as { message?: string })?.message ?? 'Failed to load seller'
          setError(msg)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [user])

  useEffect(() => {
    if (user && mySeller) loadData()
  }, [user, mySeller, loadData])

  const handleSignOut = useCallback(async () => {
    try {
      await signOut()
      setMySeller(null)
      setTotals([])
      setTotalEarnings(0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign out failed')
    }
  }, [])

  const handleDelta = useCallback(
    async (productId: string, delta: 1 | -1) => {
      if (!mySeller) return
      try {
        setError(null)
        await recordSale(productId, mySeller.id, delta)
        await loadData()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to record sale')
      }
    },
    [mySeller, loadData]
  )

  if (user === undefined || (user && !mySeller && loading)) {
    return (
      <div className="app">
        <header className="app__header">
          <h1>Zumito Stand La Llama Fest</h1>
        </header>
        <p className="app__message">Loading…</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="app">
        <header className="app__header">
          <h1>Zumito Stand La Llama Fest</h1>
        </header>
        <SignIn onSuccess={() => getSession().then(({ data: { session } }) => setUser(session?.user ?? null))} />
      </div>
    )
  }

  if (loading && totals.length === 0) {
    return (
      <div className="app">
        <header className="app__header">
          <h1>Zumito Stand La Llama Fest</h1>
        </header>
        <p className="app__message">Loading…</p>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app__header">
        <h1>Zumito Stand La Llama Fest</h1>
        <p className="app__total-earnings" aria-live="polite">
          Total: {formatEarnings(totalEarnings)}
        </p>
        <p className="app__user">
          You're signed in as <strong>{mySeller?.display_name}</strong> · <button type="button" className="app__sign-out" onClick={handleSignOut}>Sign out</button>
        </p>
      </header>

      {error && (
        <p className="app__error" role="alert">
          {error}
        </p>
      )}

      <div className="app__products">
        {totals.map((product) => (
          <ProductCounter
            key={product.product_id}
            product={product}
            onPlus={() => handleDelta(product.product_id, 1)}
            onMinus={() => handleDelta(product.product_id, -1)}
            disabled={!mySeller}
          />
        ))}
      </div>

      {Object.keys(bySellerGrouped).length > 0 && (
        <section className="app__by-seller">
          <h2 className="app__by-seller-title">Sales by seller</h2>
          {Object.entries(bySellerGrouped).map(([sellerName, rows]) => (
            <div key={sellerName} className="app__by-seller-block">
              <p className="app__by-seller-name">{sellerName}</p>
              <ul className="app__by-seller-list">
                {rows.map((r) => (
                  <li key={`${r.seller_id}-${r.product_id}`} className="app__by-seller-row">
                    <span>{r.product_name}</span>
                    <span>{r.units_sold} × {formatEarnings(r.price_cents)} = {formatEarnings(r.earnings_cents)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      <section className="app__export">
        <p className="app__export-label">Download current selling situation</p>
        <div className="app__export-buttons">
          <button
            type="button"
            className="app__export-btn"
            onClick={() => downloadReport(totals, totalEarnings, bySeller, 'json')}
          >
            Download JSON
          </button>
          <button
            type="button"
            className="app__export-btn"
            onClick={() => downloadReport(totals, totalEarnings, bySeller, 'csv')}
          >
            Download CSV
          </button>
        </div>
      </section>
    </div>
  )
}
