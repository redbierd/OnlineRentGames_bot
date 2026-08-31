import { games, mockOrders, mockUser } from '../data'
import type { Game, Account, Order, UserProfile, AccountCredentials } from '../types'
import { fetchAccountsFromServer } from './server'

export { getMyListings } from './admin'

export async function fetchGames(): Promise<Game[]> {
  return games
}

export async function fetchAccounts(gameId: number): Promise<Account[]> {
  try {
    const serverAccounts = await fetchAccountsFromServer(gameId)
    if (serverAccounts.length > 0) return serverAccounts
  } catch {}
  return []
}

export async function fetchAccountById(id: number): Promise<{ account: Account; gameName: string } | null> {
  try {
    const allAccounts = await fetchAccountsFromServer()
    const account = allAccounts.find((a: any) => a.id === id)
    if (account) {
      const game = games.find((g) => g.id === account.game_id)
      return { account, gameName: game?.name || '' }
    }
  } catch {}
  return null
}

export async function fetchOrders(): Promise<Order[]> {
  try {
    const res = await fetch('/api/orders')
    if (res.ok) return res.json()
  } catch {}
  return mockOrders
}

export async function fetchOrderById(orderId: number): Promise<Order | null> {
  try {
    const orders = await fetchOrders()
    return orders.find((o: any) => o.id === orderId) || null
  } catch {}
  return null
}

export async function fetchOrderCredentials(orderId: number): Promise<AccountCredentials | null> {
  const order = await fetchOrderById(orderId)
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
  const storedId = localStorage.getItem('tg_user_id')
  if (storedId) {
    return { ...mockUser, id: storedId }
  }
  return mockUser
}
