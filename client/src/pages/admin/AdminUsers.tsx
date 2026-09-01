import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { adminGetUsers, adminUpdateUserLevel } from '../../api/admin'
import Header from '../../components/Header'

export default function AdminUsers() {
  const { userId } = useAuth()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => { adminGetUsers().then(setUsers).finally(() => setLoading(false)) }, [])

  const notify = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const handleLevel = async (uid: string, level: number) => {
    try { await adminUpdateUserLevel(userId, uid, level); setUsers(prev => prev.map(u => u.id === uid ? { ...u, level } : u)); notify('✅ Уровень обновлён') } catch { notify('❌ Ошибка') }
  }

  const filtered = users.filter(u => { const q = search.toLowerCase(); return !q || u.id.includes(q) || (u.username || '').toLowerCase().includes(q) || u.first_name.toLowerCase().includes(q) })

  return (
    <div className="flex-1 nav-spacer max-w-lg mx-auto w-full">
      <Header title="Пользователи" showBack />
      <div className="p-4 space-y-3">
        {toast && <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-surface-2 border border-white/10 text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg animate-slide-up">{toast}</div>}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input type="text" placeholder="Поиск..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-2 border border-white/5 text-sm focus:outline-none" />
        </div>
        {loading ? <>{[1,2,3].map(i => <div key={i} className="h-16 skeleton rounded-xl" />)}</> : filtered.map(u => (
          <div key={u.id} className="rounded-xl bg-surface-2 border border-white/5 p-3">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center text-accent font-bold text-sm">{u.first_name[0] || '?'}</div>
              <div className="flex-1"><p className="text-sm font-semibold">{u.first_name} {u.last_name || ''}</p><p className="text-xs text-text-muted">@{u.username || '—'} · ID: {u.id}</p></div>
              <span className="text-xs text-accent font-medium">Lvl {u.level}</span>
            </div>
            <div className="flex gap-1">
              {[1,2,3,5,10].map(l => <button key={l} onClick={() => handleLevel(u.id, l)} className={`px-2 py-1 rounded text-[10px] font-medium ${u.level === l ? 'bg-accent text-white' : 'bg-surface-3 text-text-secondary'}`}>{l}</button>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
