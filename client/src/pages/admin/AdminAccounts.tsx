import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { adminGetAccounts, getGamesStore } from '../../api/admin'
import { fetchModeration } from '../../api/server'
import type { Account, Game } from '../../types'
import Header from '../../components/Header'

export default function AdminAccounts() {
  const { userId } = useAuth()
  const [accounts, setAccounts] = useState<any[]>([])
  const [games] = useState<Game[]>(getGamesStore())
  const [loading, setLoading] = useState(true)
  const [filterGame, setFilterGame] = useState<number | null>(null)
  const [filterStatus, setFilterStatus] = useState('')

  useEffect(() => { fetchModeration().then(setAccounts).finally(() => setLoading(false)) }, [])

  const filtered = accounts.filter(a => {
    if (filterGame && a.game_id !== filterGame) return false
    if (filterStatus && a.status !== filterStatus) return false
    return true
  })

  return (
    <div className="flex-1 nav-spacer max-w-lg mx-auto w-full">
      <Header title="Аккаунты" showBack />
      <div className="p-4 space-y-3">
        <div className="flex gap-2">
          <select value={filterGame || ''} onChange={e => setFilterGame(e.target.value ? Number(e.target.value) : null)} className="flex-1 px-3 py-2 rounded-xl bg-surface-2 border border-white/5 text-sm focus:outline-none">
            <option value="">Все игры</option>
            {games.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="flex-1 px-3 py-2 rounded-xl bg-surface-2 border border-white/5 text-sm focus:outline-none">
            <option value="">Все статусы</option>
            <option value="available">🟢 Свободен</option>
            <option value="rented">🔴 В аренде</option>
            <option value="pending_moderation">🟡 На модерации</option>
            <option value="waiting_password_change">⚠️ Смена пароля</option>
          </select>
        </div>
        {loading ? <>{[1,2,3].map(i => <div key={i} className="h-20 skeleton rounded-xl" />)}</> : filtered.map(acc => {
          const game = games.find(g => g.id === acc.game_id)
          return (
            <div key={acc.id} className="rounded-xl bg-surface-2 border border-white/5 p-3">
              <div className="flex items-start justify-between mb-2">
                <div><p className="text-xs text-text-muted">{game?.name || '—'}</p><p className="text-sm font-semibold">{acc.title}</p><p className="text-xs text-text-muted">{acc.rank} · {acc.price_per_hour}₽/час</p></div>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${acc.status === 'available' ? 'text-success bg-success/10' : acc.status === 'rented' ? 'text-danger bg-danger/10' : acc.status === 'waiting_password_change' ? 'text-warning bg-warning/10' : 'text-text-muted bg-surface-3'}`}>
                  {acc.status === 'available' ? '🟢 Свободен' : acc.status === 'rented' ? '🔴 В аренде' : acc.status === 'waiting_password_change' ? '⚠️ Смена пароля' : '🟡 На модерации'}
                </span>
              </div>
              <p className="text-[10px] text-text-muted">Владелец: {acc.owner_id}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
