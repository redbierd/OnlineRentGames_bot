import type { ListingApplication, ListingStatus } from '../types'

const API_BASE = '/api'

// ── Listings API ──

export async function submitListing(userId: string, username: string, data: {
  game_id: number; game_name?: string; title: string; description: string;
  extra_info: string; price_per_day: number; rank: string; login: string; password: string;
}): Promise<ListingApplication> {
  const res = await fetch(`${API_BASE}/listings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, username, ...data }),
  })
  if (!res.ok) throw new Error('Failed to submit listing')
  return res.json()
}

export async function getMyListings(userId: string): Promise<ListingApplication[]> {
  const res = await fetch(`${API_BASE}/listings?user_id=${userId}`)
  if (!res.ok) return []
  return res.json()
}

export async function adminGetListings(adminId: string, status?: ListingStatus): Promise<ListingApplication[]> {
  const url = status ? `${API_BASE}/listings?status=${status}` : `${API_BASE}/listings`
  const res = await fetch(url)
  if (!res.ok) return []
  return res.json()
}

export async function adminGetListing(adminId: string, listingId: number): Promise<ListingApplication | null> {
  const res = await fetch(`${API_BASE}/listings/${listingId}`)
  if (!res.ok) return null
  return res.json()
}

export async function adminApproveListing(adminId: string, listingId: number): Promise<ListingApplication> {
  const res = await fetch(`${API_BASE}/listings/${listingId}/approve`, { method: 'POST' })
  if (!res.ok) throw new Error('Failed to approve')
  return res.json()
}

export async function adminRejectListing(adminId: string, listingId: number, reason: string, comment: string): Promise<ListingApplication> {
  const res = await fetch(`${API_BASE}/listings/${listingId}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason, comment }),
  })
  if (!res.ok) throw new Error('Failed to reject')
  return res.json()
}

export async function adminSuspendListing(adminId: string, listingId: number, reason: string): Promise<ListingApplication> {
  const res = await fetch(`${API_BASE}/listings/${listingId}/suspend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  })
  if (!res.ok) throw new Error('Failed to suspend')
  return res.json()
}

// ── Activity API ──

export async function trackActivityAPI(userId: string, field: string) {
  try {
    await fetch(`${API_BASE}/activity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, field }),
    })
  } catch {}
}

export async function trackTimeAPI(userId: string, seconds: number) {
  try {
    await fetch(`${API_BASE}/activity/time`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, seconds }),
    })
  } catch {}
}

export async function acceptTermsAPI(userId: string, version: string) {
  try {
    await fetch(`${API_BASE}/terms/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, version }),
    })
  } catch {}
}

// ── Accounts API ──

export async function fetchAccountsFromServer(gameId?: number): Promise<any[]> {
  const url = gameId ? `${API_BASE}/accounts?game_id=${gameId}` : `${API_BASE}/accounts`
  const res = await fetch(url)
  if (!res.ok) return []
  return res.json()
}

export async function fetchAccountFromServer(id: number): Promise<any | null> {
  const res = await fetch(`${API_BASE}/accounts/${id}`)
  if (!res.ok) return null
  return res.json()
}

// ── Users API ──

export async function fetchBotUsers(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/users`)
  if (!res.ok) return []
  return res.json()
}

export async function updateUserLevel(userId: string, level: number): Promise<any> {
  const res = await fetch(`${API_BASE}/users/${userId}/level`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ level }),
  })
  if (!res.ok) throw new Error('Failed to update level')
  return res.json()
}

// ── Admin Orders API ──

export async function adminCreateOrderOnServer(userId: string, accountId: number, hours: number): Promise<any> {
  const res = await fetch(`${API_BASE}/admin/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, account_id: accountId, hours }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to create order')
  }
  return res.json()
}

// ── My Accounts API ──

export async function fetchMyAccounts(userId: string): Promise<any[]> {
  const res = await fetch(`${API_BASE}/my-accounts/${userId}`)
  if (!res.ok) return []
  return res.json()
}

// ── Game Stats API ──

export async function fetchGameStats(): Promise<Record<number, { total: number; available: number }>> {
  const res = await fetch(`${API_BASE}/games/stats`)
  if (!res.ok) return {}
  return res.json()
}

// ── Password Update API ──

export async function updateAccountPassword(accountId: number, userId: string, newPassword: string): Promise<any> {
  const res = await fetch(`${API_BASE}/accounts/${accountId}/password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: newPassword, owner_id: userId }),
  })
  if (!res.ok) throw new Error('Failed to update password')
  return res.json()
}
