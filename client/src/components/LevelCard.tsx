import type { UserProfile } from '../types'

export default function LevelCard({ user }: { user: UserProfile }) {
  const progress = (user.xp / user.xp_to_next) * 100

  return (
    <div className="rounded-2xl bg-surface-2 border border-accent/20 p-4 animate-fade-in glow-border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
            <span className="text-sm">⭐</span>
          </div>
          <div>
            <p className="text-xs text-text-muted">Уровень</p>
            <p className="text-lg font-bold text-accent">{user.level}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-text-muted">XP</p>
          <p className="text-sm font-semibold">{user.xp} / {user.xp_to_next}</p>
        </div>
      </div>
      <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
        <div
          className="h-full bg-accent rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-[10px] text-text-muted mt-2 text-center">
        {user.xp_to_next - user.xp} XP до уровня {user.level + 1}
      </p>
    </div>
  )
}
