import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { fetchMyRentals, completeRental } from '../../api/server'
import Header from '../../components/Header'

export default function AdminRentalRequests() {
  const { userId } = useAuth()
  const [rentals, setRentals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('active')
  const [toast, setToast] = useState('')

  const load = () => fetchMyRentals().then(setRentals).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const notify = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const handleComplete = async (id: number) => {
    if (!confirm('Завершить аренду?')) return
    try { await completeRental(id, 'admin_manual'); load(); notify('✅ Завершена') } catch { notify('❌ Ошибка') }
  }

  const filtered = rentals.filter(r => !filter || r.status === filter)

  return (
    <div className="flex-1 nav-spacer max-w-lg mx-auto w-full">
      <Header title="Аренды" showBack />
      <div className="p-4 space-y-3">
        {toast && <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-surface-2 border border-white/10 text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg animate-slide-up">{toast}</div>}
        <div className="flex gap-2">
          {['active', 'completed', ''].map(f => <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${filter === f ? 'bg-accent text-white' : 'bg-surface-2 text-text-secondary'}`}>{f === 'active' ? 'Активные' : f === 'completed' ? 'Завершённые' : 'Все'}</button>)}
        </div>
        {loading ? <>{[1,2,3].map(i => <div key={i} className="h-24 skeleton rounded-xl" />)}</> : filtered.length === 0 ? (
          <p className="text-center text-text-muted text-sm py-8">Нет аренд</p>
        ) : filtered.map(r => (
          <div key={r.id} className="rounded-xl bg-surface-2 border border-white/5 p-3">
            <div className="flex items-start justify-between mb-2">
              <div><p className="text-xs text-text-muted">{r.game_name}</p><p className="text-sm font-semibold">{r.account_title}</p><p className="text-xs text-text-muted">Арендатор: @{r.renter_username || '—'} · Владелец: {r.owner_id}</p></div>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${r.status === 'active' ? 'text-success bg-success/10' : 'text-text-muted bg-surface-3'}`}>{r.status === 'active' ? 'Активна' : 'Завершена'}</span>
            </div>
            <p className="text-xs text-accent">{r.hours}ч · {r.price}₽</p>
            {r.status === 'active' && <><p className="text-xs text-text-muted mt-1">До: {new Date(r.expires_at).toLocaleString('ru-RU')}</p><button onClick={() => handleComplete(r.id)} className="mt-2 w-full py-2 rounded-lg bg-danger/10 text-xs font-medium text-danger active:bg-danger/20">⛔ Завершить</button></>}
          </div>
        ))}
      </div>
    </div>
  )
}
