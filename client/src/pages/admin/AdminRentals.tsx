import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { adminGetOrders, adminExtendOrder, adminReduceOrder, adminCompleteOrder } from '../../api/admin'
import type { Order } from '../../types'
import Header from '../../components/Header'

export default function AdminRentals() {
  const { userId } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('active')
  const [toast, setToast] = useState('')

  const load = () => adminGetOrders(userId).then(setOrders).finally(() => setLoading(false))
  useEffect(() => { load() }, [userId])
  const notify = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const filtered = orders.filter(o => !filter || o.status === filter)

  const handleExtend = async (id: number, h: number) => {
    try { await adminExtendOrder(userId, id, h); load(); notify(`✅ +${h}ч`) } catch { notify('❌ Ошибка') }
  }
  const handleReduce = async (id: number, h: number) => {
    try { await adminReduceOrder(userId, id, h); load(); notify(`✅ -${h}ч`) } catch { notify('❌ Ошибка') }
  }
  const handleComplete = async (id: number) => {
    if (!confirm('Завершить аренду?')) return
    try { await adminCompleteOrder(userId, id); load(); notify('✅ Завершена') } catch { notify('❌ Ошибка') }
  }

  return (
    <div className="flex-1 nav-spacer max-w-lg mx-auto w-full">
      <Header title="Аренды" showBack />
      <div className="p-4 space-y-3">
        {toast && <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-surface-2 border border-white/10 text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg animate-slide-up">{toast}</div>}

        <div className="flex gap-2">
          {['active', 'completed', ''].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === f ? 'bg-accent text-white' : 'bg-surface-2 text-text-secondary'}`}
            >
              {f === 'active' ? 'Активные' : f === 'completed' ? 'Завершённые' : 'Все'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-24 skeleton rounded-xl" />)}</div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-text-muted text-sm py-8">Нет аренд</p>
        ) : (
          filtered.map(order => (
            <div key={order.id} className="rounded-xl bg-surface-2 border border-white/5 p-3">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-xs text-text-muted">{order.game_name}</p>
                  <p className="text-sm font-semibold">{order.account_title}</p>
                  <p className="text-xs text-text-muted">@{order.username || '—'} · ID: {order.user_id}</p>
                </div>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${order.status === 'active' ? 'text-success bg-success/10' : 'text-text-muted bg-surface-3'}`}>
                  {order.status === 'active' ? 'Активна' : 'Завершена'}
                </span>
              </div>
              {order.status === 'active' && (
                <>
                  <p className="text-xs text-accent mb-2">До: {new Date(order.expires_at).toLocaleString('ru-RU')}</p>
                  <div className="flex gap-2">
                    <button onClick={() => handleExtend(order.id, 1)} className="flex-1 py-1.5 rounded-lg bg-surface-3 text-xs text-text-secondary active:bg-surface">+1ч</button>
                    <button onClick={() => handleExtend(order.id, 3)} className="flex-1 py-1.5 rounded-lg bg-surface-3 text-xs text-text-secondary active:bg-surface">+3ч</button>
                    <button onClick={() => handleReduce(order.id, 1)} className="flex-1 py-1.5 rounded-lg bg-surface-3 text-xs text-text-secondary active:bg-surface">-1ч</button>
                    <button onClick={() => handleComplete(order.id)} className="px-3 py-1.5 rounded-lg bg-danger/10 text-xs text-danger active:bg-danger/20">Завершить</button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
