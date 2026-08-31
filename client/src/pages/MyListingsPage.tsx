import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { getMyListings } from '../api/admin'
import type { ListingApplication } from '../types'
import Header from '../components/Header'

const STATUS_MAP: Record<string, { label: string; color: string; icon: string }> = {
  pending: { label: 'На модерации', color: 'text-warning bg-warning/10', icon: '🟡' },
  approved: { label: 'Одобрен', color: 'text-success bg-success/10', icon: '🟢' },
  rejected: { label: 'Отклонён', color: 'text-danger bg-danger/10', icon: '🔴' },
  suspended: { label: 'Приостановлен', color: 'text-text-muted bg-surface-3', icon: '⚫' },
}

export default function MyListingsPage() {
  const { userId } = useAuth()
  const [listings, setListings] = useState<ListingApplication[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMyListings(userId).then(setListings).finally(() => setLoading(false))
  }, [userId])

  return (
    <div className="flex-1 max-w-lg mx-auto w-full">
      <Header title="Мои аккаунты" showBack />
      <div className="p-4 space-y-3">
        {loading ? (
          <>{[1,2].map(i => <div key={i} className="h-24 skeleton rounded-xl" />)}</>
        ) : listings.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">💼</div>
            <p className="text-text-secondary text-sm">Вы пока не сдаёте аккаунты</p>
          </div>
        ) : (
          listings.map(l => {
            const st = STATUS_MAP[l.status]
            return (
              <div key={l.id} className="rounded-xl bg-surface-2 border border-white/5 p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-xs text-text-muted">{l.game_name}</p>
                    <p className="text-sm font-semibold">{l.title}</p>
                    <p className="text-xs text-accent">{l.price_per_day}₽/день</p>
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${st.color}`}>
                    {st.icon} {st.label}
                  </span>
                </div>
                <p className="text-[10px] text-text-muted">Отправлено: {new Date(l.created_at).toLocaleString('ru-RU')}</p>
                {l.status === 'rejected' && l.rejection_reason && (
                  <p className="text-xs text-danger mt-1">Причина: {l.rejection_reason}</p>
                )}
                {l.status === 'rejected' && (
                  <button className="mt-2 w-full py-2 rounded-lg bg-surface-3 text-xs font-medium text-text-secondary active:bg-surface">
                    ✏️ Исправить и отправить повторно
                  </button>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
