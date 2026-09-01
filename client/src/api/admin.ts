import type { Account, Rental } from '../types'
import { fetchAllUsers, updateUserLevel, fetchModeration, approveAccount, rejectAccount, fetchMyAccounts, adminCreateRental, extendRental, completeRental, fetchAllRentals } from './server'

export type BotUser = {
  id: string; first_name: string; last_name: string; username: string; role: string; level: number; created_at: string; last_seen: string;
  activity?: { opened_bot: boolean; accepted_terms: boolean; opened_miniapp: boolean; visited_profile: boolean; visited_rental: boolean; browsed_games: boolean; time_in_app_seconds: number }
}

export { fetchModeration, approveAccount as adminApproveListing, rejectAccount as adminRejectListing }
export { fetchMyAccounts, adminCreateRental as adminCreateOrder, extendRental as adminExtendOrder, completeRental as adminCompleteOrder }
export { fetchAllRentals as adminGetOrders }

export async function adminGetUsers(): Promise<BotUser[]> {
  return fetchAllUsers()
}

export async function adminGetUser(_adminId: string, userId: string): Promise<BotUser | null> {
  const users = await fetchAllUsers()
  return users.find(u => u.id === userId) || null
}

export async function adminUpdateUserLevel(_adminId: string, userId: string, level: number): Promise<BotUser> {
  return updateUserLevel(userId, level)
}

export async function adminGetUserOrders(_adminId: string, userId: string): Promise<Rental[]> {
  const all = await fetchAllRentals()
  return all.filter(r => r.owner_id === userId || r.renter_id === userId)
}

export async function adminGetAccounts(): Promise<Account[]> {
  return fetchModeration()
}

export async function adminGetStats() {
  const users = await fetchAllUsers()
  const moderation = await fetchModeration()
  const pending = moderation.filter(a => a.status === 'pending_moderation')
  const available = moderation.filter(a => a.status === 'available')
  const rented = moderation.filter(a => a.status === 'rented')

  return {
    totalUsers: users.length,
    pendingModeration: pending.length,
    availableAccounts: available.length,
    rentedAccounts: rented.length,
    totalGames: 3,
  }
}

export function getGamesStore() {
  return [
    { id: 1, name: 'Valorant', slug: 'valorant', image_url: '', color: '#ff4655', accounts_count: 0 },
    { id: 2, name: 'Fortnite', slug: 'fortnite', image_url: '', color: '#9d4dbb', accounts_count: 0 },
    { id: 3, name: 'CS2', slug: 'cs2', image_url: '', color: '#f09b00', accounts_count: 0 },
  ]
}
