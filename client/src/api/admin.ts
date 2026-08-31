import { ADMIN_TELEGRAM_ID } from '../config'
import type { Game, Account, Order, UserProfile, ListingApplication, ListingStatus } from '../types'
import { fetchBotUsers } from './server'

// ── Bot user type ──

export interface BotUser {
  id: string
  first_name: string
  last_name: string
  username: string
  photo_url: string
  registered_at: string
  last_seen: string
  start_count: number
  opened_miniapp: boolean
  accepted_terms: boolean
  browsed_menu: boolean
  time_in_app_seconds: number
  level: number
}

// ── Mutable stores (simulates backend DB) ──

let _games: Game[] = [
  { id: 1, name: 'Valorant', slug: 'valorant', image_url: '', color: '#ff4655', accounts_count: 4 },
  { id: 2, name: 'Fortnite', slug: 'fortnite', image_url: '', color: '#9d4dbb', accounts_count: 4 },
  { id: 3, name: 'CS2', slug: 'cs2', image_url: '', color: '#f09b00', accounts_count: 4 },
]

let _accounts: Account[] = [
  { id: 1, game_id: 1, title: 'Diamond 2 | Все агенты', description: 'Полный доступ ко всем агентам', price_per_day: 150, rank: 'Diamond 2', status: 'available' },
  { id: 2, game_id: 1, title: 'Immortal 1 | Премиум скины', description: 'Редкие скины Reaver, Prime, RGX', price_per_day: 350, rank: 'Immortal 1', status: 'available' },
  { id: 3, game_id: 1, title: 'Gold 3 | Стартовый', description: 'Базовый набор агентов', price_per_day: 50, rank: 'Gold 3', status: 'available' },
  { id: 4, game_id: 1, title: 'Radiant | Топ аккаунт', description: 'Элитный аккаунт с эксклюзивными скинами', price_per_day: 500, rank: 'Radiant', status: 'available' },
  { id: 5, game_id: 2, title: 'Champion League | 200+ скинов', description: 'Огромная коллекция скинов', price_per_day: 250, rank: 'Champion', status: 'available' },
  { id: 6, game_id: 2, title: 'Diamond Arena | Баттлпасс', description: 'Текущий баттлпасс, 80+ скинов', price_per_day: 100, rank: 'Diamond', status: 'available' },
  { id: 7, game_id: 2, title: 'Unreal | Полная коллекция', description: 'Все сезонные скины с 1 главы', price_per_day: 450, rank: 'Unreal', status: 'available' },
  { id: 8, game_id: 2, title: 'Elite | Средний набор', description: 'Хороший набор скинов и эмоций', price_per_day: 80, rank: 'Elite', status: 'available' },
  { id: 9, game_id: 3, title: 'Global Elite | Инвентарь 5000$', description: 'Дорогой инвентарь: ножи, перчатки', price_per_day: 400, rank: 'Global Elite', status: 'available' },
  { id: 10, game_id: 3, title: 'Supreme | Средний инвентарь', description: 'Хороший набор скинов', price_per_day: 200, rank: 'Supreme', status: 'available' },
  { id: 11, game_id: 3, title: 'Gold Nova IV | Базовый', description: 'Базовые скины', price_per_day: 60, rank: 'Gold Nova IV', status: 'available' },
  { id: 12, game_id: 3, title: 'Legendary Eagle | Премиум', description: 'Премиум инвентарь с ножом и перчатками', price_per_day: 300, rank: 'Legendary Eagle', status: 'available' },
]

let _orders: Order[] = []

// Load bot users from server API
let _botUsers: BotUser[] = []

async function loadBotUsers() {
  try { _botUsers = await fetchBotUsers() } catch {}
}

interface AuditLog {
  id: number
  admin_id: string
  action: string
  target: string
  timestamp: string
  details: string
}

let _auditLog: AuditLog[] = []
let _nextLogId = 1

