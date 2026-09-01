import { useEffect, useState } from 'react'
import type { Game } from '../types'
import { fetchGameStats } from '../api/server'

interface GameStat { total: number; available: number; min_price: number }

export default function PopularGames({ games, onSelect }: { games: Game[]; onSelect: (slug: string) => void }) {
  const [stats, setStats] = useState<Record<number, GameStat>>({})
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetchGameStats().then(s => { setStats(s); setLoaded(true) }).catch(() => setLoaded(true))
  }, [])

  return (
    <div className="mb-5">
      <div className="px-5 mb-2.5">
        <h3 className="text-[13px] font-semibold text-text-secondary">Популярные игры</h3>
      </div>
      <div className="flex gap-2.5 overflow-x-auto px-5 pb-1 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
        {games.map((game, i) => {
          const s = stats[game.id]
          const available = s?.available ?? 0
          const minPrice = s?.min_price ?? 0
          const unavailable = loaded && available === 0

          return (
            <button
              key={game.id}
              onClick={() => onSelect(game.slug)}
              className={`shrink-0 w-[140px] rounded-xl overflow-hidden text-left transition-all active:scale-95 animate-fade-in ${unavailable ? 'opacity-50' : ''}`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div
                className="h-[100px] flex flex-col justify-end p-3 relative"
                style={{ background: `linear-gradient(160deg, ${game.color}35, ${game.color}10)` }}
              >
                <div className="absolute top-2.5 right-2.5 w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${game.color}20` }}>
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: game.color }} />
                </div>
                <p className="text-[13px] font-bold leading-tight">{game.name}</p>
                {!loaded ? (
                  <div className="h-2.5 w-16 skeleton rounded mt-1.5" />
                ) : available > 0 ? (
                  <p className="text-[10px] text-text-secondary mt-1">
                    {available} акк. · от {minPrice}₽/ч
                  </p>
                ) : (
                  <p className="text-[10px] text-text-muted mt-1">Нет в наличии</p>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
