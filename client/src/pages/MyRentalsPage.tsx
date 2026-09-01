import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { fetchMyRentals } from '../api/server'
import type { Rental } from '../types'
import Header from '../components/Header'

export default function MyRentalsPage() {
  const { userId } = useAuth()
  const [rentals, setRentals] = useState<Rental[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchMyRentals().then(setRentals).finally(() => setLoading(false))
  }, [])

  const asRenter = rentals.filter(r => r.renter_id === userId)
  const active = asRenter.filter(r => r.status === 'active')
  const completed = asRenter.filter(r => r.status === 'completed')

  return (
    <div className="flex-1 nav-spacer max-w-lg mx-auto w-full">
      <Header title="Мои аренды" />
      <div className="p-4 space-y-4">
        {loading ? (
          <>{[1,2].map(i => <div key={i} className="h-24 skeleton rounded-xl" />)}</>
        ) : asRenter.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">📦</div>
            <p className="text-text-secondary text-sm mb-4">У вас пока нет аренд</p>
            <button onClick={() => navigate('/games')} className="px-6 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold active:opacity-80">Выбрать игру</button>
          </div>
        ) : (
          <>
            {active.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-text-secondary mb-2">🟢 Активные</h3>
                {active.map(r => {
                  const diff = Math.max(0, new Date(r.expires_at).getTime() - Date.now())
                  const h = Math.floor(diff / 3600000), m = Math.floor((diff % 3600000) / 60000)
                  return (
                    <button key={r.id} onClick={() => navigate(`/rental/${r.id}`)} className="w-full rounded-xl bg-surface-2 border border-accent/20 p-4 text-left glow-border mb-2">
                      <p className="text-xs text-text-muted">{r.game_name}</p>
                      <p className="text-sm font-semibold">{r.account_title}</p>
                      <p className="text-xs text-accent mt-1">Осталось: {h}ч {m}м · {r.price}₽</p>
                    </button>
                  )
                })}
              </div>
            )}
            {completed.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-text-secondary mb-2">📦 Завершённые</h3>
                {completed.map(r => (
                  <div key={r.id} className="rounded-xl bg-surface-2 border border-white/5 p-4 mb-2 opacity-60">
                    <p className="text-xs text-text-muted">{r.game_name}</p>
                    <p className="text-sm font-semibold">{r.account_title}</p>
                    <p className="text-xs text-text-muted mt-1">{r.hours}ч · {r.price}₽</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
