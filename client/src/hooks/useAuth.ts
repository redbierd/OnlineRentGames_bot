import { useState, useEffect } from 'react'
import { ADMIN_TELEGRAM_ID } from '../config'

export function useAuth() {
  const [userId, setUserId] = useState('')
  const [username, setUsername] = useState('')
  const [firstName, setFirstName] = useState('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp?.initDataUnsafe?.user
    if (tg?.id) {
      setUserId(String(tg.id))
      setUsername(tg.username || '')
      setFirstName(tg.first_name || '')
      localStorage.setItem('tg_user_id', String(tg.id))
    } else {
      // Fallback for testing outside Telegram
      const stored = localStorage.getItem('tg_user_id')
      if (stored) setUserId(stored)
    }
    setReady(true)
  }, [])

  const isAdmin = userId === ADMIN_TELEGRAM_ID

  return { userId, username, firstName, isAdmin, ready }
}
