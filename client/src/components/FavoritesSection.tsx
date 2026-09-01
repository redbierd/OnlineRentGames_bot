import type { Game } from '../types'
import { useFavorites } from '../hooks/useFavorites'

export default function FavoritesSection({ games, onSelect }: { games: Game[]; onSelect: (slug: string) => void }) {
  const { favs } = useFavorites()
  const favGames = games.filter(g => favs.includes(g.id))

  if (favGames.length === 0) return null

  return (
    <div className="mb-5">
      <div className="px-5 mb-2.5">
        <h3 className="text-[13px] font-semibold text-text-secondary">Избранные</h3>
      </div>
      <div className="flex gap-2 overflow-x-auto px-5 pb-1" style={{ scrollbarWidth: 'none' }}>
        {favGames.map((game) => (
          <button
            key={game.id}
            onClick={() => onSelect(game.slug)}
            className="shrink-0 px-3.5 py-2 rounded-lg bg-surface-2/60 border border-white/[0.04] text-[12px] font-medium active:scale-95 transition-transform"
          >
            {game.name}
          </button>
        ))}
      </div>
    </div>
  )
}
