import { trackActivityAPI, trackTimeAPI } from '../api/server'

const SESSION_KEY = 'gamerent_session'
const ACTIVITY_KEY = 'gamerent_activity'

function getUserId(): string {
  const tg = (window as any).Telegram?.WebApp?.initDataUnsafe?.user
  if (tg?.id) return String(tg.id)
  return localStorage.getItem('tg_user_id') || ''
}

function getActivity() {
  try { return JSON.parse(localStorage.getItem(ACTIVITY_KEY) || '{}') } catch { return {} }
}

function saveActivity(a: any) {
  localStorage.setItem(ACTIVITY_KEY, JSON.stringify(a))
}

export function trackOpen() {
  const a = getActivity()
  a.opened_miniapp = true
  a.session_start = Date.now()
  saveActivity(a)
  const uid = getUserId()
  if (uid) trackActivityAPI(uid, 'opened_miniapp')
}

export function trackAcceptTerms() {
  const a = getActivity()
  a.accepted_terms = true
  saveActivity(a)
  const uid = getUserId()
  if (uid) trackActivityAPI(uid, 'accepted_terms')
}

export function trackBrowseMenu() {
  const a = getActivity()
  a.browsed_menu = true
  saveActivity(a)
  const uid = getUserId()
  if (uid) trackActivityAPI(uid, 'browsed_menu')
}

export function trackPageVisit(page: string) {
  const a = getActivity()
  if (!a.pages_visited) a.pages_visited = []
  if (!a.pages_visited.includes(page)) a.pages_visited.push(page)
  if (a.pages_visited.length >= 3) {
    a.browsed_menu = true
    const uid = getUserId()
    if (uid) trackActivityAPI(uid, 'browsed_menu')
  }
  saveActivity(a)
}

export function trackTime() {
  const a = getActivity()
  if (!a.session_start) { a.session_start = Date.now(); saveActivity(a); return }
  const elapsed = Math.floor((Date.now() - a.session_start) / 1000)
  a.total_time_seconds = (a.total_time_seconds || 0) + elapsed
  a.session_start = Date.now()
  saveActivity(a)
  const uid = getUserId()
  if (uid && elapsed > 0) trackTimeAPI(uid, elapsed)
}

export function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}с`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}м`
  return `${Math.floor(seconds / 3600)}ч ${Math.floor((seconds % 3600) / 60)}м`
}
