import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { adminGetAccounts, adminGetGames, adminCreateAccount, adminUpdateAccount, adminDeleteAccount } from '../../api/admin'
import type { Account, Game } from '../../types'
import Header from '../../components/Header'

export default function AdminAccounts() {
  const { userId } = useAuth()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [filterGame, setFilterGame] = useState<number | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [showForm, setShowForm] = useState(false)
  const [editAccount, setEditAccount] = useState<Account | null>(null)
  const [toast, setToast] = useState('')

  const load = () => {
    Promise.all([adminGetAccounts(userId), adminGetGames(userId)])
      .then(([a, g]) => { setAccounts(a); setGames(g) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [userId])
  const notify = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const filtered = accounts.filter(a => {
    if (filterGame && a.game_id !== filterGame) return false
    if (filterStatus && a.status !== filterStatus) return false
    return true
  })

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить аккаунт? Это действие нельзя отменить.')) return
    try {
      await adminDeleteAccount(userId, id)
      load()
      notify('✅ Аккаунт удалён')
    } catch (e: any) {
      alert(e.message || 'Ошибка удаления')
    }
  }

  return (
    <div className="flex-1 nav-spacer max-w-lg mx-auto w-full">
      <Header title="Аккаунты" showBack />
      <div className="p-4 space-y-3">
        {toast && <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-surface-2 border border-white/10 text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg animate-slide-up">{toast}</div>}

        {/* Filters */}
        <div className="flex gap-2">
          <select
            value={filterGame || ''}
            onChange={e => setFilterGame(e.target.value ? Number(e.target.value) : null)}
            className="flex-1 px-3 py-2 rounded-xl bg-surface-2 border border-white/5 text-sm text-text-primary focus:outline-none"
          >
            <option value="">Все игры</option>
            {games.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl bg-surface-2 border border-white/5 text-sm text-text-primary focus:outline-none"
          >
            <option value="">Все статусы</option>
            <option value="available">🟢 Свободен</option>
            <option value="rented">🔴 В аренде</option>
          </select>
        </div>

        {/* Add button */}
        <button
          onClick={() => { setEditAccount(null); setShowForm(true) }}
          className="w-full py-3 rounded-xl bg-accent text-white text-sm font-semibold active:opacity-80 transition-opacity"
        >
          ➕ Добавить аккаунт
        </button>

        {loading ? (
          <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-20 skeleton rounded-xl" />)}</div>
        ) : (
          filtered.map(acc => {
            const game = games.find(g => g.id === acc.game_id)
            return (
              <div key={acc.id} className="rounded-xl bg-surface-2 border border-white/5 p-3">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-xs text-text-muted">{game?.name || '—'}</p>
                    <p className="text-sm font-semibold">{acc.title}</p>
                    <p className="text-xs text-text-muted">{acc.rank} · {acc.price_per_day}₽/день</p>
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${acc.status === 'available' ? 'text-success bg-success/10' : acc.status === 'password_update_needed' ? 'text-warning bg-warning/10' : 'text-danger bg-danger/10'}`}>
                    {acc.status === 'available' ? '🟢 Свободен' : acc.status === 'password_update_needed' ? '🔐 Смена пароля' : '🔴 В аренде'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditAccount(acc); setShowForm(true) }} className="flex-1 py-2 rounded-lg bg-surface-3 text-xs font-medium text-text-secondary active:bg-surface">✏️ Редактировать</button>
                  <button onClick={() => handleDelete(acc.id)} className="px-4 py-2 rounded-lg bg-danger/10 text-xs font-medium text-danger active:bg-danger/20">🗑</button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {showForm && (
        <AccountForm
          games={games}
          account={editAccount}
          adminId={userId}
          onClose={() => setShowForm(false)}
          onDone={() => { setShowForm(false); load(); notify(editAccount ? '✅ Сохранено' : '✅ Аккаунт добавлен') }}
        />
      )}
    </div>
  )
}

function AccountForm({ games, account, adminId, onClose, onDone }: { games: Game[]; account: Account | null; adminId: string; onClose: () => void; onDone: () => void }) {
  const [gameId, setGameId] = useState(account?.game_id || games[0]?.id || 1)
  const [title, setTitle] = useState(account?.title || '')
  const [description, setDescription] = useState(account?.description || '')
  const [rank, setRank] = useState(account?.rank || '')
  const [price, setPrice] = useState(String(account?.price_per_day || ''))
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!title || !price) return alert('Заполните обязательные поля')
    setSubmitting(true)
    try {
      if (account) {
        await adminUpdateAccount(adminId, account.id, { game_id: gameId, title, description, rank, price_per_day: Number(price) })
      } else {
        await adminCreateAccount(adminId, { game_id: gameId, title, description, rank, price_per_day: Number(price), status: 'available' })
      }
      onDone()
    } catch { alert('Ошибка') }
    finally { setSubmitting(false) }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg bg-surface rounded-t-2xl p-5 animate-slide-up max-h-[85vh] overflow-y-auto" style={{ paddingBottom: 'max(24px, calc(env(safe-area-inset-bottom, 0px) + 16px))' }} onClick={e => e.stopPropagation()}>
        <div className="w-9 h-1 bg-surface-3 rounded-full mx-auto mb-4" />
        <h3 className="text-lg font-bold mb-4">{account ? 'Редактировать' : 'Добавить аккаунт'}</h3>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-text-muted block mb-1">Игра</label>
            <select value={gameId} onChange={e => setGameId(Number(e.target.value))} className="w-full px-3 py-2.5 rounded-xl bg-surface-2 border border-white/5 text-sm focus:outline-none">
              {games.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-text-muted block mb-1">Название</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-surface-2 border border-white/5 text-sm focus:outline-none" placeholder="Prime Account #421" />
          </div>
          <div>
            <label className="text-xs text-text-muted block mb-1">Ранг</label>
            <input value={rank} onChange={e => setRank(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-surface-2 border border-white/5 text-sm focus:outline-none" placeholder="Diamond 2" />
          </div>
          <div>
            <label className="text-xs text-text-muted block mb-1">Описание</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full px-3 py-2.5 rounded-xl bg-surface-2 border border-white/5 text-sm focus:outline-none resize-none" placeholder="Описание аккаунта..." />
          </div>
          <div>
            <label className="text-xs text-text-muted block mb-1">Цена за день (₽)</label>
            <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-surface-2 border border-white/5 text-sm focus:outline-none" placeholder="150" />
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-3.5 rounded-xl bg-accent text-white font-semibold text-sm active:opacity-80 transition-opacity shadow-lg shadow-accent/25 disabled:opacity-50"
          >
            {submitting ? 'Сохранение...' : account ? '✅ Сохранить' : '✅ Добавить аккаунт'}
          </button>
        </div>
      </div>
    </div>
  )
}
