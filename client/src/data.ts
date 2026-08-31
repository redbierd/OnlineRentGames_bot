import type { Game, Account, Order, UserProfile } from './types'

export const games: Game[] = [
  { id: 1, name: 'Valorant', slug: 'valorant', image_url: '', color: '#ff4655', accounts_count: 0 },
  { id: 2, name: 'Fortnite', slug: 'fortnite', image_url: '', color: '#9d4dbb', accounts_count: 0 },
  { id: 3, name: 'CS2', slug: 'cs2', image_url: '', color: '#f09b00', accounts_count: 0 },
]

export const accounts: Account[] = [
  { id: 1, game_id: 1, title: 'Diamond 2 | Все агенты', description: 'Полный доступ ко всем агентам, множество скинов оружия, боевой пропуск Act 5', price_per_day: 150, rank: 'Diamond 2', status: 'available' },
  { id: 2, game_id: 1, title: 'Immortal 1 | Премиум скины', description: 'Редкие скины Reaver, Prime, RGX. Высокий рейтинг', price_per_day: 350, rank: 'Immortal 1', status: 'available' },
  { id: 3, game_id: 1, title: 'Gold 3 | Стартовый', description: 'Базовый набор агентов, подходит для рейтинговых игр', price_per_day: 50, rank: 'Gold 3', status: 'available' },
  { id: 4, game_id: 1, title: 'Radiant | Топ аккаунт', description: 'Элитный аккаунт с эксклюзивными скинами и Radiant рангом', price_per_day: 500, rank: 'Radiant', status: 'available' },
  { id: 5, game_id: 2, title: 'Champion League | 200+ скинов', description: 'Огромная коллекция скинов, включая Renegade Raider и OG Skull Trooper', price_per_day: 250, rank: 'Champion', status: 'available' },
  { id: 6, game_id: 2, title: 'Diamond Arena | Баттлпасс', description: 'Текущий баттлпасс, 80+ скинов, множество эмоций', price_per_day: 100, rank: 'Diamond', status: 'available' },
  { id: 7, game_id: 2, title: 'Unreal | Полная коллекция', description: 'Все сезонные скины с 1 главы, редкие эксклюзивы', price_per_day: 450, rank: 'Unreal', status: 'available' },
  { id: 8, game_id: 2, title: 'Elite | Средний набор', description: 'Хороший набор скинов и эмоций, актуальный баттлпасс', price_per_day: 80, rank: 'Elite', status: 'available' },
  { id: 9, game_id: 3, title: 'Global Elite | Инвентарь 5000$', description: 'Дорогой инвентарь: ножи, перчатки, скины оружия', price_per_day: 400, rank: 'Global Elite', status: 'available' },
  { id: 10, game_id: 3, title: 'Supreme | Средний инвентарь', description: 'Хороший набор скинов, высокий рейтинг', price_per_day: 200, rank: 'Supreme', status: 'available' },
  { id: 11, game_id: 3, title: 'Gold Nova IV | Базовый', description: 'Базовые скины, подходит для катки с друзьями', price_per_day: 60, rank: 'Gold Nova IV', status: 'available' },
  { id: 12, game_id: 3, title: 'Legendary Eagle | Премиум', description: 'Премиум инвентарь с ножом и перчатками', price_per_day: 300, rank: 'Legendary Eagle', status: 'available' },
]

// Mock orders — in real app these would come from backend
export const mockOrders: Order[] = []

export const mockUser: UserProfile = {
  id: '123', first_name: 'Игрок', username: 'player',
  total_orders: 0, total_hours: 0, total_spent: 0,
  favorite_game: '', level: 1, xp: 0, xp_to_next: 100,
}

// Favorites stored in localStorage
export function getFavorites(): number[] {
  try { return JSON.parse(localStorage.getItem('favorites') || '[]') } catch { return [] }
}

export function toggleFavorite(gameId: number): number[] {
  const favs = getFavorites()
  const next = favs.includes(gameId) ? favs.filter(id => id !== gameId) : [...favs, gameId]
  localStorage.setItem('favorites', JSON.stringify(next))
  return next
}
