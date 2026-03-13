import type { ProductTotal } from '../lib/queries'

type Props = {
  product: ProductTotal
  onPlus: () => void
  onMinus: () => void
  disabled?: boolean
}

function formatPrice(cents: number): string {
  return `€${(cents / 100).toFixed(2)}`
}

export default function ProductCounter({
  product,
  onPlus,
  onMinus,
  disabled,
}: Props) {
  return (
    <section className="product-counter" aria-label={`${product.name} sold`}>
      <div className="product-counter__header">
        <span className="product-counter__name">{product.name}</span>
        <span className="product-counter__price">{formatPrice(product.price_cents)}</span>
      </div>
      <div className="product-counter__controls">
        <button
          type="button"
          className="product-counter__btn product-counter__btn--minus"
          onClick={onMinus}
          disabled={disabled}
          aria-label={`Remove one ${product.name} sold`}
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
          aria-label={`Add one ${product.name} sold`}
        >
          +
        </button>
      </div>
      <div className="product-counter__earnings">
        {formatPrice(product.earnings_cents)} so far
      </div>
    </section>
  )
}
