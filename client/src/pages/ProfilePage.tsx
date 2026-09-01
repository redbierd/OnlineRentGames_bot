import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchUser } from '../api'
import { useAuth } from '../hooks/useAuth'
import type { UserProfile } from '../types'
import Header from '../components/Header'

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const { isAdmin } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    fetchUser().then(setUser).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading || !user) {
    return (
      <div className="flex-1 nav-spacer max-w-lg mx-auto w-full">
        <Header title="Профиль" />
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full skeleton" />
            <div className="flex-1"><div className="h-4 w-32 skeleton mb-1" /><div className="h-3 w-20 skeleton" /></div>
          </div>
          <div className="h-24 skeleton rounded-2xl" />
          <div className="h-20 skeleton rounded-2xl" />
          <div className="h-32 skeleton rounded-2xl" />
        </div>
      </div>
    )
  }

  const progressPercent = user.nextXp > 0 ? Math.min(100, (user.currentXp / user.nextXp) * 100) : 100

  return (
    <div className="flex-1 nav-spacer max-w-lg mx-auto w-full overflow-y-auto">
      <Header title="Профиль" />
      <div className="p-5 space-y-4">
        {/* User Info */}
        <div className="flex items-center gap-3 animate-fade-in">
          <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-lg shrink-0 overflow-hidden ring-1 ring-accent/20">
            {user.photo_url ? (
              <img src={user.photo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              user.first_name[0]
            )}
          </div>
          <div>
            <p className="text-[15px] font-bold">{user.first_name}{user.last_name ? ` ${user.last_name}` : ''}</p>
            {user.username && <p className="text-[12px] text-text-secondary">@{user.username}</p>}
          </div>
        </div>

        {/* Balance & Cashback */}
        <div className="grid grid-cols-2 gap-3 animate-fade-in">
          <button onClick={() => navigate('/wallet')} className="card p-4 text-left active:scale-[0.98] transition-transform">
            <div className="flex items-center gap-2 mb-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-accent">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M2 10h20" />
              </svg>
              <span className="text-[11px] text-text-muted font-medium">Баланс</span>
            </div>
            <p className="text-xl font-bold">{user.balance}₽</p>
          </button>
          <button onClick={() => navigate('/wallet')} className="card p-4 text-left active:scale-[0.98] transition-transform">
            <div className="flex items-center gap-2 mb-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-success">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span className="text-[11px] text-text-muted font-medium">Кэшбэк</span>
            </div>
            <p className="text-xl font-bold text-success">{user.cashbackPoints}</p>
            <p className="text-[10px] text-text-muted">баллов</p>
          </button>
        </div>

        {/* Level Card */}
        <button
          onClick={() => navigate('/levels')}
          className="w-full text-left card-interactive p-4 animate-fade-in"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                <span className="text-sm">⭐</span>
              </div>
              <div>
                <p className="text-[11px] text-text-muted">Уровень {user.level}</p>
                <p className="text-[13px] font-bold">{user.levelName || 'Новичок'}</p>
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted/40">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>

          {/* Progress */}
          <div className="mb-2">
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-text-muted">{user.currentXp} / {user.nextXp} XP</span>
              <span className="text-accent">{user.nextXp - user.currentXp} XP до уровня {user.level + 1}</span>
            </div>
            <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Benefits */}
          <div className="flex gap-3 mt-3">
            <div className="flex-1 bg-surface-3 rounded-lg p-2 text-center">
              <p className="text-[10px] text-text-muted">Кэшбэк</p>
              <p className="text-[13px] font-bold text-success">{user.cashbackPercent}%</p>
            </div>
            <div className="flex-1 bg-surface-3 rounded-lg p-2 text-center">
              <p className="text-[10px] text-text-muted">Комиссия</p>
              <p className="text-[13px] font-bold text-warning">{user.commissionPercent}%</p>
            </div>
          </div>
        </button>

        {/* Quick Links */}
        <div className="space-y-2 animate-fade-in">
          <button onClick={() => navigate('/rentals')} className="w-full card-interactive p-4 flex items-center gap-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-text-secondary">
              <rect x="3" y="4" width="18" height="18" rx="3" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span className="text-[13px] font-medium flex-1">Мои аренды</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted/40"><polyline points="9 18 15 12 9 6" /></svg>
          </button>

          <button onClick={() => navigate('/seller')} className="w-full card-interactive p-4 flex items-center gap-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-text-secondary">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            <span className="text-[13px] font-medium flex-1">Мои аккаунты</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted/40"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>

        {/* Admin */}
        {isAdmin && (
          <button
            onClick={() => navigate('/admin')}
            className="w-full card-interactive p-4 flex items-center gap-3 animate-fade-in glow-border"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-accent">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <span className="text-[13px] font-medium flex-1">Админ-панель</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted/40"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        )}
      </div>
    </div>
  )
}
