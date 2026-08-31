import type { Game } from '../types'
import { useFavorites } from '../hooks/useFavorites'

const GAME_ICONS: Record<string, string> = {
  valorant: '🎯',
  fortnite: '🪂',
  cs2: '💥',
}

export default function GameCard({ game, onClick }: { game: Game; onClick: () => void }) {
  const { isFav, toggle } = useFavorites()

  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl overflow-hidden text-left transition-all active:scale-[0.98]"
    >
      <div
        className="relative p-5 min-h-[120px] flex flex-col justify-end"
        style={{
          background: `linear-gradient(135deg, ${game.color}30, ${game.color}10)`,
          borderBottom: `2px solid ${game.color}40`,
        }}
      >
        <button
          onClick={(e) => { e.stopPropagation(); toggle(game.id) }}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-lg bg-surface-3/80 active:scale-90 transition-transform z-10"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={isFav(game.id) ? '#ff4757' : 'none'} stroke={isFav(game.id) ? '#ff4757' : '#8888a0'} strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
        <div className="text-3xl mb-2">{GAME_ICONS[game.slug] || '🎮'}</div>
        <h3 className="text-lg font-bold">{game.name}</h3>
        <p className="text-xs text-text-secondary mt-0.5">{game.accounts_count} аккаунтов доступно</p>
      </div>
    </button>
  )
}
