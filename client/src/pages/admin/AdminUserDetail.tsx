import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { adminGetUser, adminUpdateUserLevel, adminGetUserOrders, adminCreateOrder, adminExtendOrder, adminReduceOrder, adminCompleteOrder, adminGetAccounts, adminGetGames } from '../../api/admin'
import type { BotUser } from '../../api/admin'
import type { Order, Account, Game } from '../../types'
import Header from '../../components/Header'
import { formatTime } from '../../utils/activity'

const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

export default function AdminUserDetail() {
  const { userId: adminId } = useAuth()
  const { userId } = useParams<{ userId: string }>()
  const [user, setUser] = useState<BotUser | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')
  const [showAddRental, setShowAddRental] = useState(false)

  const load = useCallback(() => {
    if (!userId) return
    Promise.all([adminGetUser(adminId, userId), adminGetUserOrders(adminId, userId)])
      .then(([u, o]) => { setUser(u); setOrders(o) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [adminId, userId])

  useEffect(() => { load() }, [load])

  const notify = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const handleLevelChange = async (level: number) => {
    if (!userId) return
    try {
      const updated = await adminUpdateUserLevel(adminId, userId, level)
      setUser(updated)
      notify('✅ Уровень обновлён')
    } catch { notify('❌ Ошибка') }
  }

  const handleExtend = async (orderId: number, hours: number) => {
    try { await adminExtendOrder(adminId, orderId, hours); load(); notify(`✅ +${hours}ч`) } catch { notify('❌ Ошибка') }
  }

  const handleReduce = async (orderId: number, hours: number) => {
    try { await adminReduceOrder(adminId, orderId, hours); load(); notify(`✅ -${hours}ч`) } catch { notify('❌ Ошибка') }
  }

  const handleComplete = async (orderId: number) => {
    if (!confirm('Завершить аренду?')) return
    try { await adminCompleteOrder(adminId, orderId); load(); notify('✅ Аренда завершена') } catch { notify('❌ Ошибка') }
  }

  if (loading) return <div className="flex-1 nav-spacer max-w-lg mx-auto w-full"><Header title="Загрузка..." showBack /><div className="p-4 space-y-3"><div className="h-24 skeleton rounded-xl" /><div className="h-32 skeleton rounded-xl" /></div></div>
  if (!user) return <div className="flex-1 nav-spacer max-w-lg mx-auto w-full"><Header title="Ошибка" showBack /><p className="p-4 text-center text-text-muted">Пользователь не найден</p></div>

  const activeOrder = orders.find(o => o.status === 'active')

  return (
    <div className="flex-1 nav-spacer max-w-lg mx-auto w-full">
      <Header title="Пользователь" showBack />
      <div className="p-4 space-y-4">
        {toast && <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-surface-2 border border-white/10 text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg animate-slide-up">{toast}</div>}

        {/* User Card */}
        <div className="rounded-xl bg-surface-2 border border-white/5 p-4 animate-fade-in">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-accent/15 flex items-center justify-center text-accent font-bold text-lg">
              {user.first_name[0] || '?'}
            </div>
            <div>
              <p className="font-bold">{user.first_name} {user.last_name}</p>
              <p className="text-xs text-text-muted">@{user.username || '—'} · ID: {user.id}</p>
            </div>
          </div>

          {/* Status badges */}
          <div className="flex flex-wrap gap-2 mb-3">
            <StatusBadge active={user.opened_miniapp} label="Открыл App" />
            <StatusBadge active={user.accepted_terms} label="Принял согл." />
            <StatusBadge active={user.browsed_menu} label="Листал меню" />
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div><p className="text-lg font-bold">{user.start_count}</p><p className="text-[10px] text-text-muted">/start</p></div>
            <div><p className="text-lg font-bold">{formatTime(user.time_in_app_seconds)}</p><p className="text-[10px] text-text-muted">В app</p></div>
            <div><p className="text-lg font-bold">{orders.length}</p><p className="text-[10px] text-text-muted">Аренд</p></div>
          </div>

          <p className="text-[10px] text-text-muted mt-2">Зарегистрирован: {new Date(user.registered_at).toLocaleString('ru-RU')}</p>
          <p className="text-[10px] text-text-muted">Последний визит: {new Date(user.last_seen).toLocaleString('ru-RU')}</p>
        </div>

        {/* Level */}
        <div className="rounded-xl bg-surface-2 border border-white/5 p-4 animate-fade-in">
          <p className="text-xs text-text-muted mb-2">Уровень</p>
          <div className="flex flex-wrap gap-2">
            {LEVELS.map(l => (
              <button
                key={l}
                onClick={() => handleLevelChange(l)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${user.level === l ? 'bg-accent text-white' : 'bg-surface-3 text-text-secondary active:bg-surface'}`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Active Rental */}
        <div className="rounded-xl bg-surface-2 border border-white/5 p-4 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold">Аренда</p>
            <button onClick={() => setShowAddRental(true)} className="text-xs text-accent font-medium">+ Выдать</button>
          </div>
          {activeOrder ? (
            <div className="space-y-3">
              <div className="bg-surface-3 rounded-lg p-3">
                <p className="text-xs text-text-muted">{activeOrder.game_name}</p>
                <p className="text-sm font-semibold">{activeOrder.account_title}</p>
                <p className="text-xs text-accent mt-1">До: {new Date(activeOrder.expires_at).toLocaleString('ru-RU')}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleExtend(activeOrder.id, 1)} className="flex-1 py-2 rounded-lg bg-surface-3 text-xs font-medium text-text-secondary active:bg-surface">+1ч</button>
                <button onClick={() => handleExtend(activeOrder.id, 3)} className="flex-1 py-2 rounded-lg bg-surface-3 text-xs font-medium text-text-secondary active:bg-surface">+3ч</button>
                <button onClick={() => handleReduce(activeOrder.id, 1)} className="flex-1 py-2 rounded-lg bg-surface-3 text-xs font-medium text-text-secondary active:bg-surface">-1ч</button>
                <button onClick={() => handleComplete(activeOrder.id)} className="flex-1 py-2 rounded-lg bg-danger/10 text-xs font-medium text-danger active:bg-danger/20">Завершить</button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-text-muted">Нет активной аренды</p>
          )}
        </div>
      </div>

      {showAddRental && userId && (
        <AddRentalModal
          adminId={adminId}
          targetUserId={userId}
          onClose={() => setShowAddRental(false)}
          onDone={() => { setShowAddRental(false); load(); notify('✅ Аренда выдана') }}
        />
      )}
    </div>
  )
}

function StatusBadge({ active, label }: { active: boolean; label: string }) {
  return (
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${active ? 'text-success bg-success/10' : 'text-text-muted bg-surface-3'}`}>
      {active ? '🟢' : '⚪'} {label}
    </span>
  )
}

function AddRentalModal({ adminId, targetUserId, onClose, onDone }: { adminId: string; targetUserId: string; onClose: () => void; onDone: () => void }) {
  const [games, setGames] = useState<Game[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [selectedGame, setSelectedGame] = useState<number | null>(null)
  const [selectedAccount, setSelectedAccount] = useState<number | null>(null)
  const [hours, setHours] = useState(3)
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { adminGetGames(adminId).then(setGames) }, [adminId])
  useEffect(() => {
    if (selectedGame) adminGetAccounts(adminId).then(all => setAccounts(all.filter(a => a.game_id === selectedGame && a.status === 'available')))
  }, [adminId, selectedGame])

  const handleSubmit = async () => {
    if (!selectedAccount) return
    setSubmitting(true)
    try { await adminCreateOrder(adminId, { userId: targetUserId, accountId: selectedAccount, hours }); onDone() }
    catch { alert('Ошибка') }
    finally { setSubmitting(false) }
  }

  const game = games.find(g => g.id === selectedGame)
  const account = accounts.find(a => a.id === selectedAccount)

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg bg-surface rounded-t-2xl p-5 animate-slide-up max-h-[80vh] overflow-y-auto" style={{ paddingBottom: 'max(24px, calc(env(safe-area-inset-bottom, 0px) + 16px))' }} onClick={e => e.stopPropagation()}>
        <div className="w-9 h-1 bg-surface-3 rounded-full mx-auto mb-4" />
        <h3 className="text-lg font-bold mb-4">Выдать аренду</h3>

        {step === 1 && (
          <div className="space-y-2">
            <p className="text-xs text-text-muted mb-2">Выберите игру</p>
            {games.map(g => (
              <button key={g.id} onClick={() => { setSelectedGame(g.id); setStep(2) }} className="w-full p-3 rounded-xl bg-surface-2 border border-white/5 text-left text-sm font-medium active:bg-surface-3">{g.name}</button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-2">
            <button onClick={() => setStep(1)} className="text-xs text-accent mb-2">← Назад</button>
            <p className="text-xs text-text-muted mb-2">Выберите аккаунт</p>
            {accounts.length === 0 ? <p className="text-sm text-text-muted">Нет свободных аккаунтов</p> : accounts.map(a => (
              <button key={a.id} onClick={() => { setSelectedAccount(a.id); setStep(3) }} className="w-full p-3 rounded-xl bg-surface-2 border border-white/5 text-left active:bg-surface-3">
                <p className="text-sm font-medium">{a.title}</p>
                <p className="text-xs text-text-muted">{a.price_per_day}₽/день</p>
              </button>
            ))}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <button onClick={() => setStep(2)} className="text-xs text-accent mb-2">← Назад</button>
            <div>
              <p className="text-xs text-text-muted mb-2">Продолжительность (часы)</p>
              <div className="flex items-center gap-3 justify-center">
                <button onClick={() => setHours(Math.max(1, hours - 1))} className="w-10 h-10 rounded-lg bg-surface-2 border border-white/5 text-lg font-bold active:bg-surface-3">-</button>
                <span className="text-2xl font-bold w-16 text-center">{hours}</span>
                <button onClick={() => setHours(hours + 1)} className="w-10 h-10 rounded-lg bg-surface-2 border border-white/5 text-lg font-bold active:bg-surface-3">+</button>
              </div>
            </div>
            <div className="rounded-xl bg-surface-2 border border-white/5 p-4 space-y-2 text-sm">
              <p><span className="text-text-muted">Игра:</span> <span className="font-medium">{game?.name}</span></p>
              <p><span className="text-text-muted">Аккаунт:</span> <span className="font-medium">{account?.title}</span></p>
              <p><span className="text-text-muted">Срок:</span> <span className="font-medium">{hours}ч</span></p>
            </div>
            <button onClick={handleSubmit} disabled={submitting} className="w-full py-3.5 rounded-xl bg-accent text-white font-semibold text-sm active:opacity-80 shadow-lg shadow-accent/25 disabled:opacity-50">
              {submitting ? 'Выдача...' : '✅ Выдать аренду'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
