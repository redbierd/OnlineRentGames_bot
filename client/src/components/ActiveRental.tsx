import type { Order } from '../types'
import { useNavigate } from 'react-router-dom'

export default function ActiveRental({ order }: { order: Order | null }) {
  const navigate = useNavigate()

  if (!order) {
    return (
      <div className="rounded-2xl bg-surface-2 border border-white/5 p-5 animate-slide-up">
        <div className="text-center py-2">
          <div className="text-3xl mb-3">🎮</div>
          <p className="text-text-secondary text-sm mb-4">Готовы начать игру?</p>
          <button
            onClick={() => navigate('/games')}
            className="px-6 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold active:opacity-80 transition-opacity"
          >
            Выбрать игру
          </button>
        </div>
      </div>
    )
  }

  const expires = new Date(order.expires_at)
  const now = new Date()
  const diff = expires.getTime() - now.getTime()
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  const timeLeft = days > 0 ? `${days}д ${hours}ч` : `${hours}ч`

  return (
    <div className="rounded-2xl bg-surface-2 border border-accent/20 p-4 animate-slide-up glow-border">
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className="text-[10px] font-medium text-accent bg-accent/10 px-2 py-0.5 rounded-full">Активная аренда</span>
        </div>
        <span className="text-xs text-success font-medium">● Активна</span>
      </div>
      <p className="text-xs text-text-secondary mb-1">{order.game_name}</p>
      <p className="font-semibold text-sm mb-3">{order.account_title}</p>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-text-muted">Осталось</p>
          <p className="text-lg font-bold text-accent">{timeLeft}</p>
        </div>
        <button
          onClick={() => navigate(`/rent/${order.account_id}`)}
          className="px-4 py-2 rounded-lg bg-surface-3 text-xs font-medium text-text-secondary active:bg-surface transition-colors"
        >
          Подробнее
        </button>
      </div>
    </div>
  )
}
