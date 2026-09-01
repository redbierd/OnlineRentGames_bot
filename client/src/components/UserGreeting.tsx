import type { UserProfile } from '../types'

export default function UserGreeting({ user }: { user: UserProfile }) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Доброе утро' : hour < 18 ? 'Добрый день' : 'Добрый вечер'

  return (
    <div className="flex items-center gap-3 animate-fade-in">
      <div className="w-9 h-9 rounded-full bg-accent/15 flex items-center justify-center text-accent font-bold text-sm shrink-0 overflow-hidden">
        {user.photo_url ? (
          <img src={user.photo_url} alt="" className="w-full h-full object-cover" />
        ) : (
          user.first_name[0]
        )}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-text-muted">{greeting}</p>
        <p className="text-[15px] font-semibold truncate leading-tight">{user.first_name}</p>
      </div>
    </div>
  )
}
