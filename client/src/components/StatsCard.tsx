import type { UserProfile } from '../types'

export default function StatsCard({ user }: { user: UserProfile }) {
  const stats = [
    { label: 'Аренд', value: user.total_orders, icon: '📦' },
    { label: 'Часов', value: user.total_hours, icon: '⏱' },
    { label: 'Потрачено', value: `${(user.total_spent / 1000).toFixed(1)}К`, icon: '💰' },
    { label: 'Любимая', value: user.favorite_game, icon: '❤️' },
  ]

  return (
    <div className="animate-fade-in">
      <h3 className="text-sm font-semibold text-text-secondary mb-3 px-1">Статистика</h3>
      <div className="grid grid-cols-2 gap-2">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className="rounded-xl bg-surface-2 border border-white/5 p-3"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm">{stat.icon}</span>
              <span className="text-[10px] text-text-muted uppercase tracking-wider">{stat.label}</span>
            </div>
            <p className="text-lg font-bold">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
