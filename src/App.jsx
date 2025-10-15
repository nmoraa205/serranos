import { useState } from 'react'
import CustomerMenu from './components/CustomerMenu'
import ReceptionDashboard from './components/ReceptionDashboard'

const tabs = [
  { id: 'customer', label: 'Menú Digital' },
  { id: 'reception', label: 'Panel de Recepción' }
]

export default function App() {
  const [activeTab, setActiveTab] = useState('customer')

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-amber-100">
      <header className="sticky top-0 z-10 backdrop-blur bg-white/75 shadow-sm">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-widest text-orange-500">Tacos Serrano</p>
            <h1 className="text-3xl font-black text-gray-900 sm:text-4xl">
              Ordená en segundos, recibí al instante
            </h1>
            <p className="mt-2 max-w-xl text-sm text-gray-600">
              Elegí tus platos favoritos, enviá el pedido a la nube y recibí notificaciones en el
              panel de recepción con alertas estilo Uber.
            </p>
          </div>
          <nav className="flex shrink-0 rounded-full bg-white p-1 shadow-inner">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? 'bg-orange-500 text-white shadow'
                    : 'text-orange-500 hover:bg-orange-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        {activeTab === 'customer' ? <CustomerMenu /> : <ReceptionDashboard />}
      </main>

      <footer className="mx-auto max-w-6xl px-6 pb-10 text-sm text-gray-500">
        <p>
          Sugerencia: imprimí un código QR con este enlace para que tus clientes abran el menú.
          Configurá la URL de la API en <code className="rounded bg-gray-100 px-1 py-0.5">.env</code>{' '}
          usando <code className="rounded bg-gray-100 px-1 py-0.5">VITE_API_URL</code> y{' '}
          <code className="rounded bg-gray-100 px-1 py-0.5">VITE_WS_URL</code> para apuntar a tu
          servidor en la nube.
        </p>
      </footer>
    </div>
  )
}
