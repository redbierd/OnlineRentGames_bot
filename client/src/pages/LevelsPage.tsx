import { useEffect, useState } from 'react'
import { fetchUser } from '../api'
import type { UserProfile } from '../types'
import Header from '../components/Header'
import { LEVELS } from '../config/levels'

export default function LevelsPage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUser().then(setUser).finally(() => setLoading(false))
  }, [])

  if (loading || !user) {
    return (
      <div className="flex-1 max-w-lg mx-auto w-full">
        <Header title="Уровни и бонусы" showBack />
        <div className="p-5 space-y-4">
          <div className="h-32 skeleton rounded-2xl" />
          <div className="h-48 skeleton rounded-2xl" />
        </div>
      </div>
    )
  }

  const currentLevel = LEVELS.find(l => l.level === user.level) || LEVELS[0]
  const nextLevel = LEVELS.find(l => l.level === user.level + 1)
  const progressPercent = user.nextXp > 0 ? Math.min(100, (user.currentXp / user.nextXp) * 100) : 100

  return (
    <div className="flex-1 max-w-lg mx-auto w-full overflow-y-auto">
      <Header title="Уровни и бонусы" showBack />
      <div className="p-5 space-y-5">
        {/* Current Level Hero */}
        <div className="card p-5 text-center animate-fade-in glow-border">
          <div className="w-14 h-14 rounded-2xl bg-warning/10 flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">⭐</span>
          </div>
          <p className="text-2xl font-bold mb-0.5">Уровень {user.level}</p>
          <p className="text-[13px] text-accent font-medium mb-4">{currentLevel.name}</p>

          <div className="mb-3">
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-text-muted">{user.currentXp} / {user.nextXp} XP</span>
              <span className="text-text-muted">{user.nextXp - user.currentXp} XP до {user.level + 1}</span>
            </div>
            <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
              <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface-3 rounded-xl p-3 text-center">
              <p className="text-[10px] text-text-muted mb-1">Кэшбэк</p>
              <p className="text-lg font-bold text-success">{currentLevel.cashbackPercent}%</p>
            </div>
            <div className="bg-surface-3 rounded-xl p-3 text-center">
              <p className="text-[10px] text-text-muted mb-1">Комиссия</p>
              <p className="text-lg font-bold text-warning">{currentLevel.commissionPercent}%</p>
            </div>
          </div>
        </div>

        {/* How to earn XP */}
        <div className="card p-4 animate-fade-in">
          <h3 className="text-[13px] font-semibold mb-3">Как получать XP?</h3>
          <div className="space-y-2.5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-accent">
                  <rect x="2" y="6" width="20" height="12" rx="3" />
                  <line x1="6" y1="12" x2="10" y2="12" />
                </svg>
              </div>
              <div>
                <p className="text-[13px] font-medium">1 час аренды</p>
                <p className="text-[11px] text-accent">+1 XP</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-success">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <div>
                <p className="text-[13px] font-medium">1 час сдачи</p>
                <p className="text-[11px] text-success">+2 XP</p>
              </div>
            </div>
          </div>
        </div>

        {/* Next level hint */}
        {nextLevel && (
          <div className="rounded-xl bg-accent/5 border border-accent/10 p-3 animate-fade-in">
            <p className="text-[12px] text-accent text-center">
              Ещё {user.nextXp - user.currentXp} XP — и вы получите {nextLevel.cashbackPercent}% кэшбэка
            </p>
          </div>
        )}

        {/* All Levels */}
        <div className="animate-fade-in">
          <h3 className="text-[13px] font-semibold text-text-secondary mb-3">Все уровни</h3>
          <div className="space-y-2">
            {LEVELS.map(level => {
              const isCurrent = level.level === user.level
              const isPast = level.level < user.level
              const isNext = level.level === user.level + 1

              return (
                <div
                  key={level.level}
                  className={`card p-3 flex items-center gap-3 transition-all ${
                    isCurrent ? 'glow-border border-accent/20' : isPast ? 'opacity-50' : ''
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    isCurrent ? 'bg-accent/20' : isNext ? 'bg-accent/10' : 'bg-surface-3'
                  }`}>
                    <span className={`text-sm font-bold ${isCurrent ? 'text-accent' : isNext ? 'text-accent' : 'text-text-muted'}`}>
                      {level.level}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-[13px] font-semibold ${isCurrent ? 'text-accent' : ''}`}>{level.name}</p>
                      {isCurrent && <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-accent/10 text-accent">Текущий</span>}
                      {isNext && <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-surface-3 text-text-muted">Следующий</span>}
                    </div>
                    <p className="text-[11px] text-text-muted">{level.xpRequired} XP</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[11px] text-success font-medium">{level.cashbackPercent}%</p>
                    <p className="text-[10px] text-text-muted">{level.commissionPercent}%</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
