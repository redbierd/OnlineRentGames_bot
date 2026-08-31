import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { fetchRentalRequests, approveRentalRequest, rejectRentalRequest } from '../../api/server'
import Header from '../../components/Header'

export default function AdminRentalRequests() {
  const { userId } = useAuth()
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [toast, setToast] = useState('')

  const load = () => fetchRentalRequests(undefined, filter).then(setRequests).finally(() => setLoading(false))
  useEffect(() => { load() }, [filter])

  const notify = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const handleApprove = async (id: number) => {
    if (!confirm('Одобрить аренду?')) return
    try { await approveRentalRequest(id); load(); notify('✅ Аренда одобрена') } catch { notify('❌ Ошибка') }
  }

  const handleReject = async (id: number) => {
    const reason = prompt('Причина отклонения:')
    if (!reason) return
    try { await rejectRentalRequest(id, reason); load(); notify('❌ Заявка отклонена') } catch { notify('❌ Ошибка') }
  }

  return (
    <div className="flex-1 nav-spacer max-w-lg mx-auto w-full">
      <Header title="Заявки на аренду" showBack />
      <div className="p-4 space-y-3">
        {toast && <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-surface-2 border border-white/10 text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg animate-slide-up">{toast}</div>}

        <div className="flex gap-2">
          {['pending', 'approved', 'rejected'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === f ? 'bg-accent text-white' : 'bg-surface-2 text-text-secondary'}`}>
              {f === 'pending' ? '🟡 Ожидают' : f === 'approved' ? '🟢 Одобрены' : '🔴 Отклонены'}
            </button>
          ))}
        </div>

        {loading ? (
          <>{[1,2,3].map(i => <div key={i} className="h-24 skeleton rounded-xl" />)}</>
        ) : requests.length === 0 ? (
          <p className="text-center text-text-muted text-sm py-8">Нет заявок</p>
        ) : (
          requests.map(r => (
            <div key={r.id} className="rounded-xl bg-surface-2 border border-white/5 p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-xs text-text-muted">{r.game_name}</p>
                  <p className="text-sm font-semibold">{r.account_title}</p>
                  <p className="text-xs text-accent">{r.hours}ч · {r.total_price}₽</p>
                </div>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${r.status === 'pending' ? 'text-warning bg-warning/10' : r.status === 'approved' ? 'text-success bg-success/10' : 'text-danger bg-danger/10'}`}>
                  {r.status === 'pending' ? '🟡' : r.status === 'approved' ? '🟢' : '🔴'}
                </span>
              </div>
              <p className="text-xs text-text-muted">@{r.requester_username || '—'} · ID: {r.requester_id}</p>
              <p className="text-[10px] text-text-muted">{new Date(r.created_at).toLocaleString('ru-RU')}</p>

              {r.status === 'pending' && (
                <div className="flex gap-2 mt-3">
                  <button onClick={() => handleApprove(r.id)} className="flex-1 py-2.5 rounded-lg bg-success text-white text-xs font-semibold active:opacity-80">✅ Одобрить</button>
                  <button onClick={() => handleReject(r.id)} className="flex-1 py-2.5 rounded-lg bg-danger/10 text-danger text-xs font-semibold active:bg-danger/20">❌ Отклонить</button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
