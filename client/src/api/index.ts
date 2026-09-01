import { games } from '../data'
import type { Game } from '../types'
import { fetchCatalogAccounts, fetchAccountById as fetchAccountByIdServer, fetchMyRentals, fetchCurrentUser } from './server'

export async function fetchGames(): Promise<Game[]> {
  return games
}

export async function fetchAccounts(gameId: number) {
  return fetchCatalogAccounts(gameId)
}

export async function fetchAccountById(id: number) {
  const acc = await fetchAccountByIdServer(id)
  if (!acc) return null
  const game = games.find(g => g.id === acc.game_id)
  return { account: acc, gameName: game?.name || '' }
}

export async function fetchOrders() {
  return fetchMyRentals()
}

export async function fetchUser() {
  const user = await fetchCurrentUser()
  if (user) return user
  // Fallback
  return { id: '', first_name: 'Игрок', role: 'USER', level: 1, created_at: '' }
}
