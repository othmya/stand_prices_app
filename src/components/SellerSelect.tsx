import type { Seller } from '../lib/queries'

type Props = {
  sellers: Seller[]
  selectedId: string | null
  onSelect: (id: string) => void
  loading?: boolean
}

export default function SellerSelect({
  sellers,
  selectedId,
  onSelect,
  loading,
}: Props) {
  return (
    <section className="seller-select">
      <label htmlFor="seller-picker">Vendedor</label>
      <select
        id="seller-picker"
        value={selectedId ?? ''}
        onChange={(e) => onSelect(e.target.value)}
        disabled={loading}
        aria-label="Elegir vendedor"
      >
        <option value="">Selecciona vendedor…</option>
        {sellers.map((s) => (
          <option key={s.id} value={s.id}>
            {s.display_name}
          </option>
        ))}
      </select>
    </section>
  )
}
