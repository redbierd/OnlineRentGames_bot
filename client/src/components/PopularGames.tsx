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
      <div className="px-5 mb-3">
        <h3 className="text-[13px] font-semibold text-text-secondary tracking-wide">Популярные игры</h3>
      </div>
      <div className="flex gap-3 overflow-x-auto px-5 pb-1 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
        {games.map((game, i) => {
          const s = stats[game.id]
          const available = s?.available ?? 0
          const minPrice = s?.min_price ?? 0
          const unavailable = loaded && available === 0

          return (
            <button
              key={game.id}
              onClick={() => onSelect(game.slug)}
              className={`shrink-0 w-[145px] rounded-2xl overflow-hidden text-left transition-all active:scale-[0.97] animate-fade-in ${unavailable ? 'opacity-40' : ''}`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div
                className="h-[105px] flex flex-col justify-end p-3.5 relative"
                style={{ background: `linear-gradient(155deg, ${game.color}30 0%, ${game.color}08 100%)` }}
              >
                <div className="absolute top-3 right-3 w-6 h-6 rounded-md flex items-center justify-center" style={{ background: `${game.color}18` }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: game.color, opacity: 0.8 }} />
                </div>
                <p className="text-[13px] font-bold leading-tight tracking-tight">{game.name}</p>
                {!loaded ? (
                  <div className="h-2.5 w-16 skeleton rounded mt-1.5" />
                ) : available > 0 ? (
                  <p className="text-[10px] text-text-secondary mt-1 font-medium">
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
