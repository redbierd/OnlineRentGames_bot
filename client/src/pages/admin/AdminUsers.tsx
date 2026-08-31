import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { adminGetUsers } from '../../api/admin'
import type { BotUser } from '../../api/admin'
import Header from '../../components/Header'
import { formatTime } from '../../utils/activity'

export default function AdminUsers() {
  const { userId } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState<BotUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    adminGetUsers(userId).then(setUsers).catch(console.error).finally(() => setLoading(false))
  }, [userId])

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    return !q ||
      u.id.includes(q) ||
      (u.username || '').toLowerCase().includes(q) ||
      u.first_name.toLowerCase().includes(q) ||
      (u.last_name || '').toLowerCase().includes(q)
  })

  return (
    <div className="flex-1 nav-spacer max-w-lg mx-auto w-full">
      <Header title="Пользователи" showBack />
      <div className="p-4 space-y-3">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Поиск по ID, username, имени..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-2 border border-white/5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/30"
          />
        </div>

        {loading ? (
          <>{[1,2,3].map(i => <div key={i} className="h-20 skeleton rounded-xl" />)}</>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">👥</div>
            <p className="text-text-muted text-sm">Пока нет пользователей</p>
            <p className="text-text-muted text-xs mt-1">Они появятся после нажатия /start в боте</p>
          </div>
        ) : (
          filtered.map(user => {
            const statusItems = []
            if (user.opened_miniapp) statusItems.push('📱 App')
            if (user.accepted_terms) statusItems.push('✅ Согл.')
            if (user.browsed_menu) statusItems.push('🔍 Меню')

            return (
              <button
                key={user.id}
                onClick={() => navigate(`/admin/users/${user.id}`)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-surface-2 border border-white/5 text-left active:bg-surface-3 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center text-accent font-bold text-sm shrink-0">
                  {user.photo_url ? (
                    <img src={user.photo_url} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    user.first_name[0] || '?'
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{user.first_name} {user.last_name}</p>
                  <p className="text-xs text-text-muted">@{user.username || '—'} · ID: {user.id}</p>
                  {statusItems.length > 0 && (
                    <p className="text-[10px] text-accent mt-0.5">{statusItems.join(' · ')}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-accent font-medium">Lvl {user.level}</p>
                  <p className="text-[10px] text-text-muted">{formatTime(user.time_in_app_seconds)}</p>
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
