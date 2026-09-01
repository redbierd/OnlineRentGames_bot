import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchMyAccounts, updateAccountPassword } from '../api/server'
import Header from '../components/Header'

const GAME_LINKS: Record<number, { url: string; instruction: string }> = {
  1: { url: 'https://account.riotgames.com/', instruction: 'Войдите → Настройки → Пароль → Изменить' },
  2: { url: 'https://www.epicgames.com/account/password', instruction: 'Войдите → Изменить пароль' },
  3: { url: 'https://store.steampowered.com/account/', instruction: 'Войдите → Управление аккаунтом → Изменить пароль' },
}

export default function MyListingsPage() {
  const navigate = useNavigate()
  const [accounts, setAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [newPassword, setNewPassword] = useState('')

  const load = () => { setLoading(true); fetchMyAccounts().then(setAccounts).finally(() => setLoading(false)) }
  useEffect(() => { load() }, [])

  const notify = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const handlePasswordUpdate = async (id: number) => {
    if (!newPassword || newPassword.length < 4) return notify('❌ Пароль слишком короткий')
    try { await updateAccountPassword(id, newPassword); notify('✅ Пароль обновлён!'); setUpdatingId(null); setNewPassword(''); load() }
    catch { notify('❌ Ошибка') }
  }

  const totalIncome = accounts.reduce((s, a) => s + (a.total_income || 0), 0)
  const needsPassword = accounts.filter(a => a.status === 'waiting_password_change')
  const active = accounts.filter(a => a.status === 'available' || a.status === 'rented')
  const pending = accounts.filter(a => a.status === 'pending_moderation' || a.status === 'rejected')

  return (
    <div className="flex-1 max-w-lg mx-auto w-full">
      <Header title="Мои аккаунты" showBack />
      <div className="p-4 space-y-4">
        {toast && <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-surface-2 border border-white/10 text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg animate-slide-up">{toast}</div>}

        {accounts.length > 0 && (
          <div className="grid grid-cols-3 gap-2 animate-fade-in">
            <div className="rounded-xl bg-surface-2 border border-white/5 p-3 text-center"><p className="text-lg font-bold">{accounts.length}</p><p className="text-[10px] text-text-muted">Аккаунтов</p></div>
            <div className="rounded-xl bg-surface-2 border border-white/5 p-3 text-center"><p className="text-lg font-bold text-success">{accounts.filter(a => a.is_rented).length}</p><p className="text-[10px] text-text-muted">В аренде</p></div>
            <div className="rounded-xl bg-surface-2 border border-white/5 p-3 text-center"><p className="text-lg font-bold text-accent">{totalIncome}₽</p><p className="text-[10px] text-text-muted">Доход</p></div>
          </div>
        )}

        {loading ? <>{[1,2].map(i => <div key={i} className="h-24 skeleton rounded-xl" />)}</> : accounts.length === 0 ? (
          <div className="text-center py-12"><div className="text-4xl mb-3">💼</div><p className="text-text-secondary text-sm">Вы пока не сдаёте аккаунты</p></div>
        ) : (
          <>
            {/* Needs password */}
            {needsPassword.map(acc => {
              const gl = GAME_LINKS[acc.game_id]
              return (
                <div key={acc.id} className="rounded-xl bg-warning/5 border border-warning/20 overflow-hidden animate-fade-in">
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div><p className="text-xs text-text-muted">{acc.game_name}</p><p className="text-sm font-semibold">{acc.title}</p></div>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full text-warning bg-warning/10">🔐 Смените пароль</span>
                    </div>
                    <p className="text-xs text-text-secondary mb-3">Аренда завершена. Смените пароль чтобы снова сдавать аккаунт.</p>
                    {gl && (
                      <a href={gl.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 w-full p-3 rounded-lg bg-surface-2 border border-white/5 mb-3 active:bg-surface-3">
                        <span className="text-lg">🔗</span>
                        <div className="flex-1"><p className="text-sm font-medium">Сменить пароль</p><p className="text-[10px] text-text-muted">{gl.instruction}</p></div>
                      </a>
                    )}
                    {updatingId === acc.id ? (
                      <div className="space-y-2">
                        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Новый пароль" className="w-full px-3 py-2.5 rounded-xl bg-surface-2 border border-white/5 text-sm focus:outline-none" />
                        <div className="flex gap-2">
                          <button onClick={() => { setUpdatingId(null); setNewPassword('') }} className="flex-1 py-2.5 rounded-xl bg-surface-2 border border-white/5 text-sm text-text-secondary">Отмена</button>
                          <button onClick={() => handlePasswordUpdate(acc.id)} className="flex-1 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold">✅ Обновить</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setUpdatingId(acc.id)} className="w-full py-2.5 rounded-xl bg-accent text-white text-sm font-semibold active:opacity-80">🔐 Я сменил пароль — обновить</button>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Active accounts */}
            {active.map(acc => (
              <div key={acc.id} className="rounded-xl bg-surface-2 border border-white/5 p-4 animate-fade-in">
                <div className="flex items-start justify-between mb-2">
                  <div><p className="text-xs text-text-muted">{acc.game_name}</p><p className="text-sm font-semibold">{acc.title}</p><p className="text-xs text-accent">{acc.price_per_hour}₽/час · {acc.rank}</p></div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${acc.is_rented ? 'text-danger bg-danger/10' : 'text-success bg-success/10'}`}>{acc.is_rented ? '🔴 Арендован' : '🟢 В каталоге'}</span>
                </div>
                {acc.is_rented && acc.active_rental && (
                  <div className="bg-surface-3 rounded-lg p-3 mb-2">
                    <p className="text-xs text-text-muted">Арендатор: @{acc.active_rental.renter_username || '—'}</p>
                    <p className="text-xs text-text-muted">До: {new Date(acc.active_rental.expires_at).toLocaleString('ru-RU')}</p>
                    <p className="text-xs text-accent mt-1">Доход: {acc.active_rental.price}₽</p>
                  </div>
                )}
                <div className="flex gap-4 text-xs"><span className="text-text-muted">Аренд: {acc.total_rentals}</span><span className="text-text-muted">Доход: <span className="text-accent">{acc.total_income}₽</span></span></div>
              </div>
            ))}

            {/* Pending/rejected */}
            {pending.map(acc => (
              <div key={acc.id} className="rounded-xl bg-surface-2 border border-white/5 p-4">
                <div className="flex items-start justify-between mb-2">
                  <div><p className="text-xs text-text-muted">{acc.game_name}</p><p className="text-sm font-semibold">{acc.title}</p></div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${acc.status === 'pending_moderation' ? 'text-warning bg-warning/10' : 'text-danger bg-danger/10'}`}>{acc.status === 'pending_moderation' ? '🟡 На модерации' : '🔴 Отклонён'}</span>
                </div>
                {acc.status === 'rejected' && acc.rejection_reason && <p className="text-xs text-danger mt-1">Причина: {acc.rejection_reason}</p>}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
