const ACTIVITY_KEY = 'gamerent_activity'

function getUserId(): string {
  const tg = (window as any).Telegram?.WebApp?.initDataUnsafe?.user
  if (tg?.id) return String(tg.id)
  return localStorage.getItem('tg_user_id') || ''
}

function headers(): HeadersInit {
  return { 'Content-Type': 'application/json', 'x-user-id': getUserId() }
}

function postActivity(field: string, value?: any) {
  fetch('/api/activity', { method: 'POST', headers: headers(), body: JSON.stringify({ field, value }) }).catch(() => {})
}

export function trackOpen() {
  postActivity('opened_miniapp', true)
}

export function trackAcceptTerms() {
  postActivity('accepted_terms', true)
}

export function trackBrowseMenu() {
  postActivity('browsed_games', true)
}

export function trackPageVisit(page: string) {
  if (page === '/profile') postActivity('visited_profile', true)
  if (page.startsWith('/rental/')) postActivity('visited_rental', true)
  if (page === '/games' || page.startsWith('/game/')) postActivity('browsed_games', true)
}

export function trackTime() {
  fetch('/api/activity/time', { method: 'POST', headers: headers(), body: JSON.stringify({ seconds: 30 }) }).catch(() => {})
}

export function formatTime(seconds: number): string {
  if (!seconds || seconds < 0) return '0с'
  if (seconds < 60) return `${seconds}с`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}м`
  return `${Math.floor(seconds / 3600)}ч ${Math.floor((seconds % 3600) / 60)}м`
}
