import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { getMyListings } from '../api/admin'
import { fetchMyAccounts } from '../api/server'
import type { ListingApplication } from '../types'
import Header from '../components/Header'

const STATUS_MAP: Record<string, { label: string; color: string; icon: string }> = {
  pending: { label: 'На модерации', color: 'text-warning bg-warning/10', icon: '🟡' },
  approved: { label: 'Одобрен', color: 'text-success bg-success/10', icon: '🟢' },
  rejected: { label: 'Отклонён', color: 'text-danger bg-danger/10', icon: '🔴' },
  suspended: { label: 'Приостановлен', color: 'text-text-muted bg-surface-3', icon: '⚫' },
}

interface AccountInfo {
  listing_id: number
  game_name: string
  title: string
  price_per_day: number
  rank: string
  account_id: number | null
  account_status: string
  is_rented: boolean
  current_order: { id: number; username: string; expires_at: string; total_price: number } | null
  total_rentals: number
  total_income: number
}

export default function MyListingsPage() {
  const { userId } = useAuth()
  const [listings, setListings] = useState<ListingApplication[]>([])
  const [accounts, setAccounts] = useState<AccountInfo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getMyListings(userId),
      fetchMyAccounts(userId),
    ]).then(([l, a]) => {
      setListings(l)
      setAccounts(a)
    }).finally(() => setLoading(false))
  }, [userId])

  const totalIncome = accounts.reduce((sum, a) => sum + a.total_income, 0)
  const activeRentals = accounts.filter(a => a.is_rented).length

  return (
    <div className="flex-1 max-w-lg mx-auto w-full">
      <Header title="Мои аккаунты" showBack />
      <div className="p-4 space-y-4">
        {/* Stats */}
        {accounts.length > 0 && (
          <div className="grid grid-cols-3 gap-2 animate-fade-in">
            <div className="rounded-xl bg-surface-2 border border-white/5 p-3 text-center">
              <p className="text-lg font-bold">{accounts.length}</p>
              <p className="text-[10px] text-text-muted">Аккаунтов</p>
            </div>
            <div className="rounded-xl bg-surface-2 border border-white/5 p-3 text-center">
              <p className="text-lg font-bold text-success">{activeRentals}</p>
              <p className="text-[10px] text-text-muted">В аренде</p>
            </div>
            <div className="rounded-xl bg-surface-2 border border-white/5 p-3 text-center">
              <p className="text-lg font-bold text-accent">{totalIncome}₽</p>
              <p className="text-[10px] text-text-muted">Доход</p>
            </div>
          </div>
        )}

        {loading ? (
          <>{[1,2].map(i => <div key={i} className="h-24 skeleton rounded-xl" />)}</>
        ) : listings.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">💼</div>
            <p className="text-text-secondary text-sm">Вы пока не сдаёте аккаунты</p>
          </div>
        ) : (
          <>
            {/* Approved accounts with rental info */}
            {accounts.map(acc => (
              <div key={acc.listing_id} className="rounded-xl bg-surface-2 border border-white/5 overflow-hidden animate-fade-in">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-xs text-text-muted">{acc.game_name}</p>
                      <p className="text-sm font-semibold">{acc.title}</p>
                      <p className="text-xs text-accent">{acc.price_per_day}₽/день · {acc.rank}</p>
                    </div>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${acc.is_rented ? 'text-success bg-success/10' : 'text-accent bg-accent/10'}`}>
                      {acc.is_rented ? '🟢 В аренде' : '🔵 Свободен'}
                    </span>
                  </div>

                  {/* Rental info */}
                  {acc.is_rented && acc.current_order && (
                    <div className="bg-surface-3 rounded-lg p-3 mb-2">
                      <p className="text-xs text-text-muted">Арендатор</p>
                      <p className="text-sm font-medium">@{acc.current_order.username || '—'}</p>
                      <p className="text-xs text-text-muted mt-1">До: {new Date(acc.current_order.expires_at).toLocaleString('ru-RU')}</p>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex gap-4 text-xs">
                    <div>
                      <span className="text-text-muted">Аренд: </span>
                      <span className="font-medium">{acc.total_rentals}</span>
                    </div>
                    <div>
                      <span className="text-text-muted">Доход: </span>
                      <span className="font-medium text-accent">{acc.total_income}₽</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Pending/rejected listings */}
            {listings.filter(l => l.status !== 'approved').map(l => {
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
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}
