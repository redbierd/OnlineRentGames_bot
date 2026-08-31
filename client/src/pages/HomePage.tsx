import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchGames, fetchOrders, fetchUser, getMyListings } from '../api'
import { useAuth } from '../hooks/useAuth'
import type { Game, Order, UserProfile } from '../types'
import UserGreeting from '../components/UserGreeting'
import PopularGames from '../components/PopularGames'
import FavoritesSection from '../components/FavoritesSection'
import RandomGame from '../components/RandomGame'

export default function HomePage() {
  const { userId } = useAuth()
  const [games, setGames] = useState<Game[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [user, setUser] = useState<UserProfile | null>(null)
  const [listingCount, setListingCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([fetchGames(), fetchOrders(), fetchUser(), getMyListings(userId).catch(() => [])])
      .then(([g, o, u, l]) => { setGames(g); setOrders(o); setUser(u); setListingCount(l.length) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [userId])

  if (loading || !user) {
    return (
      <div className="flex-1 p-4 max-w-lg mx-auto w-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full skeleton" />
          <div className="flex-1"><div className="h-3 w-24 skeleton mb-1.5" /><div className="h-4 w-32 skeleton" /></div>
        </div>
        <div className="h-44 skeleton rounded-2xl mb-4" />
        <div className="h-24 skeleton rounded-2xl mb-6" />
        <div className="h-28 skeleton rounded-2xl" />
      </div>
    )
  }

  const activeOrder = orders.find(o => o.status === 'active') || null

  return (
    <div className="flex-1 nav-spacer max-w-lg mx-auto w-full overflow-y-auto">
      {/* Header */}
      <div className="px-5 pt-4 pb-3">
        <UserGreeting user={user} />
      </div>

      {/* ── HERO: Rental ── */}
      <div className="px-5 mb-4">
        {activeOrder ? (
          <ActiveRentalHero
            order={activeOrder}
            onOpen={() => navigate(`/rental/${activeOrder.id}`)}
            onBrowse={() => navigate('/games')}
          />
        ) : (
          <RentalHero onBrowse={() => navigate('/games')} />
        )}
      </div>

      {/* ── SECONDARY: Sell Account ── */}
      <div className="px-5 mb-6">
        {listingCount > 0 ? (
          <SellActiveCard count={listingCount} onManage={() => navigate('/my-listings')} />
        ) : (
          <SellCard onStart={() => navigate('/submit-account')} />
        )}
      </div>

      {/* ── Popular Games ── */}
      <PopularGames games={games} onSelect={(slug) => navigate(`/game/${slug}`)} />

      {/* ── Favorites ── */}
      <FavoritesSection games={games} onSelect={(slug) => navigate(`/game/${slug}`)} />

      {/* ── Random Game ── */}
      <div className="px-5 mt-6 mb-8">
        <RandomGame games={games} onSelect={(slug) => navigate(`/game/${slug}`)} />
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   HERO: No active rental
   ══════════════════════════════════════════════════════════ */

function RentalHero({ onBrowse }: { onBrowse: () => void }) {
  return (
    <div className="relative rounded-2xl overflow-hidden animate-fade-in">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/25 via-accent/10 to-surface-2" />
      <div className="absolute -top-10 -right-10 w-48 h-48 bg-accent/15 rounded-full blur-[60px]" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-accent/10 rounded-full blur-[40px]" />

      <div className="relative p-6 pb-7">
        <div className="text-4xl mb-3">🎮</div>
        <h2 className="text-xl font-bold mb-1.5">Во что сыграем сегодня?</h2>
        <p className="text-sm text-text-secondary mb-5 max-w-[260px]">
          Выберите игру и найдите аккаунт за пару минут.
        </p>
        <button
          onClick={onBrowse}
          className="w-full py-3.5 rounded-xl bg-accent text-white font-semibold text-sm active:opacity-80 transition-opacity shadow-lg shadow-accent/30"
        >
          🎮 Выбрать игру
        </button>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   HERO: Active rental
   ══════════════════════════════════════════════════════════ */

function ActiveRentalHero({ order, onOpen, onBrowse }: { order: Order; onOpen: () => void; onBrowse: () => void }) {
  const [timeLeft, setTimeLeft] = useState(calcTimeLeft(order.expires_at))
  const intervalRef = useRef<ReturnType<typeof setInterval>>()

  useEffect(() => {
    intervalRef.current = setInterval(() => setTimeLeft(calcTimeLeft(order.expires_at)), 60000)
    return () => clearInterval(intervalRef.current)
  }, [order.expires_at])

  return (
    <div className="rounded-2xl overflow-hidden border border-accent/20 glow-border animate-fade-in">
      <div className="bg-accent/10 px-4 py-2 flex items-center justify-between">
        <span className="text-xs font-medium text-accent">🎮 Сейчас играете</span>
        <span className="flex items-center gap-1.5 text-xs text-success">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          Активна
        </span>
      </div>

      <div className="p-4 bg-surface-2">
        <p className="text-xs text-text-muted mb-0.5">{order.game_name}</p>
        <p className="font-semibold text-sm mb-3">{order.account_title}</p>

        <div className="flex items-center gap-3 mb-4">
          <CountdownBlock value={timeLeft.days} label="дней" />
          <span className="text-text-muted text-lg font-light mt-[-18px]">:</span>
          <CountdownBlock value={timeLeft.hours} label="часов" />
          <span className="text-text-muted text-lg font-light mt-[-18px]">:</span>
          <CountdownBlock value={timeLeft.minutes} label="мин" />
        </div>

        <button
          onClick={onOpen}
          className="w-full py-3 rounded-xl bg-accent text-white font-semibold text-sm active:opacity-80 shadow-lg shadow-accent/25"
        >
          Открыть аренду
        </button>

        <button
          onClick={onBrowse}
          className="w-full mt-2 py-2.5 rounded-xl bg-surface-3 text-xs font-medium text-text-secondary active:bg-surface transition-colors"
        >
          🎮 Выбрать ещё игру
        </button>
      </div>
    </div>
  )
}

function CountdownBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex-1 text-center">
      <div className="text-2xl font-bold text-accent tabular-nums">{String(value).padStart(2, '0')}</div>
      <div className="text-[10px] text-text-muted uppercase tracking-wider">{label}</div>
    </div>
  )
}

function calcTimeLeft(expiresAt: string) {
  const diff = Math.max(0, new Date(expiresAt).getTime() - Date.now())
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
  }
}

/* ══════════════════════════════════════════════════════════
   SELL: First time
   ══════════════════════════════════════════════════════════ */

function SellCard({ onStart }: { onStart: () => void }) {
  return (
    <button
      onClick={onStart}
      className="w-full text-left rounded-2xl bg-surface-2 border border-white/5 overflow-hidden transition-all active:scale-[0.98] animate-fade-in"
    >
      <div className="flex items-center gap-4 p-4">
        <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center shrink-0">
          <span className="text-2xl">💰</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-bold">Сдать свой аккаунт</p>
            <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-warning/10 text-warning">Зарабатывайте</span>
          </div>
          <p className="text-xs text-text-muted">Получайте доход, когда не играете.</p>
        </div>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted shrink-0">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </button>
  )
}

/* ══════════════════════════════════════════════════════════
   SELL: Already has listings
   ══════════════════════════════════════════════════════════ */

function SellActiveCard({ count, onManage }: { count: number; onManage: () => void }) {
  return (
    <button
      onClick={onManage}
      className="w-full text-left rounded-2xl bg-surface-2 border border-white/5 overflow-hidden transition-all active:scale-[0.98] animate-fade-in"
    >
      <div className="flex items-center gap-4 p-4">
        <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
          <span className="text-2xl">💼</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold">Мои аккаунты</p>
          <p className="text-xs text-text-muted">{count} {count === 1 ? 'аккаунт' : 'аккаунтов'} на площадке</p>
        </div>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted shrink-0">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </button>
  )
}
