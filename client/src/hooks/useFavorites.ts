import { useState, useCallback } from 'react'

const KEY = 'game_favorites'

export function getFavorites(): number[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}

export function toggleFavorite(gameId: number): number[] {
  const favs = getFavorites()
  const next = favs.includes(gameId) ? favs.filter(id => id !== gameId) : [...favs, gameId]
  localStorage.setItem(KEY, JSON.stringify(next))
  return next
}

export function useFavorites() {
  const [favs, setFavs] = useState<number[]>(getFavorites())

  const toggle = useCallback((gameId: number) => {
    setFavs(prev => {
      const next = prev.includes(gameId) ? prev.filter(id => id !== gameId) : [...prev, gameId]
      localStorage.setItem(KEY, JSON.stringify(next))
      return next
    })
  }, [])

  return { favs, toggle, isFav: (id: number) => favs.includes(id) }
}
