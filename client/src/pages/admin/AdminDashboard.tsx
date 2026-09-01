import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { adminGetStats, fetchModeration } from '../../api/admin'
import Header from '../../components/Header'

export default function AdminDashboard() {
  const { userId } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<any>(null)
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([adminGetStats(), fetchModeration('pending_moderation').catch(() => [])])
      .then(([s, p]) => { setStats(s); setPendingCount(p.length) })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex-1 nav-spacer max-w-lg mx-auto w-full">
      <Header title="Админ-панель" showBack />
      <div className="p-4 space-y-4">
        {loading ? <div className="grid grid-cols-2 gap-3">{[1,2,3,4].map(i => <div key={i} className="h-20 skeleton rounded-xl" />)}</div> : stats && (
          <>
            <div className="grid grid-cols-2 gap-3 animate-fade-in">
              <StatCard label="Пользователей" value={stats.totalUsers} icon="👤" />
              <StatCard label="На модерации" value={stats.pendingModeration} icon="📨" color="text-warning" />
              <StatCard label="В каталоге" value={stats.availableAccounts} icon="🎮" color="text-success" />
              <StatCard label="Арендовано" value={stats.rentedAccounts} icon="⏱" color="text-accent" />
            </div>
            <div className="space-y-2 animate-fade-in">
              <h3 className="text-sm font-semibold text-text-secondary px-1">Управление</h3>
              <ActionBtn label="Проверка заявок" icon="📨" onClick={() => navigate('/admin/moderation')} badge={pendingCount > 0 ? `${pendingCount}` : undefined} />
              <ActionBtn label="Пользователи" icon="👤" onClick={() => navigate('/admin/users')} />
              <ActionBtn label="Аренды" icon="⏱" onClick={() => navigate('/admin/rentals')} />
              <ActionBtn label="Игры" icon="🎯" onClick={() => navigate('/admin/games')} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, color }: { label: string; value: number | string; icon: string; color?: string }) {
  return <div className="rounded-xl bg-surface-2 border border-white/5 p-3"><div className="flex items-center gap-2 mb-1"><span className="text-sm">{icon}</span><span className="text-[10px] text-text-muted uppercase tracking-wider">{label}</span></div><p className={`text-xl font-bold ${color || ''}`}>{value}</p></div>
}

function ActionBtn({ label, icon, onClick, badge }: { label: string; icon: string; onClick: () => void; badge?: string }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 p-4 rounded-xl text-left active:bg-surface-3 transition-colors ${badge ? 'bg-warning/5 border border-warning/20' : 'bg-surface-2 border border-white/5'}`}>
      <span className="text-xl">{icon}</span>
      <span className="text-sm font-medium flex-1">{label}</span>
      {badge && <span className="text-xs bg-warning/20 text-warning px-2 py-0.5 rounded-full">{badge}</span>}
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted"><polyline points="9 18 15 12 9 6" /></svg>
    </button>
  )
}
