const colones = new Intl.NumberFormat('es-CR', {
  style: 'currency',
  currency: 'CRC',
  maximumFractionDigits: 0
})

export default function MenuItemCard({ item, quantity, onIncrement, onDecrement }) {
  return (
    <article className="rounded-2xl border border-orange-100 bg-white/80 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
            {item.recommended && (
              <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-600">
                Recomendado
              </span>
            )}
            {item.spicy && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-500">
                Picante
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600">{item.description}</p>
        </div>
        <p className="text-lg font-semibold text-orange-600">{colones.format(item.price)}</p>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDecrement}
            disabled={quantity === 0}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-orange-200 text-xl font-semibold text-orange-500 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-300"
          >
            −
          </button>
          <span className="w-8 text-center text-lg font-semibold text-gray-800">{quantity}</span>
          <button
            type="button"
            onClick={onIncrement}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-xl font-semibold text-white transition hover:bg-orange-600"
          >
            +
          </button>
        </div>
        <p className="text-xs uppercase tracking-wide text-gray-400">Listo en 8-12 min</p>
      </div>
    </article>
  )
}
