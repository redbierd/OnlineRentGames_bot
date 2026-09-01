const API_BASE = '/api'

function headers(extra?: Record<string, string>): HeadersInit {
  const userId = getUserId()
  return { 'Content-Type': 'application/json', 'x-user-id': userId, ...extra }
}

function getUserId(): string {
  const tg = (window as any).Telegram?.WebApp?.initDataUnsafe?.user
  if (tg?.id) return String(tg.id)
  return localStorage.getItem('tg_user_id') || ''
}

// ── Users ──
export async function fetchCurrentUser(): Promise<any> {
  const res = await fetch(`${API_BASE}/users/me`, { headers: headers() })
  if (!res.ok) return null
  return res.json()
}

export async function fetchAllUsers(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/users`, { headers: headers({ 'x-admin': '1' }) })
  if (!res.ok) return []
  return res.json()
}

export async function updateUserLevel(userId: string, level: number): Promise<any> {
  const res = await fetch(`${API_BASE}/users/${userId}/level`, { method: 'POST', headers: headers({ 'x-admin': '1' }), body: JSON.stringify({ level }) })
  if (!res.ok) throw new Error('Failed')
  return res.json()
}

// ── Accounts (catalog) ──
export async function fetchCatalogAccounts(gameId?: number): Promise<any[]> {
  let url = `${API_BASE}/accounts`
  if (gameId) url += `?game_id=${gameId}`
  const res = await fetch(url, { headers: headers() })
  if (!res.ok) return []
  return res.json()
}

export async function fetchAccountById(id: number): Promise<any | null> {
  const res = await fetch(`${API_BASE}/accounts/${id}`, { headers: headers() })
  if (!res.ok) return null
  return res.json()
}

export async function fetchMyAccounts(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/my-accounts`, { headers: headers() })
  if (!res.ok) return []
  return res.json()
}

export async function updateAccountPassword(accountId: number, password: string): Promise<any> {
  const res = await fetch(`${API_BASE}/accounts/${accountId}/update-password`, { method: 'POST', headers: headers(), body: JSON.stringify({ password }) })
  if (!res.ok) throw new Error('Failed')
  return res.json()
}

export async function fetchGameStats(): Promise<Record<number, { total: number; available: number; min_price: number }>> {
  const res = await fetch(`${API_BASE}/games/stats`, { headers: headers() })
  if (!res.ok) return {}
  return res.json()
}

// ── Moderation ──
export async function submitAccount(data: any): Promise<any> {
  const res = await fetch(`${API_BASE}/accounts/submit`, { method: 'POST', headers: headers(), body: JSON.stringify(data) })
  if (!res.ok) throw new Error('Failed')
  return res.json()
}

export async function fetchModeration(status?: string): Promise<any[]> {
  let url = `${API_BASE}/moderation`
  if (status) url += `?status=${status}`
  const res = await fetch(url, { headers: headers({ 'x-admin': '1' }) })
  if (!res.ok) return []
  return res.json()
}

export async function approveAccount(id: number): Promise<any> {
  const res = await fetch(`${API_BASE}/moderation/${id}/approve`, { method: 'POST', headers: headers({ 'x-admin': '1' }) })
  if (!res.ok) throw new Error('Failed')
  return res.json()
}

export async function rejectAccount(id: number, reason: string, comment: string): Promise<any> {
  const res = await fetch(`${API_BASE}/moderation/${id}/reject`, { method: 'POST', headers: headers({ 'x-admin': '1' }), body: JSON.stringify({ reason, comment }) })
  if (!res.ok) throw new Error('Failed')
  return res.json()
}

// ── Rentals ──
export async function fetchMyRentals(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/rentals`, { headers: headers() })
  if (!res.ok) return []
  return res.json()
}

export async function fetchAllRentals(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/rentals/all`, { headers: headers({ 'x-admin': '1' }) })
  if (!res.ok) return []
  return res.json()
}

export async function fetchRental(id: number): Promise<any | null> {
  const res = await fetch(`${API_BASE}/rentals/${id}`, { headers: headers() })
  if (!res.ok) return null
  return res.json()
}

export async function createRental(accountId: number, hours: number): Promise<any> {
  const res = await fetch(`${API_BASE}/rentals`, { method: 'POST', headers: headers(), body: JSON.stringify({ account_id: accountId, hours }) })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed')
  }
  return res.json()
}

export async function extendRental(rentalId: number, hours: number): Promise<any> {
  const res = await fetch(`${API_BASE}/rentals/${rentalId}/extend`, { method: 'POST', headers: headers(), body: JSON.stringify({ hours }) })
  if (!res.ok) throw new Error('Failed')
  return res.json()
}

export async function completeRental(rentalId: number, reason: string): Promise<any> {
  const res = await fetch(`${API_BASE}/rentals/${rentalId}/complete`, { method: 'POST', headers: headers({ 'x-admin': '1' }), body: JSON.stringify({ reason }) })
  if (!res.ok) throw new Error('Failed')
  return res.json()
}
