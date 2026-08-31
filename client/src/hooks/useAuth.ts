import { useState, useEffect } from 'react'
import { ADMIN_TELEGRAM_ID } from '../config'

export function useAuth() {
  const [userId, setUserId] = useState<string>('')
  const [username, setUsername] = useState<string>('')
  const [firstName, setFirstName] = useState<string>('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp?.initDataUnsafe?.user
    if (tg?.id) {
      setUserId(String(tg.id))
      setUsername(tg.username || '')
      setFirstName(tg.first_name || '')
      setReady(true)
    } else {
      // Fallback: check URL param or localStorage
      const params = new URLSearchParams(window.location.search)
      const paramId = params.get('user_id')
      const storedId = localStorage.getItem('tg_user_id')
      const id = paramId || storedId || ''
      if (id) {
        setUserId(id)
        localStorage.setItem('tg_user_id', id)
      }
      setReady(true)
    }
  }, [])

  const isAdmin = userId === ADMIN_TELEGRAM_ID

  return { userId, username, firstName, isAdmin, ready }
}
