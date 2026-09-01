import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { fetchMyAccounts, updateAccountPassword } from '../api/server'
import { fetchUser } from '../api'
import type { UserProfile } from '../types'
import Header from '../components/Header'

const GAME_LINKS: Record<number, { url: string; instruction: string }> = {
  1: { url: 'https://account.riotgames.com/', instruction: 'Riot Account → Настройки → Пароль' },
  2: { url: 'https://www.epicgames.com/account/password', instruction: 'Epic Games → Изменить пароль' },
  3: { url: 'https://store.steampowered.com/account/', instruction: 'Steam → Управление аккаунтом' },
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  available: { label: 'Доступен', color: 'text-success', bg: 'bg-success/10' },
  rented: { label: 'В аренде', color: 'text-danger', bg: 'bg-danger/10' },
  pending_moderation: { label: 'На модерации', color: 'text-warning', bg: 'bg-warning/10' },
  waiting_password_change: { label: 'Смените пароль', color: 'text-warning', bg: 'bg-warning/10' },
  rejected: { label: 'Отклонён', color: 'text-danger', bg: 'bg-danger/10' },
  suspended: { label: 'Приостановлен', color: 'text-text-muted', bg: 'bg-surface-3' },
}

export default function SellerPage() {
  const { userId } = useAuth()
  const navigate = useNavigate()
  const [accounts, setAccounts] = useState<any[]>([])
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => {
    Promise.all([fetchMyAccounts(), fetchUser()])
      .then(([a, u]) => { setAccounts(a); setUser(u) })
      .finally(() => setLoading(false))
  }, [])

  const notify = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const handlePasswordUpdate = async (id: number) => {
    if (!newPassword || newPassword.length < 4) return notify('Пароль слишком короткий')
    try {
      await updateAccountPassword(id, newPassword)
      notify('Пароль обновлён')
      setUpdatingId(null)
      setNewPassword('')
      fetchMyAccounts().then(setAccounts)
    } catch { notify('Ошибка обновления') }
  }

  const totalIncome = accounts.reduce((s, a) => s + (a.total_income || 0), 0)
  const activeRentals = accounts.filter(a => a.is_rented).length
  const totalAccounts = accounts.length
  const totalRentals = accounts.reduce((s, a) => s + (a.total_rentals || 0), 0)
  const needsPassword = accounts.filter(a => a.status === 'waiting_password_change')
  const activeAccounts = accounts.filter(a => a.status === 'available' || a.status === 'rented')
  const pendingAccounts = accounts.filter(a => a.status === 'pending_moderation' || a.status === 'rejected')

  if (loading) {
    return (
      <div className="flex-1 nav-spacer max-w-lg mx-auto w-full">
        <Header title="Сдаю" />
        <div className="p-5 space-y-4">
          <div className="h-20 skeleton rounded-2xl" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-16 skeleton rounded-xl" />
            <div className="h-16 skeleton rounded-xl" />
          </div>
          <div className="h-24 skeleton rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 nav-spacer max-w-lg mx-auto w-full overflow-y-auto">
      <Header title="Сдаю" />

      <div className="p-5 space-y-5">
        {toast && (
          <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-surface-2 border border-white/10 text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg animate-slide-up">
            {toast}
          </div>
        )}

        {totalAccounts === 0 ? (
          /* ══════════════════════════════════════════
             EMPTY STATE — Onboarding
             ══════════════════════════════════════════ */
          <div className="animate-fade-in space-y-5">
            {/* Hero */}
            <div className="text-center pt-4 pb-2">
              <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4 ring-1 ring-accent/15">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 12h8M12 8v8" />
                </svg>
              </div>
              <h2 className="text-lg font-bold mb-1.5">Есть аккаунт, которым не пользуетесь?</h2>
              <p className="text-[13px] text-text-secondary max-w-[260px] mx-auto">
                Он может приносить доход, пока вы заняты другими делами.
              </p>
            </div>

            {/* CTA */}
            <button
              onClick={() => navigate('/submit-account')}
              className="w-full py-3.5 btn-primary text-[13px]"
            >
              + Сдать аккаунт
            </button>

            {/* Social Proof */}
            <div className="card p-4 text-center glow-border animate-fade-in" style={{ animationDelay: '100ms' }}>
              <p className="text-[11px] text-text-muted mb-2">Уже заработано владельцами</p>
              <p className="text-2xl font-bold text-accent mb-1.5">128 430 ₽</p>
              <p className="text-[11px] text-text-muted">347 аккаунтов · 1 284 аренды</p>
            </div>

            {/* Motivational */}
            <p className="text-center text-[13px] text-text-secondary">
              Ваш аккаунт тоже может приносить <span className="text-accent font-semibold">доход</span>.
            </p>

            {/* How it works */}
            <div className="card p-4 animate-fade-in" style={{ animationDelay: '150ms' }}>
              <p className="text-[11px] text-text-muted font-medium uppercase tracking-wider mb-3">Как это работает</p>
              <div className="flex items-center justify-between text-center">
                <div className="flex-1">
                  <p className="text-lg font-bold text-accent">79₽</p>
                  <p className="text-[10px] text-text-muted mt-0.5">цена / час</p>
                </div>
                <span className="text-text-muted/30 text-lg">×</span>
                <div className="flex-1">
                  <p className="text-lg font-bold text-text-primary">20ч</p>
                  <p className="text-[10px] text-text-muted mt-0.5">аренды</p>
                </div>
                <span className="text-text-muted/30 text-lg">=</span>
                <div className="flex-1">
                  <p className="text-lg font-bold text-success">1 580₽</p>
                  <p className="text-[10px] text-text-muted mt-0.5">доход</p>
                </div>
              </div>
              <p className="text-[10px] text-text-muted text-center mt-3">Пример расчёта. Фактический доход зависит от спроса.</p>
            </div>

            {/* Advantages */}
            <div className="space-y-2.5 animate-fade-in" style={{ animationDelay: '200ms' }}>
              {[
                'Вы сами устанавливаете цену',
                'Аккаунт проходит проверку модератором',
                'Получаете доход за каждую аренду',
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-success">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <p className="text-[13px] text-text-secondary">{text}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* ══════════════════════════════════════════
             DASHBOARD — Has accounts
             ══════════════════════════════════════════ */
          <>
            {/* Income Hero */}
            <div className="animate-fade-in">
              <p className="text-[11px] text-text-muted font-medium uppercase tracking-wider mb-1">Доход</p>
              <p className="text-3xl font-bold text-accent">{totalIncome}₽</p>
              {user && user.commissionPercent > 0 && (
                <p className="text-[11px] text-text-muted mt-1">Комиссия площадки: {user.commissionPercent}%</p>
              )}
            </div>

            {/* Level & Commission */}
            {user && (
              <div className="card p-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⭐</span>
                    <div>
                      <p className="text-[11px] text-text-muted">Уровень {user.level}</p>
                      <p className="text-[13px] font-bold">{user.levelName || 'Новичок'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-text-muted">Ваша комиссия</p>
                    <p className="text-lg font-bold text-warning">{user.commissionPercent}%</p>
                  </div>
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 animate-fade-in">
              <StatCard label="Аккаунтов" value={totalAccounts} />
              <StatCard label="Сдаются" value={activeRentals} color="text-success" />
              <StatCard label="Аренд" value={totalRentals} />
              <StatCard label="Заработано" value={`${totalIncome}₽`} color="text-accent" />
            </div>

            {/* CTA */}
            <button
              onClick={() => navigate('/submit-account')}
              className="w-full py-3 btn-primary text-[13px] animate-fade-in"
            >
              + Сдать аккаунт
            </button>

            {/* Password update needed */}
            {needsPassword.length > 0 && (
              <div className="space-y-3 animate-fade-in">
                <h3 className="text-[13px] font-semibold text-warning">Требуется смена пароля</h3>
                {needsPassword.map(acc => {
                  const gl = GAME_LINKS[acc.game_id]
                  return (
                    <div key={acc.id} className="card p-4 border-warning/20">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-[11px] text-text-muted">{acc.game_name}</p>
                          <p className="text-[13px] font-semibold">{acc.title}</p>
                        </div>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full text-warning bg-warning/10">
                          Смените пароль
                        </span>
                      </div>
                      <p className="text-[11px] text-text-secondary mb-3">Аренда завершена. Смените пароль чтобы снова сдавать.</p>
                      {gl && (
                        <a href={gl.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 w-full p-3 rounded-lg bg-surface-3 mb-3 active:bg-surface-2 transition-colors">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent shrink-0">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-medium">Сменить пароль</p>
                            <p className="text-[10px] text-text-muted">{gl.instruction}</p>
                          </div>
                        </a>
                      )}
                      {updatingId === acc.id ? (
                        <div className="space-y-2">
                          <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Новый пароль" className="w-full px-3 py-2.5 rounded-xl bg-surface-3 border border-white/[0.04] text-[13px] focus:outline-none" />
                          <div className="flex gap-2">
                            <button onClick={() => { setUpdatingId(null); setNewPassword('') }} className="flex-1 py-2.5 btn-secondary text-[12px]">Отмена</button>
                            <button onClick={() => handlePasswordUpdate(acc.id)} className="flex-1 py-2.5 btn-primary text-[12px]">Обновить</button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => setUpdatingId(acc.id)} className="w-full py-2.5 btn-primary text-[12px]">
                          Пароль изменён — обновить
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Active accounts */}
            {activeAccounts.length > 0 && (
              <div className="animate-fade-in">
                <h3 className="text-[13px] font-semibold text-text-secondary mb-3">Мои аккаунты</h3>
                <div className="space-y-2">
                  {activeAccounts.map(acc => {
                    const st = STATUS_MAP[acc.status] || STATUS_MAP.available
                    return (
                      <div key={acc.id} className="card p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] text-text-muted">{acc.game_name}</p>
                            <p className="text-[13px] font-semibold truncate">{acc.title}</p>
                            <p className="text-[11px] text-accent mt-0.5">{acc.price_per_hour}₽/час · {acc.rank}</p>
                          </div>
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${st.color} ${st.bg} shrink-0 ml-2`}>
                            {acc.is_rented ? 'В аренде' : 'Доступен'}
                          </span>
                        </div>
                        {acc.is_rented && acc.active_rental && (
                          <div className="bg-surface-3 rounded-lg p-3 mt-2">
                            <p className="text-[11px] text-text-muted">Арендатор: @{acc.active_rental.renter_username || '—'}</p>
                            <p className="text-[11px] text-text-muted">До: {new Date(acc.active_rental.expires_at).toLocaleString('ru-RU')}</p>
                            <p className="text-[11px] text-accent mt-1">Доход: {acc.active_rental.price}₽</p>
                          </div>
                        )}
                        <div className="flex gap-4 text-[11px] mt-2">
                          <span className="text-text-muted">Аренд: <span className="text-text-primary font-medium">{acc.total_rentals}</span></span>
                          <span className="text-text-muted">Доход: <span className="text-accent font-medium">{acc.total_income}₽</span></span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Pending */}
            {pendingAccounts.length > 0 && (
              <div className="animate-fade-in">
                <h3 className="text-[13px] font-semibold text-text-secondary mb-3">На модерации</h3>
                <div className="space-y-2">
                  {pendingAccounts.map(acc => {
                    const st = STATUS_MAP[acc.status] || STATUS_MAP.pending_moderation
                    return (
                      <div key={acc.id} className="card p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-[11px] text-text-muted">{acc.game_name}</p>
                            <p className="text-[13px] font-semibold">{acc.title}</p>
                          </div>
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${st.color} ${st.bg}`}>
                            {st.label}
                          </span>
                        </div>
                        {acc.status === 'rejected' && acc.rejection_reason && (
                          <p className="text-[11px] text-danger mt-2">Причина: {acc.rejection_reason}</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number | string; color?: string }) {
  return (
    <div className="card p-3">
      <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-xl font-bold ${color || ''}`}>{value}</p>
    </div>
  )
}
