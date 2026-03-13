import { useEffect, useState, useCallback } from 'react'
import ProductCounter from './components/ProductCounter'
import SignIn from './components/SignIn'
import {
  fetchProductTotals,
  fetchTotalEarnings,
  fetchSellerProductTotals,
  fetchSalesMovements,
  fetchMySeller,
  ensureMySeller,
  recordSale,
  type Seller,
  type ProductTotal,
  type SellerProductTotal,
  type SaleMovement,
} from './lib/queries'
import type { User } from './lib/auth'
import { getSession, onAuthChange, signOut } from './lib/auth'
import zzLogo from './images/zz_logo4.png'

function formatEarnings(cents: number): string {
  return `€${(cents / 100).toFixed(2)}`
}

type CositosCategoryId = 'merch' | 'zines' | 'artefactos' | 'otros'

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function getCositosCategory(productName: string): CositosCategoryId {
  const name = normalizeText(productName)
  if (
    name.includes('camiseta') ||
    name.includes('totebag') ||
    name.includes('postal')
  ) {
    return 'merch'
  }
  if (name.includes('zumito 1') || name.includes('zumito 2')) {
    return 'zines'
  }
  if (
    name.includes('guia de contabilidad') ||
    name.includes('guia de contabili') ||
    name.includes('guia de pirateo')
  ) {
    return 'artefactos'
  }
  return 'otros'
}

function getStandardizedProductName(productName: string): string {
  const name = normalizeText(productName)
  if (name.includes('camiseta zumit')) return 'Cami Zumitos'
  if (name.includes('camiseta corme')) return 'Cami Cormelachi'
  if (name.includes('camiseta pirata')) return 'Cami Pirateo'
  if (name.includes('camiseta')) return 'Cami'
  if (name.includes('totebag')) return 'Totebag'
  if (name.includes('postal')) return 'Postales'
  if (name.includes('zumito 1')) return 'Zumito 1'
  if (name.includes('zumito 2')) return 'Zumito 2'
  if (name.includes('guia de contabilidad') || name.includes('guia de contabili')) {
    return 'Guía de contabilidad'
  }
  if (name.includes('guia de pirateo')) return 'Guía de pirateo'
  return productName
}

