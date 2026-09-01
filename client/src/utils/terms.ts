export const CURRENT_TERMS_VERSION = '1.0'
const STORAGE_KEY = 'gamerent_terms_accepted'

export function getAcceptedVersion(): string | null {
  return localStorage.getItem(STORAGE_KEY)
}

export function setAcceptedVersion(version: string) {
  localStorage.setItem(STORAGE_KEY, version)
}

export function needsAcceptance(): boolean {
  return getAcceptedVersion() !== CURRENT_TERMS_VERSION
}
