import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchOrders } from '../api'
import type { Order } from '../types'
import Header from '../components/Header'

export default function MyRentalsPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchOrders().then(setOrders).catch(console.error).finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex-1 nav-spacer max-w-lg mx-auto w-full">
      <Header title="Мои аренды" />
      <div className="p-4 space-y-3">
        {loading ? (
          <>
            <div className="h-24 skeleton rounded-xl" />
            <div className="h-24 skeleton rounded-xl" />
          </>
        ) : orders.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">📦</div>
            <p className="text-text-secondary text-sm mb-4">У вас пока нет аренд</p>
            <button
              onClick={() => navigate('/games')}
              className="px-6 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold active:opacity-80 transition-opacity"
            >
              Выбрать игру
            </button>
          </div>
        ) : (
          orders.map((order) => {
            const isActive = order.status === 'active'
            const expires = new Date(order.expires_at)
            const diff = expires.getTime() - Date.now()
            const days = Math.floor(diff / 86400000)
            const hours = Math.floor((diff % 86400000) / 3600000)

            return (
              <button
                key={order.id}
                onClick={() => navigate(isActive ? `/rental/${order.id}` : `/rent/${order.account_id}`)}
                className="w-full rounded-xl bg-surface-2 border border-white/5 p-4 text-left transition-all active:scale-[0.98]"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    isActive ? 'text-success bg-success/10' : 'text-text-muted bg-surface-3'
                  }`}>
                    {isActive ? 'Активна' : 'Завершена'}
                  </span>
                  <span className="text-xs text-text-muted">{order.total_price}₽</span>
                </div>
                <p className="text-xs text-text-secondary mb-0.5">{order.game_name}</p>
                <p className="text-sm font-semibold">{order.account_title}</p>
                {isActive && (
                  <p className="text-xs text-accent mt-2">Осталось: {days}д {hours}ч</p>
                )}
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
