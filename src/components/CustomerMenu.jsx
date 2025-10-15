import { useMemo, useState } from 'react'
import MenuItemCard from './MenuItemCard'
import { menuSections } from '../data/menu'

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '')

const colones = new Intl.NumberFormat('es-CR', {
  style: 'currency',
  currency: 'CRC',
  maximumFractionDigits: 0
})

export default function CustomerMenu() {
  const [quantities, setQuantities] = useState({})
  const [customer, setCustomer] = useState({
    name: '',
    contact: '',
    deliveryMethod: 'pickup',
    table: '',
    notes: ''
  })
  const [status, setStatus] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const orderItems = useMemo(() => {
    return menuSections
      .flatMap((section) => section.items)
      .filter((item) => (quantities[item.id] || 0) > 0)
      .map((item) => ({
        ...item,
        quantity: quantities[item.id] || 0,
        subtotal: item.price * (quantities[item.id] || 0)
      }))
  }, [quantities])

  const total = useMemo(
    () => orderItems.reduce((acc, item) => acc + item.subtotal, 0),
    [orderItems]
  )

  const canSubmit = orderItems.length > 0 && customer.name.trim() && customer.contact.trim()

  const updateQuantity = (itemId, diff) => {
    setQuantities((prev) => {
      const next = { ...prev }
      const current = next[itemId] || 0
      next[itemId] = Math.max(0, current + diff)
      if (next[itemId] === 0) {
        delete next[itemId]
      }
      return next
    })
  }

  const resetForm = () => {
    setQuantities({})
    setCustomer({ name: '', contact: '', deliveryMethod: 'pickup', table: '', notes: '' })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!canSubmit || submitting) return

    setSubmitting(true)
    setStatus({ type: 'info', message: 'Enviando pedido…' })

    const payload = {
      items: orderItems.map(({ id, name, quantity, price, subtotal }) => ({
        id,
        name,
        quantity,
        price,
        subtotal
      })),
      total,
      customer,
      channel: 'digital-menu',
      submittedAt: new Date().toISOString()
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error('Respuesta inválida del servidor')
      }

      const data = await response.json()
      setStatus({
        type: 'success',
        message: `¡Pedido enviado! Código de seguimiento: ${data.shortId || data.id}`
      })
      resetForm()
    } catch (error) {
      console.error(error)
      setStatus({
        type: 'error',
        message:
          'No se pudo enviar el pedido. Revisa tu conexión o intenta nuevamente en unos segundos.'
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="space-y-10">
      <div className="grid gap-6 rounded-3xl bg-white/80 p-6 shadow-xl ring-1 ring-orange-100 lg:grid-cols-[2fr,1fr]">
        <div className="space-y-6">
          {menuSections.map((section) => (
            <div key={section.id} className="space-y-4">
              <div>
                <p className="text-sm uppercase tracking-wide text-orange-400">{section.title}</p>
                <h2 className="text-2xl font-bold text-gray-900">{section.description}</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {section.items.map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    quantity={quantities[item.id] || 0}
                    onIncrement={() => updateQuantity(item.id, 1)}
                    onDecrement={() => updateQuantity(item.id, -1)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <aside className="space-y-6 rounded-3xl border border-orange-100 bg-orange-50/60 p-6">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-orange-400">Carrito</p>
            <h3 className="text-xl font-semibold text-gray-900">Resumen del pedido</h3>
            <p className="text-sm text-gray-500">
              Los pedidos llegan en tiempo real al panel de recepción. Podés editar los datos antes de
              enviar.
            </p>
          </div>

          <div className="space-y-3">
            {orderItems.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-orange-200 bg-white px-4 py-6 text-center text-sm text-gray-500">
                Agregá ítems tocando el botón <span className="font-semibold text-orange-500">+</span>.
              </p>
            ) : (
              <ul className="space-y-3">
                {orderItems.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start justify-between gap-4 rounded-2xl bg-white px-4 py-3 shadow-sm"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {item.quantity} × {item.name}
                      </p>
                      <p className="text-xs text-gray-500">{colones.format(item.price)} c/u</p>
                    </div>
                    <p className="text-sm font-semibold text-gray-800">{colones.format(item.subtotal)}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-inner">
            <span className="text-sm font-semibold text-gray-500">Total estimado</span>
            <span className="text-xl font-bold text-orange-600">{colones.format(total)}</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4">
              <label className="space-y-1 text-sm">
                <span className="font-medium text-gray-700">Nombre del cliente</span>
                <input
                  type="text"
                  required
                  value={customer.name}
                  onChange={(event) => setCustomer((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Ej: Laura Serrano"
                  className="w-full rounded-2xl border border-orange-200 bg-white px-4 py-2 text-sm outline-none transition focus:border-orange-400 focus:ring focus:ring-orange-100"
                />
              </label>

              <label className="space-y-1 text-sm">
                <span className="font-medium text-gray-700">WhatsApp o teléfono</span>
                <input
                  type="tel"
                  required
                  value={customer.contact}
                  onChange={(event) =>
                    setCustomer((prev) => ({ ...prev, contact: event.target.value }))
                  }
                  placeholder="+506 8888 0000"
                  className="w-full rounded-2xl border border-orange-200 bg-white px-4 py-2 text-sm outline-none transition focus:border-orange-400 focus:ring focus:ring-orange-100"
                />
              </label>

              <fieldset className="rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm">
                <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-orange-400">
                  Entrega
                </legend>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-transparent px-3 py-2 transition hover:border-orange-200">
                    <input
                      type="radio"
                      name="delivery"
                      value="pickup"
                      checked={customer.deliveryMethod === 'pickup'}
                      onChange={(event) =>
                        setCustomer((prev) => ({ ...prev, deliveryMethod: event.target.value }))
                      }
                    />
                    Retiro en el local
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-transparent px-3 py-2 transition hover:border-orange-200">
                    <input
                      type="radio"
                      name="delivery"
                      value="table"
                      checked={customer.deliveryMethod === 'table'}
                      onChange={(event) =>
                        setCustomer((prev) => ({ ...prev, deliveryMethod: event.target.value }))
                      }
                    />
                    Llevar a la mesa
                  </label>
                </div>

                {customer.deliveryMethod === 'table' && (
                  <div className="mt-3">
                    <label className="space-y-1 text-sm">
                      <span className="font-medium text-gray-700">Número de mesa</span>
                      <input
                        type="text"
                        value={customer.table}
                        onChange={(event) =>
                          setCustomer((prev) => ({ ...prev, table: event.target.value }))
                        }
                        placeholder="Ej: Terraza 4"
                        className="w-full rounded-2xl border border-orange-200 bg-white px-4 py-2 text-sm outline-none transition focus:border-orange-400 focus:ring focus:ring-orange-100"
                      />
                    </label>
                  </div>
                )}
              </fieldset>

              <label className="space-y-1 text-sm">
                <span className="font-medium text-gray-700">Notas adicionales</span>
                <textarea
                  value={customer.notes}
                  onChange={(event) => setCustomer((prev) => ({ ...prev, notes: event.target.value }))}
                  placeholder="Ej: Sin cilantro en los tacos, entregar con servilletas extra."
                  rows={3}
                  className="w-full rounded-2xl border border-orange-200 bg-white px-4 py-2 text-sm outline-none transition focus:border-orange-400 focus:ring focus:ring-orange-100"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={!canSubmit || submitting}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-orange-500 px-6 py-3 text-base font-semibold text-white shadow-lg transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-orange-200"
            >
              {submitting ? 'Enviando…' : 'Enviar pedido a la cocina'}
            </button>

            {status && (
              <p
                className={`rounded-2xl px-4 py-3 text-sm font-medium ${
                  status.type === 'success'
                    ? 'bg-green-100 text-green-700'
                    : status.type === 'error'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-orange-100 text-orange-700'
                }`}
              >
                {status.message}
              </p>
            )}
          </form>
        </aside>
      </div>
    </section>
  )
}
