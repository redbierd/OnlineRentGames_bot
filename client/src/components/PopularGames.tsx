import type { Game } from '../types'

const GAME_META: Record<string, { icon: string; minPrice: number }> = {
  valorant: { icon: '🎯', minPrice: 50 },
  fortnite: { icon: '🪂', minPrice: 80 },
  cs2: { icon: '💥', minPrice: 60 },
}

export default function PopularGames({ games, onSelect }: { games: Game[]; onSelect: (slug: string) => void }) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between px-5 mb-3">
        <h3 className="text-sm font-semibold text-text-secondary">🔥 Популярные игры</h3>
      </div>
      <div className="flex gap-3 overflow-x-auto px-5 pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
        {games.map((game, i) => {
          const meta = GAME_META[game.slug] || { icon: '🎮', minPrice: 0 }
          return (
            <button
              key={game.id}
              onClick={() => onSelect(game.slug)}
              className="shrink-0 w-[140px] rounded-xl overflow-hidden text-left transition-transform active:scale-95 animate-fade-in"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div
                className="h-[100px] flex items-end p-3 relative"
                style={{
                  background: `linear-gradient(160deg, ${game.color}40, ${game.color}15)`,
                }}
              >
                <div className="absolute top-2 right-2 text-2xl opacity-60">{meta.icon}</div>
                <div>
                  <p className="text-sm font-bold">{game.name}</p>
                  <p className="text-[10px] text-text-secondary">от {meta.minPrice}₽/день</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