function log(adminId: string, action: string, target: string, details: string) {
  _auditLog.unshift({ id: _nextLogId++, admin_id: adminId, action, target, timestamp: new Date().toISOString(), details })
}

// ── Auth check ──

function requireAdmin(userId: string): void {
  if (userId !== ADMIN_TELEGRAM_ID) {
    throw new Error('403 Forbidden: Admin access required')
  }
}

// ── Dashboard ──

export async function adminGetStats(adminId: string) {
  requireAdmin(adminId)
  await loadBotUsers()
  const activeOrders = _orders.filter(o => o.status === 'active')
  const completedOrders = _orders.filter(o => o.status === 'completed')
  const availableAccounts = _accounts.filter(a => a.status === 'available')
  const revenue = _orders.reduce((sum, o) => sum + o.total_price, 0)

  return {
    totalUsers: _botUsers.length,
    activeRentals: activeOrders.length,
    availableAccounts: availableAccounts.length,
    totalGames: _games.length,
    completedRentals: completedOrders.length,
    revenue,
  }
}

// ── Users ──

export async function adminGetUsers(adminId: string): Promise<BotUser[]> {
  requireAdmin(adminId)
  await loadBotUsers()
  return [..._botUsers]
}

export async function adminGetUser(adminId: string, userId: string): Promise<BotUser | null> {
  requireAdmin(adminId)
  await loadBotUsers()
  return _botUsers.find(u => u.id === userId) || null
}

export async function adminUpdateUserLevel(adminId: string, userId: string, level: number): Promise<BotUser> {
  requireAdmin(adminId)
  const user = _botUsers.find(u => u.id === userId)
  if (!user) throw new Error('User not found')
  const oldLevel = user.level
  user.level = level
  log(adminId, 'change_level', `user:${userId}`, `${oldLevel} → ${level}`)
  return { ...user }
}

export async function adminGetUserOrders(adminId: string, userId: string): Promise<Order[]> {
  requireAdmin(adminId)
  return _orders.filter(o => o.user_id === userId)
}

// ── Rentals ──

export async function adminGetOrders(adminId: string): Promise<Order[]> {
  requireAdmin(adminId)
  return [..._orders]
}

export async function adminCreateOrder(adminId: string, data: { userId: string; accountId: number; hours: number }): Promise<Order> {
  requireAdmin(adminId)
  const account = _accounts.find(a => a.id === data.accountId)
  if (!account) throw new Error('Account not found')
  if (account.status === 'rented') throw new Error('Account already rented')

  const user = _users.find(u => u.id === data.userId)
  const game = _games.find(g => g.id === account.game_id)
  if (!game) throw new Error('Game not found')

  const pricePerHour = account.price_per_day / 24
  const totalPrice = Math.ceil(pricePerHour * data.hours)

  const order: Order = {
    id: Math.max(0, ..._orders.map(o => o.id)) + 1,
    account_id: account.id,
    game_id: game.id,
    game_name: game.name,
    game_slug: game.slug,
    account_title: account.title,
    user_id: data.userId,
    username: user?.username || '',
    rental_days: Math.ceil(data.hours / 24),
    total_price: totalPrice,
    status: 'active',
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + data.hours * 3600000).toISOString(),
    credentials: { login: `acc_${account.id}_login`, password: `pass_${account.id}_$ecure` },
  }

  _orders.push(order)
  account.status = 'rented'
  log(adminId, 'create_rental', `order:${order.id}`, `user:${data.userId} account:${data.accountId} ${data.hours}h`)
  return { ...order }
}

export async function adminExtendOrder(adminId: string, orderId: number, hours: number): Promise<Order> {
  requireAdmin(adminId)
  const order = _orders.find(o => o.id === orderId)
  if (!order) throw new Error('Order not found')
  const oldExpires = order.expires_at
  order.expires_at = new Date(new Date(order.expires_at).getTime() + hours * 3600000).toISOString()
  log(adminId, 'extend_rental', `order:${orderId}`, `${hours}h added`)
  return { ...order }
}

