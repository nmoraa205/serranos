import { useEffect, useMemo, useRef, useState } from 'react'

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '')
const WS_BASE_URL = (import.meta.env.VITE_WS_URL || 'ws://localhost:4000').replace(/\/$/, '')

const colones = new Intl.NumberFormat('es-CR', {
  style: 'currency',
  currency: 'CRC',
  maximumFractionDigits: 0
})

const statusLabels = {
  pending: 'Pendiente',
  acknowledged: 'En preparación',
  ready: 'Listo'
}

export default function ReceptionDashboard() {
  const [orders, setOrders] = useState([])
  const [connectionStatus, setConnectionStatus] = useState('connecting')
  const [filter, setFilter] = useState('pending')
  const [highlightedId, setHighlightedId] = useState(null)
  const reconnectTimeout = useRef(null)
  const wsRef = useRef(null)
  const audioContextRef = useRef(null)

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/orders`)
        if (!response.ok) throw new Error('Error al cargar pedidos')
        const data = await response.json()
        if (Array.isArray(data.orders)) {
          setOrders(data.orders)
        } else if (Array.isArray(data)) {
          setOrders(data)
        }
      } catch (error) {
        console.error(error)
      }
    }

    fetchOrders()
  }, [])

  useEffect(() => {
    const connect = () => {
      setConnectionStatus('connecting')
      const ws = new WebSocket(`${WS_BASE_URL}/ws`)
      wsRef.current = ws

      ws.addEventListener('open', () => {
        setConnectionStatus('connected')
      })

      ws.addEventListener('close', () => {
        setConnectionStatus('disconnected')
        wsRef.current = null
        reconnectTimeout.current = setTimeout(connect, 2000)
      })

      ws.addEventListener('error', () => {
        ws.close()
      })

      ws.addEventListener('message', (event) => {
        try {
          const message = JSON.parse(event.data)
          if (message.type === 'ORDERS_SNAPSHOT' && Array.isArray(message.payload)) {
            setOrders(message.payload)
          }
          if (message.type === 'NEW_ORDER' && message.payload) {
            setOrders((prev) => [message.payload, ...prev.filter((order) => order.id !== message.payload.id)])
            setHighlightedId(message.payload.id)
            playNotification()
          }
          if (message.type === 'ORDER_UPDATED' && message.payload) {
            setOrders((prev) =>
              prev.map((order) => (order.id === message.payload.id ? { ...order, ...message.payload } : order))
            )
          }
        } catch (error) {
          console.error('Mensaje inválido', error)
        }
      })
    }

    connect()

    return () => {
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current)
      if (wsRef.current) wsRef.current.close()
    }
  }, [])

  const filteredOrders = useMemo(() => {
    if (filter === 'all') return orders
    return orders.filter((order) => order.status === filter)
  }, [orders, filter])

  useEffect(() => {
    if (!highlightedId) return
    const timeout = setTimeout(() => setHighlightedId(null), 2500)
    return () => clearTimeout(timeout)
  }, [highlightedId])

  const playNotification = () => {
    try {
      const ctx = audioContextRef.current || new (window.AudioContext || window.webkitAudioContext)()
      audioContextRef.current = ctx
      const now = ctx.currentTime
      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()
      oscillator.type = 'triangle'
      oscillator.frequency.setValueAtTime(660, now)
      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.exponentialRampToValueAtTime(0.3, now + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6)
      oscillator.connect(gain)
      gain.connect(ctx.destination)
      oscillator.start(now)
      oscillator.stop(now + 0.6)
    } catch (error) {
      console.warn('No se pudo reproducir el sonido de alerta', error)
    }
  }

  const updateStatus = async (orderId, status) => {
    const previous = orders.find((order) => order.id === orderId)
    setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, status } : order)))

    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (!response.ok) {
        throw new Error('No se pudo actualizar el pedido')
      }
    } catch (error) {
      console.error(error)
      if (previous) {
        setOrders((prev) =>
          prev.map((order) => (order.id === orderId ? { ...order, status: previous.status } : order))
        )
      }
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Panel de pedidos en vivo</h2>
          <p className="text-sm text-gray-600">
            Recibí los pedidos que llegan desde el menú digital. Se muestran primero los más recientes.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-orange-200 bg-white px-4 py-2 text-sm text-gray-600 shadow">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              connectionStatus === 'connected'
                ? 'bg-green-500'
                : connectionStatus === 'connecting'
                ? 'bg-yellow-400 animate-pulse'
                : 'bg-red-500'
            }`}
          />
          {connectionStatus === 'connected'
            ? 'Conectado con la nube'
            : connectionStatus === 'connecting'
            ? 'Conectando…'
            : 'Desconectado'}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {[
          { id: 'pending', label: 'Pendientes' },
          { id: 'acknowledged', label: 'En preparación' },
          { id: 'ready', label: 'Listos' },
          { id: 'all', label: 'Todos' }
        ].map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setFilter(option.id)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
              filter === option.id
                ? 'border-orange-400 bg-orange-500 text-white shadow'
                : 'border-orange-200 bg-white text-orange-500 hover:border-orange-300'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-orange-200 bg-white/70 p-10 text-center text-sm text-gray-500">
          No hay pedidos en este estado todavía. Cuando llegue uno nuevo escuchás la alerta automática.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredOrders.map((order) => {
            const isHighlighted = highlightedId === order.id
            return (
              <article
                key={order.id}
                className={`flex h-full flex-col justify-between rounded-3xl border border-orange-100 bg-white/80 p-5 shadow-md transition ${
                  isHighlighted ? 'ring-4 ring-orange-400/60' : 'hover:-translate-y-1 hover:shadow-lg'
                }`}
              >
                <header className="space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-wide text-orange-400">Pedido #{order.shortId || order.id}</p>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        order.status === 'pending'
                          ? 'bg-orange-100 text-orange-600'
                          : order.status === 'acknowledged'
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-emerald-100 text-emerald-600'
                      }`}
                    >
                      {statusLabels[order.status] || 'Pendiente'}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{order.customer?.name}</h3>
                  <p className="text-sm text-gray-500">Contacto: {order.customer?.contact}</p>
                  {order.customer?.deliveryMethod === 'table' && order.customer?.table && (
                    <p className="text-sm font-medium text-orange-600">Mesa: {order.customer.table}</p>
                  )}
                  <p className="text-xs text-gray-400">
                    {new Date(order.submittedAt || order.createdAt || Date.now()).toLocaleString('es-CR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </header>

                <ul className="my-4 space-y-2 rounded-2xl bg-orange-50/60 p-3 text-sm text-gray-700">
                  {order.items?.map((item) => (
                    <li key={item.id} className="flex items-center justify-between">
                      <span>
                        {item.quantity} × {item.name}
                      </span>
                      <span className="font-semibold">{colones.format(item.subtotal || item.price * item.quantity)}</span>
                    </li>
                  ))}
                </ul>

                {order.customer?.notes && (
                  <p className="rounded-2xl bg-gray-100/80 px-3 py-2 text-sm text-gray-600">
                    Nota: {order.customer.notes}
                  </p>
                )}

                <footer className="mt-4 flex items-center justify-between">
                  <p className="text-base font-bold text-gray-900">
                    Total: {colones.format(order.total || 0)}
                  </p>
                  <div className="flex gap-2">
                    {order.status !== 'acknowledged' && (
                      <button
                        type="button"
                        onClick={() => updateStatus(order.id, 'acknowledged')}
                        className="rounded-full border border-blue-200 px-4 py-2 text-xs font-semibold text-blue-600 transition hover:border-blue-300 hover:bg-blue-50"
                      >
                        Confirmar
                      </button>
                    )}
                    {order.status !== 'ready' && (
                      <button
                        type="button"
                        onClick={() => updateStatus(order.id, 'ready')}
                        className="rounded-full border border-emerald-200 px-4 py-2 text-xs font-semibold text-emerald-600 transition hover:border-emerald-300 hover:bg-emerald-50"
                      >
                        Listo
                      </button>
                    )}
                  </div>
                </footer>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
