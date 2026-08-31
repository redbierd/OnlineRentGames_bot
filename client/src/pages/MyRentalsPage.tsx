import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { fetchOrders } from '../api'
import { fetchRentalRequests } from '../api/server'
import type { Order } from '../types'
import Header from '../components/Header'

export default function MyRentalsPage() {
  const { userId } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([
      fetchOrders().catch(() => []),
      fetchRentalRequests(userId).catch(() => []),
    ]).then(([o, r]) => { setOrders(o); setRequests(r) }).finally(() => setLoading(false))
  }, [userId])

  const pendingRequests = requests.filter(r => r.status === 'pending')
  const approvedRequests = requests.filter(r => r.status === 'approved')
  const rejectedRequests = requests.filter(r => r.status === 'rejected')

  return (
    <div className="flex-1 nav-spacer max-w-lg mx-auto w-full">
      <Header title="Мои аренды" />
      <div className="p-4 space-y-4">
        {loading ? (
          <>{[1,2].map(i => <div key={i} className="h-24 skeleton rounded-xl" />)}</>
        ) : orders.length === 0 && requests.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">📦</div>
            <p className="text-text-secondary text-sm mb-4">У вас пока нет аренд</p>
            <button onClick={() => navigate('/games')} className="px-6 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold active:opacity-80">
              Выбрать игру
            </button>
          </div>
        ) : (
          <>
            {/* Pending requests */}
            {pendingRequests.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-text-secondary mb-2">🟡 Ожидают одобрения</h3>
                {pendingRequests.map(r => (
                  <div key={r.id} className="rounded-xl bg-warning/5 border border-warning/20 p-4 mb-2">
                    <p className="text-xs text-text-muted">{r.game_name}</p>
                    <p className="text-sm font-semibold">{r.account_title}</p>
                    <p className="text-xs text-accent mt-1">{r.hours}ч · {r.total_price}₽</p>
                    <p className="text-[10px] text-text-muted mt-1">Отправлено: {new Date(r.created_at).toLocaleString('ru-RU')}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Active orders */}
            {orders.filter(o => o.status === 'active').length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-text-secondary mb-2">🟢 Активные аренды</h3>
                {orders.filter(o => o.status === 'active').map(order => {
                  const expires = new Date(order.expires_at)
                  const diff = Math.max(0, expires.getTime() - Date.now())
                  const hours = Math.floor(diff / 3600000)
                  const mins = Math.floor((diff % 3600000) / 60000)

                  return (
                    <button key={order.id} onClick={() => navigate(`/rental/${order.id}`)} className="w-full rounded-xl bg-surface-2 border border-accent/20 p-4 text-left glow-border mb-2">
                      <p className="text-xs text-text-muted">{order.game_name}</p>
                      <p className="text-sm font-semibold">{order.account_title}</p>
                      <p className="text-xs text-accent mt-1">Осталось: {hours}ч {mins}м</p>
                    </button>
                  )
                })}
              </div>
            )}

            {/* Rejected requests */}
            {rejectedRequests.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-text-secondary mb-2">🔴 Отклонённые</h3>
                {rejectedRequests.map(r => (
                  <div key={r.id} className="rounded-xl bg-surface-2 border border-white/5 p-4 mb-2">
                    <p className="text-xs text-text-muted">{r.game_name}</p>
                    <p className="text-sm font-semibold">{r.account_title}</p>
                    <p className="text-xs text-danger mt-1">Отклонено</p>
                  </div>
                ))}
              </div>
            )}

            {/* Completed orders */}
            {orders.filter(o => o.status === 'completed').length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-text-secondary mb-2">📦 Завершённые</h3>
                {orders.filter(o => o.status === 'completed').map(order => (
                  <div key={order.id} className="rounded-xl bg-surface-2 border border-white/5 p-4 mb-2 opacity-60">
                    <p className="text-xs text-text-muted">{order.game_name}</p>
                    <p className="text-sm font-semibold">{order.account_title}</p>
                    <p className="text-xs text-text-muted mt-1">{order.total_price}₽</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