export async function adminReduceOrder(adminId: string, orderId: number, hours: number): Promise<Order> {
  requireAdmin(adminId)
  const order = _orders.find(o => o.id === orderId)
  if (!order) throw new Error('Order not found')
  const newExpires = new Date(new Date(order.expires_at).getTime() - hours * 3600000)
  if (newExpires.getTime() <= Date.now()) throw new Error('Cannot reduce below current time')
  order.expires_at = newExpires.toISOString()
  log(adminId, 'reduce_rental', `order:${orderId}`, `${hours}h removed`)
  return { ...order }
}

export async function adminCompleteOrder(adminId: string, orderId: number): Promise<Order> {
  requireAdmin(adminId)
  const order = _orders.find(o => o.id === orderId)
  if (!order) throw new Error('Order not found')
  order.status = 'completed'
  const account = _accounts.find(a => a.id === order.account_id)
  if (account) account.status = 'available'
  log(adminId, 'complete_rental', `order:${orderId}`, 'forced completion')
  return { ...order }
}

// ── Accounts ──

export async function adminGetAccounts(adminId: string): Promise<Account[]> {
  requireAdmin(adminId)
  return [..._accounts]
}

export async function adminCreateAccount(adminId: string, data: Omit<Account, 'id'>): Promise<Account> {
  requireAdmin(adminId)
  const account: Account = { ...data, id: Math.max(0, ..._accounts.map(a => a.id)) + 1 }
  _accounts.push(account)
  log(adminId, 'create_account', `account:${account.id}`, account.title)
  return { ...account }
}

export async function adminUpdateAccount(adminId: string, id: number, data: Partial<Account>): Promise<Account> {
  requireAdmin(adminId)
  const account = _accounts.find(a => a.id === id)
  if (!account) throw new Error('Account not found')
  Object.assign(account, data)
  log(adminId, 'update_account', `account:${id}`, JSON.stringify(data))
  return { ...account }
}

export async function adminDeleteAccount(adminId: string, id: number): Promise<void> {
  requireAdmin(adminId)
  const account = _accounts.find(a => a.id === id)
  if (!account) throw new Error('Account not found')
  if (account.status === 'rented') throw new Error('Cannot delete account with active rental')
  _accounts = _accounts.filter(a => a.id !== id)
  log(adminId, 'delete_account', `account:${id}`, account.title)
}

// ── Games ──

export async function adminGetGames(adminId: string): Promise<Game[]> {
  requireAdmin(adminId)
  return [..._games]
}

export async function adminCreateGame(adminId: string, data: Omit<Game, 'id'>): Promise<Game> {
  requireAdmin(adminId)
  const game: Game = { ...data, id: Math.max(0, ..._games.map(g => g.id)) + 1 }
  _games.push(game)
  log(adminId, 'create_game', `game:${game.id}`, game.name)
  return { ...game }
}

export async function adminUpdateGame(adminId: string, id: number, data: Partial<Game>): Promise<Game> {
  requireAdmin(adminId)
  const game = _games.find(g => g.id === id)
  if (!game) throw new Error('Game not found')
  Object.assign(game, data)
  log(adminId, 'update_game', `game:${id}`, JSON.stringify(data))
  return { ...game }
}

// ── Audit Log ──

export async function adminGetAuditLog(adminId: string): Promise<AuditLog[]> {
  requireAdmin(adminId)
  return [..._auditLog]
}

// ── Exports for user-facing API (read-only access to mutable stores) ──

export function getGamesStore() { return _games }
export function getAccountsStore() { return _accounts }
export function getOrdersStore() { return _orders }

// ── Listing Applications (via server API) ──

export { submitListing, getMyListings, adminGetListings, adminGetListing, adminApproveListing, adminRejectListing, adminSuspendListing } from './server'