function downloadReport(
  totals: ProductTotal[],
  totalEarnings: number,
  bySeller: SellerProductTotal[],
  movements: SaleMovement[],
  format: 'json' | 'csv-global' | 'csv-seller'
) {
  const exportedAt = new Date().toISOString()
  const totalEuros = (totalEarnings / 100).toFixed(2)
  const csvCell = (value: string | number) => {
    const text = String(value)
    if (text.includes(',') || text.includes('"') || text.includes('\n')) {
      return `"${text.replace(/"/g, '""')}"`
    }
    return text
  }

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
      movements: movements.map((m) => {
        const movementDate = new Date(m.created_at)
        return {
          seller: m.seller_display_name,
          product: m.product_name,
          movement: m.delta,
          date: movementDate.toLocaleDateString('es-ES'),
          time: movementDate.toLocaleTimeString('es-ES', { hour12: false }),
        }
      }),
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
  } else if (format === 'csv-global') {
    let csv = 'Producto,Unidades,Precio unitario (€),Ganancias (€)\n'
    for (const p of totals) {
      csv += `${csvCell(p.name)},${p.units_sold},${(p.price_cents / 100).toFixed(2)},${(
        p.earnings_cents / 100
      ).toFixed(2)}\n`
    }
    csv += `\n${csvCell('TOTAL GLOBAL (€)')},,,${totalEuros}\n`
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `stand-seguimiento-global-${exportedAt.slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  } else if (format === 'csv-seller') {
    let csv = 'Vendedor,Producto,Unidades,Precio unitario (€),Primera fecha,Primera hora,Ultima fecha,Ultima hora\n'
    for (const row of bySeller) {
      const firstDate = row.first_sale_at ? new Date(row.first_sale_at) : null
      const lastDate = row.last_sale_at ? new Date(row.last_sale_at) : null
      csv += `${csvCell(row.seller_display_name)},${csvCell(row.product_name)},${row.units_sold},${(
        row.price_cents / 100
      ).toFixed(2)},${csvCell(
        firstDate ? firstDate.toLocaleDateString('es-ES') : ''
      )},${csvCell(
        firstDate ? firstDate.toLocaleTimeString('es-ES', { hour12: false }) : ''
      )},${csvCell(lastDate ? lastDate.toLocaleDateString('es-ES') : '')},${csvCell(
        lastDate ? lastDate.toLocaleTimeString('es-ES', { hour12: false }) : ''
      )}\n`
    }

    csv += '\nMovimientos por vendedor\n'
    csv += 'Vendedor,Producto,Movimiento,Fecha,Hora\n'
    for (const m of movements) {
      const movementDate = new Date(m.created_at)
      const date = movementDate.toLocaleDateString('es-ES')
      const time = movementDate.toLocaleTimeString('es-ES', { hour12: false })
      csv += `${csvCell(m.seller_display_name)},${csvCell(m.product_name)},${m.delta},${date},${time}\n`
    }
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `stand-seguimiento-por-zumiter-${exportedAt.slice(0, 10)}.csv`
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
  const [movements, setMovements] = useState<SaleMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'info' | 'cositos' | 'tracking' | 'export'>(
    'cositos'
  )

  const loadData = useCallback(async () => {
    try {
      setError(null)
      const [t, e, b, m] = await Promise.all([
        fetchProductTotals(),
        fetchTotalEarnings(),
        fetchSellerProductTotals(),
        fetchSalesMovements(),
      ])
      const nonNegativeTotals = t.map((product) => {
        const units = Math.max(0, product.units_sold)
        return {
          ...product,
          units_sold: units,
          earnings_cents: units * product.price_cents,
        }
      })
      const nonNegativeBySeller = b
        .map((row) => {
          const units = Math.max(0, row.units_sold)
          return {
            ...row,
            units_sold: units,
            earnings_cents: units * row.price_cents,
          }
        })
        .filter((row) => row.units_sold > 0)
      setTotals(nonNegativeTotals)
      setTotalEarnings(e)
      setBySeller(nonNegativeBySeller)
      setMovements(m)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los datos')
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
  const totalsByCategory = totals.reduce<Record<CositosCategoryId, ProductTotal[]>>(
    (acc, product) => {
      const category = getCositosCategory(product.name)
      acc[category].push(product)
      return acc
    },
    { merch: [], zines: [], artefactos: [], otros: [] }
  )

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
          seller = await ensureMySeller(user.email?.split('@')[0] || 'Vendedor')
        }
        if (!cancelled) setMySeller(seller)
      } catch (err) {
        if (!cancelled) {
          const msg =
            (err as Error)?.message ??
            (err as { message?: string })?.message ??
            'No se pudo cargar el vendedor'
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
      setBySeller([])
      setMovements([])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cerrar sesión')
    }
  }, [])

  const handleDelta = useCallback(
    async (productId: string, delta: 1 | -1) => {
      if (!mySeller) return
      try {
        setError(null)
        if (delta === -1) {
          const globalRow = totals.find((p) => p.product_id === productId)
          const myRow = bySeller.find(
            (row) => row.product_id === productId && row.seller_id === mySeller.id
          )
          const globalUnits = globalRow?.units_sold ?? 0
          const myUnits = myRow?.units_sold ?? 0
          if (globalUnits <= 0 || myUnits <= 0) {
            setError('No puedes restar: ese producto ya esta en 0 para tu usuario. El número que ves son ventas de otros usuarios :)')
            return
          }
        }
        await recordSale(productId, mySeller.id, delta)
        await loadData()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo registrar la venta')
      }
    },
    [mySeller, bySeller, totals, loadData]
  )

  if (user === undefined || (user && !mySeller && loading)) {
    return (
      <div className="app">
        <header className="app__header">
          <img src={zzLogo} alt="Zumito logo" className="app__logo" />
          <h1>La Llama Fest</h1>
        </header>
        <p className="app__message">Cargando…</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="app">
        <header className="app__header">
          <img src={zzLogo} alt="Zumito logo" className="app__logo" />
          <h1>La Llama Fest</h1>
        </header>
        <SignIn onSuccess={() => getSession().then(({ data: { session } }) => setUser(session?.user ?? null))} />
      </div>
    )
  }

  if (loading && totals.length === 0) {
    return (
      <div className="app">
        <header className="app__header">
          <img src={zzLogo} alt="Zumito logo" className="app__logo" />
          <h1>La Llama Fest</h1>
        </header>
        <p className="app__message">Cargando…</p>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app__header">
        <img src={zzLogo} alt="Zumito logo" className="app__logo" />
        <h1>La Llama Fest</h1>
        <p className="app__total-earnings" aria-live="polite">
          Total: {formatEarnings(totalEarnings)}
        </p>
        <p className="app__user">
          Sesión iniciada como <strong>{mySeller?.display_name}</strong> ·{' '}
          <button
            type="button"
            className="app__sign-out"
            onClick={handleSignOut}
          >
            Cerrar sesión
          </button>
        </p>
      </header>

      {error && (
        <div className="app__error" role="alert">
          <span>{error}</span>
          <button
            type="button"
            className="app__error-close"
            aria-label="Cerrar aviso"
            onClick={() => setError(null)}
          >
            ×
          </button>
        </div>
      )}

      <main className="app__main">
        {activeTab === 'info' && (
          <section className="app__section app__section--info">
            <h2 className="app__section-title">Cómo funciona esta mini‑app</h2>
            <ul className="app__info-list">
              <li>
                Inicia sesión y comprueba que estás usando el nombre de
                vendedor correcto. Los nombres de usuario o vendedor deberían ser un nombre
                que te identifique seguido de "@stand". Por ejemplo, "hola@stand".
              </li>
              <li>
                Entra en <strong>Cositos</strong> para ver los productos disponibles y sumar o restar unidades a
                medida que vas vendiendo durante el evento.
              </li>
              <li>
                Cada toque en <strong>+</strong> o <strong>-</strong> guarda un
                movimiento en la base de datos compartida y actualiza
                los totales.
              </li>
              <li>
                En <strong>Seguimiento</strong> puedes ver el resumen global de
                todos los vendedores y productos.
              </li>
              <li>
                En <strong>Exportar</strong> puedes descargar la situacion de ventas actual
                en CSV o JSON para guardarla o analizarla más tarde.
              </li>
            </ul>
          </section>
        )}

        {activeTab === 'cositos' && (
          <section className="app__section app__section--cositos">
            <h2 className="app__section-title">Cositos a la venta</h2>
            {(
              [
                { id: 'merch', title: 'Merch' },
                { id: 'zines', title: 'Zines' },
                { id: 'artefactos', title: 'Artefactos' },
                { id: 'otros', title: 'Otros' },
              ] as const
            ).map(({ id, title }) => {
              const products = totalsByCategory[id]
              if (products.length === 0) return null
              return (
                <div key={id} className="app__cositos-group">
                  <h3 className="app__cositos-group-title">{title}</h3>
                  <div className="app__products">
                    {products.map((product) => (
                      <ProductCounter
                        key={product.product_id}
                        product={{
                          ...product,
                          name: getStandardizedProductName(product.name),
                        }}
                        onPlus={() => handleDelta(product.product_id, 1)}
                        onMinus={() => handleDelta(product.product_id, -1)}
                        disabled={!mySeller}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </section>
        )}

        {activeTab === 'tracking' && (
          <section className="app__section app__section--tracking">
            <h2 className="app__section-title">Seguimiento global</h2>
            <p className="app__tracking-summary">
              Ganancias totales hasta ahora:{' '}
              <strong>{formatEarnings(totalEarnings)}</strong>
            </p>

            {totals.length > 0 && (
              <div className="app__tracking-products">
                <h3 className="app__tracking-zumiter-title">Por producto</h3>
                <div className="app__by-seller-table">
                  <div className="app__by-seller-head">
                    <span>Producto</span>
                    <span>Unidades</span>
                    <span>Precio</span>
                  </div>
                  {totals.map((product) => (
                    <div key={product.product_id} className="app__by-seller-row">
                      <span className="app__by-seller-product">{product.name}</span>
                      <span className="app__by-seller-units">{product.units_sold}</span>
                      <span className="app__by-seller-price">
                        {formatEarnings(product.price_cents)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {Object.keys(bySellerGrouped).length > 0 && (
              <div className="app__tracking-sellers">
                <h3 className="app__tracking-zumiter-title">Por zumiter</h3>
                {Object.entries(bySellerGrouped).map(([sellerName, rows]) => (
                  <div key={sellerName} className="app__by-seller-block">
                    <p className="app__by-seller-name">{sellerName}</p>
                    <div className="app__by-seller-table">
                      <div className="app__by-seller-head">
                        <span>Producto</span>
                        <span>Unidades</span>
                        <span>Precio</span>
                      </div>
                      {rows.map((r) => (
                        <div
                          key={`${r.seller_id}-${r.product_id}`}
                          className="app__by-seller-row"
                        >
                          <span className="app__by-seller-product">{r.product_name}</span>
                          <span className="app__by-seller-units">{r.units_sold}</span>
                          <span className="app__by-seller-price">
                            {formatEarnings(r.price_cents)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'export' && (
          <section className="app__section app__section--export">
            <h2 className="app__section-title">Exportar datos</h2>
            <p className="app__export-label">
              Descarga la situacion actual de ventas para respaldo o analisis.
            </p>
            <div className="app__export-buttons">
              <button
                type="button"
                className="app__export-btn"
                onClick={() =>
                  downloadReport(totals, totalEarnings, bySeller, movements, 'json')
                }
              >
                Descargar JSON
              </button>
              <button
                type="button"
                className="app__export-btn"
                onClick={() =>
                  downloadReport(totals, totalEarnings, bySeller, movements, 'csv-global')
                }
              >
                CSV dinero global
              </button>
              <button
                type="button"
                className="app__export-btn"
                onClick={() =>
                  downloadReport(totals, totalEarnings, bySeller, movements, 'csv-seller')
                }
              >
                CSV por vendedor
              </button>
            </div>
          </section>
        )}
      </main>

      <nav className="app__bottom-nav" aria-label="Principal">
        <button
          type="button"
          className={`app__bottom-nav-btn${
            activeTab === 'info' ? ' app__bottom-nav-btn--active' : ''
          }`}
          onClick={() => setActiveTab('info')}
        >
          Ayuda
        </button>
        <button
          type="button"
          className={`app__bottom-nav-btn${
            activeTab === 'cositos' ? ' app__bottom-nav-btn--active' : ''
          }`}
          onClick={() => setActiveTab('cositos')}
        >
          Cositos
        </button>
        <button
          type="button"
          className={`app__bottom-nav-btn${
            activeTab === 'tracking' ? ' app__bottom-nav-btn--active' : ''
          }`}
          onClick={() => setActiveTab('tracking')}
        >
          Seguimiento
        </button>
        <button
          type="button"
          className={`app__bottom-nav-btn${
            activeTab === 'export' ? ' app__bottom-nav-btn--active' : ''
          }`}
          onClick={() => setActiveTab('export')}
        >
          Exportar
        </button>
      </nav>
    </div>
  )
}
