import { useEffect, useState } from 'react'
import type { Game } from '../types'
import { fetchGameStats } from '../api/server'

const GAME_ICONS: Record<string, string> = {
  valorant: '🎯', fortnite: '🪂', cs2: '💥',
}

interface GameStat { total: number; available: number; min_price: number }

export default function PopularGames({ games, onSelect }: { games: Game[]; onSelect: (slug: string) => void }) {
  const [stats, setStats] = useState<Record<number, GameStat>>({})
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetchGameStats().then(s => { setStats(s); setLoaded(true) }).catch(() => setLoaded(true))
  }, [])

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between px-5 mb-3">
        <h3 className="text-sm font-semibold text-text-secondary">🔥 Популярные игры</h3>
      </div>
      <div className="flex gap-3 overflow-x-auto px-5 pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
        {games.map((game, i) => {
          const s = stats[game.id]
          const available = s?.available ?? 0
          const minPrice = s?.min_price ?? 0

          return (
            <button
              key={game.id}
              onClick={() => onSelect(game.slug)}
              className="shrink-0 w-[150px] rounded-xl overflow-hidden text-left transition-transform active:scale-95 animate-fade-in"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div
                className="h-[110px] flex flex-col justify-end p-3 relative"
                style={{ background: `linear-gradient(160deg, ${game.color}40, ${game.color}15)` }}
              >
                <div className="absolute top-2 right-2 text-2xl opacity-60">{GAME_ICONS[game.slug] || '🎮'}</div>
                <p className="text-sm font-bold">{game.name}</p>
                {!loaded ? (
                  <div className="h-3 w-20 skeleton rounded mt-1" />
                ) : available > 0 ? (
                  <p className="text-[10px] text-text-secondary mt-0.5">
                    {available} акк. · от {minPrice}₽/день
                  </p>
                ) : (
                  <p className="text-[10px] text-text-muted mt-0.5">Нет в наличии</p>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
