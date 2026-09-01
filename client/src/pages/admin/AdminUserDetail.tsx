import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { adminGetUser, adminUpdateUserLevel, adminGetUserOrders, adminCreateOrder, adminCompleteOrder, adminGetAccounts, getGamesStore } from '../../api/admin'
import type { BotUser } from '../../api/admin'
import type { Rental, Account, Game } from '../../types'
import Header from '../../components/Header'

const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

export default function AdminUserDetail() {
  const { userId: adminId } = useAuth()
  const { userId } = useParams<{ userId: string }>()
  const [user, setUser] = useState<BotUser | null>(null)
  const [rentals, setRentals] = useState<Rental[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')
  const [showAddRental, setShowAddRental] = useState(false)
  const [tab, setTab] = useState<'active' | 'completed'>('active')

  const load = useCallback(() => {
    if (!userId) return
    Promise.all([adminGetUser(adminId, userId), adminGetUserOrders(adminId, userId)])
      .then(([u, r]) => { setUser(u); setRentals(r) })
      .finally(() => setLoading(false))
  }, [adminId, userId])

  useEffect(() => { load() }, [load])

  const notify = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const handleLevel = async (level: number) => {
    if (!userId) return
    try { const updated = await adminUpdateUserLevel(adminId, userId, level); setUser(updated); notify('✅ Уровень обновлён') } catch { notify('❌ Ошибка') }
  }

  const handleComplete = async (id: number) => {
    if (!confirm('Завершить аренду?')) return
    try { await adminCompleteOrder(id, 'admin_manual'); load(); notify('✅ Завершена') } catch { notify('❌ Ошибка') }
  }

  if (loading) return <div className="flex-1 nav-spacer max-w-lg mx-auto w-full"><Header title="Загрузка..." showBack /></div>
  if (!user) return <div className="flex-1 nav-spacer max-w-lg mx-auto w-full"><Header title="Ошибка" showBack /></div>

  const asRenter = rentals.filter(r => r.renter_id === userId)
  const asOwner = rentals.filter(r => r.owner_id === userId)
  const activeRentals = asRenter.filter(r => r.status === 'active')
  const completedRentals = asRenter.filter(r => r.status === 'completed')
  const totalSpent = asRenter.reduce((s, r) => s + r.price, 0)

  return (
    <div className="flex-1 nav-spacer max-w-lg mx-auto w-full">
      <Header title="Пользователь" showBack />
      <div className="p-4 space-y-4">
        {toast && <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-surface-2 border border-white/10 text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg animate-slide-up">{toast}</div>}

        {/* User Card */}
        <div className="rounded-xl bg-surface-2 border border-white/5 p-4 animate-fade-in">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-accent/15 flex items-center justify-center text-accent font-bold text-lg">{user.first_name[0] || '?'}</div>
            <div className="flex-1 min-w-0">
              <p className="font-bold truncate">{user.first_name} {user.last_name}</p>
              <p className="text-xs text-text-muted">@{user.username || '—'} · ID: {user.id}</p>
            </div>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${user.role === 'ADMIN' ? 'text-accent bg-accent/10' : 'text-text-muted bg-surface-3'}`}>
              {user.role === 'ADMIN' ? '👑 ADMIN' : 'USER'}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-surface-3 p-2"><p className="text-lg font-bold">{asRenter.length}</p><p className="text-[10px] text-text-muted">Аренд</p></div>
            <div className="rounded-lg bg-surface-3 p-2"><p className="text-lg font-bold text-accent">{totalSpent}₽</p><p className="text-[10px] text-text-muted">Потрачено</p></div>
            <div className="rounded-lg bg-surface-3 p-2"><p className="text-lg font-bold">{asOwner.length}</p><p className="text-[10px] text-text-muted">Сдаёт</p></div>
          </div>
          <p className="text-[10px] text-text-muted mt-2">Зарегистрирован: {new Date(user.created_at).toLocaleString('ru-RU')}</p>
        </div>

        {/* Level */}
        <div className="rounded-xl bg-surface-2 border border-white/5 p-4">
          <p className="text-xs text-text-muted mb-2">Уровень</p>
          <div className="flex flex-wrap gap-2">{LEVELS.map(l => <button key={l} onClick={() => handleLevel(l)} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${user.level === l ? 'bg-accent text-white' : 'bg-surface-3 text-text-secondary'}`}>{l}</button>)}</div>
        </div>

        {/* Rentals */}
        <div className="rounded-xl bg-surface-2 border border-white/5 overflow-hidden">
          <div className="flex border-b border-white/5">
            <button onClick={() => setTab('active')} className={`flex-1 py-3 text-xs font-medium ${tab === 'active' ? 'text-accent border-b-2 border-accent' : 'text-text-muted'}`}>Активные ({activeRentals.length})</button>
            <button onClick={() => setTab('completed')} className={`flex-1 py-3 text-xs font-medium ${tab === 'completed' ? 'text-accent border-b-2 border-accent' : 'text-text-muted'}`}>Завершённые ({completedRentals.length})</button>
          </div>
          <div className="p-4 space-y-2">
            <button onClick={() => setShowAddRental(true)} className="w-full py-2.5 rounded-lg bg-accent text-white text-xs font-semibold active:opacity-80 mb-3">+ Выдать аренду вручную</button>
            {tab === 'active' ? (
              activeRentals.length === 0 ? <p className="text-sm text-text-muted text-center py-4">Нет активных аренд</p> :
              activeRentals.map(r => (
                <div key={r.id} className="bg-surface-3 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div><p className="text-xs text-text-muted">{r.game_name}</p><p className="text-sm font-semibold">{r.account_title}</p></div>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full text-success bg-success/10">Активна</span>
                  </div>
                  <p className="text-xs text-accent mb-1">{r.hours}ч · {r.price}₽</p>
                  <p className="text-xs text-text-muted">До: {new Date(r.expires_at).toLocaleString('ru-RU')}</p>
                  <button onClick={() => handleComplete(r.id)} className="mt-2 w-full py-2 rounded-lg bg-danger/10 text-xs font-medium text-danger active:bg-danger/20">⛔ Завершить досрочно</button>
                </div>
              ))
            ) : (
              completedRentals.length === 0 ? <p className="text-sm text-text-muted text-center py-4">Нет завершённых аренд</p> :
              completedRentals.map(r => (
                <div key={r.id} className="bg-surface-3 rounded-lg p-3 opacity-60">
                  <p className="text-xs text-text-muted">{r.game_name}</p>
                  <p className="text-sm font-semibold">{r.account_title}</p>
                  <p className="text-xs text-text-muted mt-1">{r.hours}ч · {r.price}₽ · Завершена {r.ended_at ? new Date(r.ended_at).toLocaleString('ru-RU') : '—'}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showAddRental && userId && <AddRentalModal targetUserId={userId} onClose={() => setShowAddRental(false)} onDone={() => { setShowAddRental(false); load(); notify('✅ Аренда выдана') }} />}
    </div>
  )
}

function AddRentalModal({ targetUserId, onClose, onDone }: { targetUserId: string; onClose: () => void; onDone: () => void }) {
  const [games] = useState<Game[]>(getGamesStore())
  const [accounts, setAccounts] = useState<Account[]>([])
  const [selectedGame, setSelectedGame] = useState<number | null>(null)
  const [selectedAccount, setSelectedAccount] = useState<number | null>(null)
  const [hours, setHours] = useState(3)
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (selectedGame) adminGetAccounts().then(all => setAccounts(all.filter(a => a.game_id === selectedGame && a.status === 'available')))
  }, [selectedGame])

  const handleSubmit = async () => {
    if (!selectedAccount) return
    setSubmitting(true)
    try { await adminCreateOrder(targetUserId, selectedAccount, hours); onDone() } catch { alert('Ошибка') } finally { setSubmitting(false) }
  }

  const game = games.find(g => g.id === selectedGame)
  const account = accounts.find(a => a.id === selectedAccount)
  const total = account ? Math.ceil(account.price_per_hour * hours) : 0

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg bg-surface rounded-t-2xl p-5 animate-slide-up max-h-[80vh] overflow-y-auto" style={{ paddingBottom: 'max(24px, calc(env(safe-area-inset-bottom, 0px) + 16px))' }} onClick={e => e.stopPropagation()}>
        <div className="w-9 h-1 bg-surface-3 rounded-full mx-auto mb-4" />
        <h3 className="text-lg font-bold mb-4">Выдать аренду</h3>
        {step === 1 && <div className="space-y-2">{games.map(g => <button key={g.id} onClick={() => { setSelectedGame(g.id); setStep(2) }} className="w-full p-3 rounded-xl bg-surface-2 border border-white/5 text-left text-sm font-medium">{g.name}</button>)}</div>}
        {step === 2 && <div className="space-y-2"><button onClick={() => setStep(1)} className="text-xs text-accent mb-2">← Назад</button>{accounts.length === 0 ? <p className="text-sm text-text-muted">Нет свободных аккаунтов</p> : accounts.map(a => <button key={a.id} onClick={() => { setSelectedAccount(a.id); setStep(3) }} className="w-full p-3 rounded-xl bg-surface-2 border border-white/5 text-left"><p className="text-sm font-medium">{a.title}</p><p className="text-xs text-accent">{a.price_per_hour}₽/час</p></button>)}</div>}
        {step === 3 && (
          <div className="space-y-4">
            <button onClick={() => setStep(2)} className="text-xs text-accent mb-2">← Назад</button>
            <div>
              <p className="text-xs text-text-muted mb-2">Количество часов</p>
              <div className="flex items-center gap-3 justify-center">
                <button onClick={() => setHours(Math.max(1, hours - 1))} className="w-10 h-10 rounded-lg bg-surface-2 border border-white/5 text-lg font-bold">-</button>
                <span className="text-2xl font-bold w-16 text-center">{hours}</span>
                <button onClick={() => setHours(hours + 1)} className="w-10 h-10 rounded-lg bg-surface-2 border border-white/5 text-lg font-bold">+</button>
              </div>
            </div>
            <div className="rounded-xl bg-surface-2 border border-white/5 p-4 space-y-2 text-sm">
              <p><span className="text-text-muted">Игра:</span> <span className="font-medium">{game?.name}</span></p>
              <p><span className="text-text-muted">Аккаунт:</span> <span className="font-medium">{account?.title}</span></p>
              <p><span className="text-text-muted">Срок:</span> <span className="font-medium">{hours}ч</span></p>
              <div className="border-t border-white/5 my-2" />
              <p><span className="text-text-muted">Итого:</span> <span className="font-bold text-accent">{total}₽</span></p>
            </div>
            <button onClick={handleSubmit} disabled={submitting} className="w-full py-3.5 rounded-xl bg-accent text-white font-semibold text-sm disabled:opacity-50">{submitting ? 'Выдача...' : '✅ Выдать аренду'}</button>
          </div>
        )}
      </div>
    </div>
  )
}
