import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { adminGetStats, adminGetListings } from '../../api/admin'
import Header from '../../components/Header'

interface Stats {
  totalUsers: number
  activeRentals: number
  availableAccounts: number
  totalGames: number
  completedRentals: number
  revenue: number
}

export default function AdminDashboard() {
  const { userId } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<Stats | null>(null)
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      adminGetStats(userId),
      adminGetListings(userId, 'pending').catch(() => []),
    ]).then(([s, listings]) => {
      setStats(s)
      setPendingCount(listings.length)
    }).catch(console.error).finally(() => setLoading(false))
  }, [userId])

  return (
    <div className="flex-1 nav-spacer max-w-lg mx-auto w-full">
      <Header title="Админ-панель" showBack />
      <div className="p-4 space-y-4">
        {loading ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              {[1,2,3,4].map(i => <div key={i} className="h-20 skeleton rounded-xl" />)}
            </div>
            <div className="h-40 skeleton rounded-xl" />
          </>
        ) : stats && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 animate-fade-in">
              <StatCard label="Пользователей" value={stats.totalUsers} icon="👤" />
              <StatCard label="Активных аренд" value={stats.activeRentals} icon="⏱" color="text-success" />
              <StatCard label="Свободных акк." value={stats.availableAccounts} icon="🎮" />
              <StatCard label="Игр" value={stats.totalGames} icon="🎯" />
              <StatCard label="Завершённых" value={stats.completedRentals} icon="✅" />
              <StatCard label="Выручка" value={`${stats.revenue}₽`} icon="💰" color="text-accent" />
            </div>

            {/* Actions */}
            <div className="space-y-2 animate-fade-in" style={{ animationDelay: '100ms' }}>
              <h3 className="text-sm font-semibold text-text-secondary px-1">Управление</h3>
              {pendingCount > 0 && (
                <button
                  onClick={() => navigate('/admin/moderation')}
                  className="w-full flex items-center gap-3 p-4 rounded-xl bg-warning/5 border border-warning/20 text-left active:bg-surface-3 transition-colors"
                >
                  <span className="text-xl">📨</span>
                  <div className="flex-1">
                    <span className="text-sm font-medium">Модерация</span>
                    <span className="ml-2 text-xs bg-warning/20 text-warning px-2 py-0.5 rounded-full">{pendingCount} новых</span>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
              )}
              <ActionButton label="Модерация" icon="📨" onClick={() => navigate('/admin/moderation')} />
              <ActionButton label="Пользователи" icon="👤" onClick={() => navigate('/admin/users')} />
              <ActionButton label="Аккаунты" icon="🎮" onClick={() => navigate('/admin/accounts')} />
              <ActionButton label="Аренды" icon="⏱" onClick={() => navigate('/admin/rentals')} />
              <ActionButton label="Игры" icon="🎯" onClick={() => navigate('/admin/games')} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, color }: { label: string; value: number | string; icon: string; color?: string }) {
  return (
    <div className="rounded-xl bg-surface-2 border border-white/5 p-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm">{icon}</span>
        <span className="text-[10px] text-text-muted uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-xl font-bold ${color || ''}`}>{value}</p>
    </div>
  )
}

function ActionButton({ label, icon, onClick }: { label: string; icon: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-4 rounded-xl bg-surface-2 border border-white/5 text-left active:bg-surface-3 transition-colors"
    >
      <span className="text-xl">{icon}</span>
      <span className="text-sm font-medium flex-1">{label}</span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>
  )
}
