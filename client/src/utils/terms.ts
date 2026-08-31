import { acceptTermsAPI } from '../api/server'

export const CURRENT_TERMS_VERSION = '1.0'

const STORAGE_KEY = 'gamerent_terms_accepted'

function getUserId(): string {
  const tg = (window as any).Telegram?.WebApp?.initDataUnsafe?.user
  if (tg?.id) return String(tg.id)
  return localStorage.getItem('tg_user_id') || ''
}

export function getAcceptedVersion(): string | null {
  return localStorage.getItem(STORAGE_KEY)
}

export function setAcceptedVersion(version: string) {
  localStorage.setItem(STORAGE_KEY, version)
  const uid = getUserId()
  if (uid) acceptTermsAPI(uid, version)
}

export function needsAcceptance(): boolean {
  return getAcceptedVersion() !== CURRENT_TERMS_VERSION
}
