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
  owner_id: string
  owner_username: string
  game_id: number
  game_name: string
  title: string
  description: string
  extra_info: string
  rank: string
  login: string
  password: string
  price_per_hour: number
  status: 'pending_moderation' | 'available' | 'rented' | 'waiting_password_change' | 'suspended' | 'rejected'
  created_at: string
  approved_at?: string
  rejection_reason?: string
  admin_comment?: string
}

export interface Rental {
  id: number
  account_id: number
  owner_id: string
  renter_id: string
  renter_username: string
  game_id: number
  game_name: string
  account_title: string
  hours: number
  price: number
  status: 'active' | 'completed'
  started_at: string
  expires_at: string
  created_at: string
  ended_at?: string
  ended_by?: string
  end_reason?: string
  ten_min_warning: boolean
  payment_source: string
}

export interface UserProfile {
  id: string
  first_name: string
  last_name?: string
  username?: string
  role: 'USER' | 'ADMIN'
  level: number
  created_at: string
}
