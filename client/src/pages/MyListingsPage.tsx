import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { getMyListings } from '../api/admin'
import { fetchMyAccounts, updateAccountPassword } from '../api/server'
import type { ListingApplication } from '../types'
import Header from '../components/Header'

const STATUS_MAP: Record<string, { label: string; color: string; icon: string }> = {
  pending: { label: 'На модерации', color: 'text-warning bg-warning/10', icon: '🟡' },
  approved: { label: 'Одобрен', color: 'text-success bg-success/10', icon: '🟢' },
  rejected: { label: 'Отклонён', color: 'text-danger bg-danger/10', icon: '🔴' },
  suspended: { label: 'Приостановлен', color: 'text-text-muted bg-surface-3', icon: '⚫' },
}

const GAME_PASSWORD_LINKS: Record<number, { url: string; instruction: string }> = {
  1: { url: 'https://account.riotgames.com/', instruction: 'Войдите → Настройки → Пароль → Изменить' },
  2: { url: 'https://www.epicgames.com/account/password', instruction: 'Войдите → Изменить пароль' },
  3: { url: 'https://store.steampowered.com/account/', instruction: 'Войдите → Управление аккаунтом → Изменить пароль' },
}

interface AccountInfo {
  listing_id: number
  game_id?: number
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
  const [toast, setToast] = useState('')
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([getMyListings(userId), fetchMyAccounts(userId)])
      .then(([l, a]) => { setListings(l); setAccounts(a) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [userId])

  const notify = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const handlePasswordUpdate = async (accountId: number) => {
    if (!newPassword || newPassword.length < 4) return notify('❌ Пароль слишком короткий')
    try {
      await updateAccountPassword(accountId, userId, newPassword)
      notify('✅ Пароль обновлён, аккаунт снова доступен')
      setUpdatingId(null)
      setNewPassword('')
      load()
    } catch {
      notify('❌ Ошибка обновления пароля')
    }
  }

  const totalIncome = accounts.reduce((sum, a) => sum + a.total_income, 0)
  const activeRentals = accounts.filter(a => a.is_rented).length
  const needsPassword = accounts.filter(a => a.account_status === 'password_update_needed')

  return (
    <div className="flex-1 max-w-lg mx-auto w-full">
      <Header title="Мои аккаунты" showBack />
      <div className="p-4 space-y-4">
        {toast && <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-surface-2 border border-white/10 text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg animate-slide-up">{toast}</div>}

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

        {/* Password update needed */}
        {needsPassword.length > 0 && (
          <div className="space-y-3 animate-fade-in">
            <h3 className="text-sm font-semibold text-warning">⚠️ Требуется смена пароля</h3>
            {needsPassword.map(acc => {
              const gameLink = GAME_PASSWORD_LINKS[acc.game_id || 0]
              const isUpdating = updatingId === acc.account_id

              return (
                <div key={acc.listing_id} className="rounded-xl bg-warning/5 border border-warning/20 overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-xs text-text-muted">{acc.game_name}</p>
                        <p className="text-sm font-semibold">{acc.title}</p>
                      </div>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full text-warning bg-warning/10">
                        🔐 Смените пароль
                      </span>
                    </div>

                    <p className="text-xs text-text-secondary mb-3">
                      Аренда завершена. Предыдущий арендатор может иметь доступ. Смените пароль чтобы снова сдавать аккаунт.
                    </p>

                    {/* Password change link */}
                    {gameLink && (
                      <a
                        href={gameLink.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 w-full p-3 rounded-lg bg-surface-2 border border-white/5 mb-3 active:bg-surface-3 transition-colors"
                      >
                        <span className="text-lg">🔗</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">Сменить пароль</p>
                          <p className="text-[10px] text-text-muted truncate">{gameLink.instruction}</p>
                        </div>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted shrink-0">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </a>
                    )}

                    {/* Password update form */}
                    {isUpdating ? (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            placeholder="Новый пароль"
                            className="flex-1 px-3 py-2.5 rounded-xl bg-surface-2 border border-white/5 text-sm focus:outline-none focus:border-accent/30"
                          />
                          <button onClick={() => setShowPassword(v => !v)} className="px-3 rounded-xl bg-surface-2 border border-white/5 text-text-secondary">
                            {showPassword ? '🙈' : '👁'}
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => { setUpdatingId(null); setNewPassword('') }} className="flex-1 py-2.5 rounded-xl bg-surface-2 border border-white/5 text-sm text-text-secondary active:bg-surface-3">
                            Отмена
                          </button>
                          <button onClick={() => handlePasswordUpdate(acc.account_id!)} className="flex-1 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold active:opacity-80">
                            ✅ Обновить
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setUpdatingId(acc.account_id)}
                        className="w-full py-2.5 rounded-xl bg-accent text-white text-sm font-semibold active:opacity-80 shadow-lg shadow-accent/25"
                      >
                        🔐 Я сменил пароль — обновить
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
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
            {/* Active accounts */}
            {accounts.filter(a => a.account_status !== 'password_update_needed').map(acc => (
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

                  {acc.is_rented && acc.current_order && (
                    <div className="bg-surface-3 rounded-lg p-3 mb-2">
                      <p className="text-xs text-text-muted">Арендатор</p>
                      <p className="text-sm font-medium">@{acc.current_order.username || '—'}</p>
                      <p className="text-xs text-text-muted mt-1">До: {new Date(acc.current_order.expires_at).toLocaleString('ru-RU')}</p>
                    </div>
                  )}

                  <div className="flex gap-4 text-xs">
                    <div><span className="text-text-muted">Аренд: </span><span className="font-medium">{acc.total_rentals}</span></div>
                    <div><span className="text-text-muted">Доход: </span><span className="font-medium text-accent">{acc.total_income}₽</span></div>
                  </div>
                </div>
              </div>
            ))}

            {/* Pending/rejected */}
            {listings.filter(l => l.status !== 'approved').map(l => {
              const st = STATUS_MAP[l.status]
              return (
                <div key={l.id} className="rounded-xl bg-surface-2 border border-white/5 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-xs text-text-muted">{l.game_name}</p>
                      <p className="text-sm font-semibold">{l.title}</p>
                    </div>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${st.color}`}>{st.icon} {st.label}</span>
                  </div>
                  {l.status === 'rejected' && l.rejection_reason && <p className="text-xs text-danger mt-1">Причина: {l.rejection_reason}</p>}
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}
