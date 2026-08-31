export interface Game {
  id: number
  name: string
  slug: string
  image_url: string
}

export interface Account {
  id: number
  game_id: number
  title: string
  description: string
  price_per_day: number
  rank: string
  status: 'available' | 'rented'
}

export interface Order {
  id: number
  account_id: number
  user_id: string
  username: string
  rental_days: number
  total_price: number
  status: string
  created_at: string
}
