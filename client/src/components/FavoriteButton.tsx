import { useFavorites } from '../hooks/useFavorites'

export function FavoriteButton({ gameId }: { gameId: number }) {
  const { isFav, toggle } = useFavorites()

  return (
    <button
      onClick={(e) => { e.stopPropagation(); toggle(gameId) }}
      className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-3/80 active:scale-90 transition-transform"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill={isFav(gameId) ? '#ff4757' : 'none'} stroke={isFav(gameId) ? '#ff4757' : '#8888a0'} strokeWidth="2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  )
}
