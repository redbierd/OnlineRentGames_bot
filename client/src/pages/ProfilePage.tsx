import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchUser } from '../api'
import { useAuth } from '../hooks/useAuth'
import type { UserProfile } from '../types'
import Header from '../components/Header'
import StatsCard from '../components/StatsCard'
import LevelCard from '../components/LevelCard'

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
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full skeleton" />
            <div className="flex-1"><div className="h-5 w-40 skeleton mb-1" /><div className="h-3 w-24 skeleton" /></div>
          </div>
          <div className="h-24 skeleton rounded-2xl" />
          <div className="h-40 skeleton rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 nav-spacer max-w-lg mx-auto w-full">
      <Header title="Профиль" />
      <div className="p-4 space-y-5">
        {/* User Info */}
        <div className="flex items-center gap-3 animate-fade-in">
          <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-xl shrink-0 overflow-hidden">
            {user.photo_url ? (
              <img src={user.photo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              user.first_name[0]
            )}
          </div>
          <div>
            <p className="text-lg font-bold">{user.first_name}{user.last_name ? ` ${user.last_name}` : ''}</p>
            {user.username && <p className="text-sm text-text-secondary">@{user.username}</p>}
          </div>
        </div>

        {/* Level */}
        <LevelCard user={user} />

        {/* Stats */}
        <StatsCard user={user} />

        {/* My Listings */}
        <div className="animate-fade-in">
          <h3 className="text-sm font-semibold text-text-secondary mb-3 px-1">💼 Сдаю аккаунты</h3>
          <button
            onClick={() => navigate('/my-listings')}
            className="w-full flex items-center gap-3 p-4 rounded-xl bg-surface-2 border border-white/5 text-left active:bg-surface-3 transition-colors"
          >
            <span className="text-xl">💼</span>
            <div className="flex-1">
              <p className="text-sm font-semibold">Мои аккаунты</p>
              <p className="text-xs text-text-muted">Статус заявок, доход</p>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
          <button
            onClick={() => navigate('/submit-account')}
            className="w-full mt-2 py-3 rounded-xl bg-accent/10 border border-accent/20 text-sm font-semibold text-accent active:bg-accent/20 transition-colors"
          >
            ➕ Сдать аккаунт
          </button>
        </div>

        {/* Admin Link */}
        {isAdmin && (
          <button
            onClick={() => navigate('/admin')}
            className="w-full flex items-center gap-3 p-4 rounded-xl bg-surface-2 border border-accent/20 text-left active:bg-surface-3 transition-colors animate-fade-in glow-border"
          >
            <span className="text-xl">⚙️</span>
            <div className="flex-1">
              <p className="text-sm font-semibold">Админ-панель</p>
              <p className="text-xs text-text-muted">Управление сервисом</p>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        )}
      </div>
    </div>
  )
}
