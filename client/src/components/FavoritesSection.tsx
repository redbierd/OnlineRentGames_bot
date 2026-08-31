import type { Game } from '../types'
import { useFavorites } from '../hooks/useFavorites'

export default function FavoritesSection({ games, onSelect }: { games: Game[]; onSelect: (slug: string) => void }) {
  const { favs } = useFavorites()
  const favGames = games.filter(g => favs.includes(g.id))

  if (favGames.length === 0) return null

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between px-5 mb-3">
        <h3 className="text-sm font-semibold text-text-secondary">❤️ Избранные</h3>
      </div>
      <div className="flex gap-2 overflow-x-auto px-5 pb-2" style={{ scrollbarWidth: 'none' }}>
        {favGames.map((game) => (
          <button
            key={game.id}
            onClick={() => onSelect(game.slug)}
            className="shrink-0 px-4 py-2.5 rounded-xl bg-surface-2 border border-white/5 text-sm font-medium active:scale-95 transition-transform"
          >
            {game.name}
          </button>
        ))}
      </div>
    </div>
  )
}
