import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { adminGetGames, adminCreateGame, adminUpdateGame, adminGetAccounts } from '../../api/admin'
import type { Game, Account } from '../../types'
import Header from '../../components/Header'

export default function AdminGames() {
  const { userId } = useAuth()
  const [games, setGames] = useState<Game[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editGame, setEditGame] = useState<Game | null>(null)
  const [toast, setToast] = useState('')

  const load = () => {
    Promise.all([adminGetGames(userId), adminGetAccounts(userId)])
      .then(([g, a]) => { setGames(g); setAccounts(a) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [userId])
  const notify = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  return (
    <div className="flex-1 nav-spacer max-w-lg mx-auto w-full">
      <Header title="Игры" showBack />
      <div className="p-4 space-y-3">
        {toast && <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-surface-2 border border-white/10 text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg animate-slide-up">{toast}</div>}

        <button
          onClick={() => { setEditGame(null); setShowForm(true) }}
          className="w-full py-3 rounded-xl bg-accent text-white text-sm font-semibold active:opacity-80 transition-opacity"
        >
          ➕ Добавить игру
        </button>

        {loading ? (
          <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-20 skeleton rounded-xl" />)}</div>
        ) : (
          games.map(game => {
            const gameAccounts = accounts.filter(a => a.game_id === game.id)
            const available = gameAccounts.filter(a => a.status === 'available').length
            const rented = gameAccounts.filter(a => a.status === 'rented').length

            return (
              <div key={game.id} className="rounded-xl bg-surface-2 border border-white/5 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl" style={{ background: `${game.color}20` }}>
                    {game.slug === 'valorant' ? '🎯' : game.slug === 'fortnite' ? '🪂' : '💥'}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{game.name}</p>
                    <p className="text-xs text-text-muted">{gameAccounts.length} акк. · {available} своб. · {rented} в аренде</p>
                  </div>
                </div>
                <button
                  onClick={() => { setEditGame(game); setShowForm(true) }}
                  className="w-full py-2 rounded-lg bg-surface-3 text-xs font-medium text-text-secondary active:bg-surface"
                >
                  ✏️ Редактировать
                </button>
              </div>
            )
          })
        )}
      </div>

      {showForm && (
        <GameForm
          game={editGame}
          adminId={userId}
          onClose={() => setShowForm(false)}
          onDone={() => { setShowForm(false); load(); notify(editGame ? '✅ Сохранено' : '✅ Игра добавлена') }}
        />
      )}
    </div>
  )
}

function GameForm({ game, adminId, onClose, onDone }: { game: Game | null; adminId: string; onClose: () => void; onDone: () => void }) {
  const [name, setName] = useState(game?.name || '')
  const [slug, setSlug] = useState(game?.slug || '')
  const [color, setColor] = useState(game?.color || '#6c5ce7')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!name || !slug) return alert('Заполните обязательные поля')
    setSubmitting(true)
    try {
      if (game) {
        await adminUpdateGame(adminId, game.id, { name, slug, color })
      } else {
        await adminCreateGame(adminId, { name, slug, color, image_url: '', accounts_count: 0 })
      }
      onDone()
    } catch { alert('Ошибка') }
    finally { setSubmitting(false) }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg bg-surface rounded-t-2xl p-5 animate-slide-up" style={{ paddingBottom: 'max(24px, calc(env(safe-area-inset-bottom, 0px) + 16px))' }} onClick={e => e.stopPropagation()}>
        <div className="w-9 h-1 bg-surface-3 rounded-full mx-auto mb-4" />
        <h3 className="text-lg font-bold mb-4">{game ? 'Редактировать' : 'Добавить игру'}</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-text-muted block mb-1">Название</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-surface-2 border border-white/5 text-sm focus:outline-none" />
          </div>
          <div>
            <label className="text-xs text-text-muted block mb-1">Slug</label>
            <input value={slug} onChange={e => setSlug(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-surface-2 border border-white/5 text-sm focus:outline-none" />
          </div>
          <div>
            <label className="text-xs text-text-muted block mb-1">Цвет</label>
            <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-full h-10 rounded-xl bg-surface-2 border border-white/5 cursor-pointer" />
          </div>
          <button onClick={handleSubmit} disabled={submitting} className="w-full py-3.5 rounded-xl bg-accent text-white font-semibold text-sm active:opacity-80 disabled:opacity-50">
            {submitting ? 'Сохранение...' : '✅ Сохранить'}
          </button>
        </div>
      </div>
    </div>
  )
}
