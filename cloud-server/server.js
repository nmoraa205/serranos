import cors from 'cors'
import express from 'express'
import { createServer } from 'http'
import { WebSocketServer, WebSocket } from 'ws'
import { nanoid } from 'nanoid'

const app = express()
app.use(cors())
app.use(express.json())

const orders = []

const PORT = Number(process.env.PORT || 4000)

const server = createServer(app)
const wss = new WebSocketServer({ server, path: '/ws' })

const broadcast = (message) => {
  const payload = JSON.stringify(message)
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload)
    }
  })
}

const sanitizeItems = (items = []) =>
  items
    .filter((item) => Number(item.quantity) > 0)
    .map((item) => ({
      id: item.id || nanoid(6),
      name: item.name,
      quantity: Number(item.quantity),
      price: Number(item.price) || 0,
      subtotal: Number(item.subtotal || Number(item.price || 0) * Number(item.quantity))
    }))

const createOrder = (payload) => {
  const now = new Date().toISOString()
  const items = sanitizeItems(payload.items)

  if (!items.length) {
    throw new Error('El pedido debe tener al menos un producto')
  }

  const id = nanoid(10)
  return {
    id,
    shortId: id.slice(-5).toUpperCase(),
    status: 'pending',
    items,
    total:
      typeof payload.total === 'number'
        ? Math.max(0, Math.round(payload.total))
        : items.reduce((acc, item) => acc + item.subtotal, 0),
    customer: {
      name: payload.customer?.name || 'Cliente',
      contact: payload.customer?.contact || '',
      deliveryMethod: payload.customer?.deliveryMethod || 'pickup',
      table: payload.customer?.table || '',
      notes: payload.customer?.notes || ''
    },
    channel: payload.channel || 'digital-menu',
    submittedAt: payload.submittedAt || now,
    createdAt: now
  }
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() })
})

app.get('/api/orders', (_req, res) => {
  res.json({ orders })
})

app.post('/api/orders', (req, res) => {
  try {
    const order = createOrder(req.body || {})
    orders.unshift(order)
    broadcast({ type: 'NEW_ORDER', payload: order })
    res.status(201).json(order)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

app.patch('/api/orders/:id', (req, res) => {
  const { id } = req.params
  const order = orders.find((item) => item.id === id)
  if (!order) {
    return res.status(404).json({ error: 'Pedido no encontrado' })
  }

  const allowedStatus = ['pending', 'acknowledged', 'ready']
  const nextStatus = req.body?.status

  if (!allowedStatus.includes(nextStatus)) {
    return res.status(400).json({ error: 'Estado inválido' })
  }

  order.status = nextStatus
  broadcast({ type: 'ORDER_UPDATED', payload: order })
  res.json(order)
})

wss.on('connection', (socket) => {
  socket.send(JSON.stringify({ type: 'ORDERS_SNAPSHOT', payload: orders }))
})

server.listen(PORT, () => {
  console.log(`🚀 Cloud order server ready on port ${PORT}`)
})
