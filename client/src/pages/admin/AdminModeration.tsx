import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchModeration } from '../../api/admin'
import Header from '../../components/Header'

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending_moderation: { label: '🟡 На модерации', color: 'bg-warning/10 text-warning' },
  available: { label: '🟢 Одобрены', color: 'bg-success/10 text-success' },
  rejected: { label: '🔴 Отклонены', color: 'bg-danger/10 text-danger' },
  rented: { label: '🔵 В аренде', color: 'bg-accent/10 text-accent' },
  waiting_password_change: { label: '⚠️ Смена пароля', color: 'bg-warning/10 text-warning' },
}

export default function AdminModeration() {
  const navigate = useNavigate()
  const [accounts, setAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending_moderation')

  useEffect(() => { fetchModeration(filter).then(setAccounts).finally(() => setLoading(false)) }, [filter])

  return (
    <div className="flex-1 nav-spacer max-w-lg mx-auto w-full">
      <Header title="Проверка заявок" showBack />
      <div className="p-4 space-y-3">
        <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {['pending_moderation', 'available', 'rejected'].map(s => (
            <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${filter === s ? STATUS_MAP[s]?.color || '' : 'bg-surface-2 text-text-secondary'}`}>
              {STATUS_MAP[s]?.label || s}
            </button>
          ))}
        </div>
        {loading ? <>{[1,2,3].map(i => <div key={i} className="h-24 skeleton rounded-xl" />)}</> : accounts.length === 0 ? (
          <p className="text-center text-text-muted text-sm py-8">Нет заявок</p>
        ) : accounts.map(a => (
          <button key={a.id} onClick={() => navigate(`/admin/moderation/${a.id}`)} className="w-full rounded-xl bg-surface-2 border border-white/5 p-4 text-left active:bg-surface-3">
            <div className="flex items-start justify-between mb-1">
              <div><p className="text-xs text-text-muted">{a.game_name}</p><p className="text-sm font-semibold">{a.title}</p></div>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_MAP[a.status]?.color || ''}`}>{STATUS_MAP[a.status]?.label || a.status}</span>
            </div>
            <p className="text-xs text-accent">{a.price_per_hour}₽/час</p>
            <p className="text-[10px] text-text-muted mt-1">@{a.owner_username || '—'} · {new Date(a.created_at).toLocaleString('ru-RU')}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
