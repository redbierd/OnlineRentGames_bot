import { games, accounts, mockOrders, mockUser } from '../data'
import type { Game, Account, Order, UserProfile, AccountCredentials } from '../types'

export { getMyListings } from './admin'

export async function fetchGames(): Promise<Game[]> {
  return games
}

export async function fetchAccounts(gameId: number): Promise<Account[]> {
  return accounts.filter((a) => a.game_id === gameId)
}

export async function fetchAccountById(id: number): Promise<{ account: Account; gameName: string } | null> {
  const account = accounts.find((a) => a.id === id)
  if (!account) return null
  const game = games.find((g) => g.id === account.game_id)
  return { account, gameName: game?.name || '' }
}

export async function fetchOrders(): Promise<Order[]> {
  return mockOrders
}

export async function fetchOrderById(orderId: number): Promise<Order | null> {
  return mockOrders.find(o => o.id === orderId) || null
}

export async function fetchOrderCredentials(orderId: number): Promise<AccountCredentials | null> {
  const order = mockOrders.find(o => o.id === orderId)
  return order?.credentials || null
}

export async function fetchUser(): Promise<UserProfile> {
  const tg = (window as any).Telegram?.WebApp?.initDataUnsafe?.user
  if (tg?.id) {
    return {
      ...mockUser,
      id: String(tg.id),
      first_name: tg.first_name || 'Игрок',
      last_name: tg.last_name,
      username: tg.username,
      photo_url: tg.photo_url,
    }
  }
  // Fallback for admin testing outside Telegram
  const storedId = localStorage.getItem('tg_user_id')
  if (storedId) {
    return { ...mockUser, id: storedId }
  }
  return mockUser
}
