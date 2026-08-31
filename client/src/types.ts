export interface Game {
  id: number
  name: string
  slug: string
  image_url: string
  color: string
  accounts_count: number
}

export interface Account {
  id: number
  game_id: number
  title: string
  description: string
  price_per_day: number
  rank: string
  status: 'available' | 'rented'
  owner_id?: string
  owner_type?: 'platform' | 'user'
}

export interface Order {
  id: number
  account_id: number
  game_id: number
  game_name: string
  game_slug: string
  account_title: string
  user_id: string
  username: string
  rental_days: number
  total_price: number
  status: 'active' | 'completed' | 'pending'
  created_at: string
  expires_at: string
  credentials?: AccountCredentials
}

export interface AccountCredentials {
  login: string
  password: string
}

export interface UserProfile {
  id: string
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
  total_orders: number
  total_hours: number
  total_spent: number
  favorite_game: string
  level: number
  xp: number
  xp_to_next: number
}

export type ListingStatus = 'pending' | 'approved' | 'rejected' | 'suspended'

export interface ListingApplication {
  id: number
  user_id: string
  username: string
  game_id: number
  game_name: string
  title: string
  description: string
  extra_info: string
  price_per_day: number
  rank: string
  credentials: AccountCredentials
  status: ListingStatus
  rejection_reason: string
  admin_comment: string
  created_at: string
  reviewed_at: string
  reviewed_by: string
}
