import type { ProductTotal } from '../lib/queries'

type Props = {
  product: ProductTotal
  onPlus: () => void
  onMinus: () => void
  disabled?: boolean
  /** Disable minus when there is nothing to subtract (no draft and no units to remove). */
  minusDisabled?: boolean
  /** Units sold by current user, net of pending removal (for "tuyas" display). */
  myUnits?: number
  /** Pending removal count; when > 0 show "Quitar: N" in meta. */
  removalDraft?: number
}

function formatPrice(cents: number): string {
  return `€${(cents / 100).toFixed(2)}`
}

export default function ProductCounter({
  product,
  onPlus,
  onMinus,
  disabled,
  minusDisabled = false,
  myUnits,
  removalDraft,
}: Props) {
  return (
    <section className="product-counter" aria-label={`${product.name} vendidos`}>
      <div className="product-counter__header">
        <span className="product-counter__name">{product.name}</span>
        <span className="product-counter__price">{formatPrice(product.price_cents)}</span>
      </div>
      <div className="product-counter__controls">
        <button
          type="button"
          className="product-counter__btn product-counter__btn--minus"
          onClick={onMinus}
          disabled={disabled || minusDisabled}
          aria-label={`Restar una unidad vendida de ${product.name}`}
        >
          −
        </button>
        <span className="product-counter__value" aria-live="polite">
          {product.units_sold}
        </span>
        <button
          type="button"
          className="product-counter__btn product-counter__btn--plus"
          onClick={onPlus}
          disabled={disabled}
          aria-label={`Sumar una unidad vendida de ${product.name}`}
        >
          +
        </button>
      </div>
      <div className="product-counter__earnings">
        {formatPrice(product.earnings_cents)} acumulados
        {typeof myUnits === 'number' && (
          <span className="product-counter__meta">
            {' '}· Tuyas: {myUnits}
            {removalDraft != null && removalDraft > 0 && ` · Quitar: ${removalDraft}`}
          </span>
        )}
      </div>
    </section>
  )
}
