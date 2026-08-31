import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { adminGetListings } from '../../api/admin'
import type { ListingApplication, ListingStatus } from '../../types'
import Header from '../../components/Header'

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: '🟡 На модерации', color: 'bg-warning/10 text-warning' },
  approved: { label: '🟢 Одобрены', color: 'bg-success/10 text-success' },
  rejected: { label: '🔴 Отклонены', color: 'bg-danger/10 text-danger' },
  suspended: { label: '⚫ Приостановлены', color: 'bg-surface-3 text-text-muted' },
}

export default function AdminModeration() {
  const { userId } = useAuth()
  const navigate = useNavigate()
  const [listings, setListings] = useState<ListingApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<ListingStatus>('pending')

  const load = () => adminGetListings(userId, filter).then(setListings).finally(() => setLoading(false))
  useEffect(() => { load() }, [userId, filter])

  return (
    <div className="flex-1 nav-spacer max-w-lg mx-auto w-full">
      <Header title="Модерация" showBack />
      <div className="p-4 space-y-3">
        <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {(['pending', 'approved', 'rejected', 'suspended'] as ListingStatus[]).map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${filter === s ? STATUS_MAP[s].color : 'bg-surface-2 text-text-secondary'}`}
            >
              {STATUS_MAP[s].label}
            </button>
          ))}
        </div>

        {loading ? (
          <>{[1,2,3].map(i => <div key={i} className="h-24 skeleton rounded-xl" />)}</>
        ) : listings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-muted text-sm">Нет заявок</p>
          </div>
        ) : (
          listings.map(l => (
            <button
              key={l.id}
              onClick={() => navigate(`/admin/moderation/${l.id}`)}
              className="w-full rounded-xl bg-surface-2 border border-white/5 p-4 text-left active:bg-surface-3 transition-colors"
            >
              <div className="flex items-start justify-between mb-1">
                <div>
                  <p className="text-xs text-text-muted">{l.game_name}</p>
                  <p className="text-sm font-semibold">{l.title}</p>
                </div>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_MAP[l.status].color}`}>
                  {STATUS_MAP[l.status].label}
                </span>
              </div>
              <p className="text-xs text-accent">{l.price_per_day}₽/день</p>
              <p className="text-[10px] text-text-muted mt-1">@{l.username || '—'} · {new Date(l.created_at).toLocaleString('ru-RU')}</p>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
