import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchGames, fetchUser } from '../api'
import { fetchMyRentals } from '../api/server'
import type { Game, Rental, UserProfile } from '../types'
import UserGreeting from '../components/UserGreeting'
import PopularGames from '../components/PopularGames'
import FavoritesSection from '../components/FavoritesSection'
import RandomGame from '../components/RandomGame'

export default function HomePage() {
  const [games, setGames] = useState<Game[]>([])
  const [rentals, setRentals] = useState<Rental[]>([])
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([fetchGames(), fetchUser(), fetchMyRentals()])
      .then(([g, u, r]) => { setGames(g); setUser(u as UserProfile); setRentals(r) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading || !user) {
    return (
      <div className="flex-1 p-4 max-w-lg mx-auto w-full">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-full skeleton" />
          <div className="flex-1"><div className="h-3 w-20 skeleton mb-1.5" /><div className="h-4 w-28 skeleton" /></div>
        </div>
        <div className="h-36 skeleton rounded-2xl mb-4" />
        <div className="h-16 skeleton rounded-xl" />
      </div>
    )
  }

  const activeRental = rentals.find(r => r.status === 'active' && r.renter_id === user.id) || null

  return (
    <div className="flex-1 nav-spacer max-w-lg mx-auto w-full overflow-y-auto">
      {/* Greeting */}
      <div className="px-5 pt-3 pb-2">
        <UserGreeting user={user} />
      </div>

      {/* Hero */}
      <div className="px-5 mb-3">
        {activeRental ? (
          <ActiveRentalHero rental={activeRental} onOpen={() => navigate(`/rental/${activeRental.id}`)} onBrowse={() => navigate('/games')} />
        ) : (
          <RentalHero onBrowse={() => navigate('/games')} />
        )}
      </div>

      {/* Sell CTA */}
      <div className="px-5 mb-5">
        <SellCard onStart={() => navigate('/submit-account')} />
      </div>

      {/* Popular Games */}
      <PopularGames games={games} onSelect={slug => navigate(`/game/${slug}`)} />

      {/* Favorites */}
      <FavoritesSection games={games} onSelect={slug => navigate(`/game/${slug}`)} />

      {/* Random */}
      <div className="px-5 mt-4 mb-8">
        <RandomGame games={games} onSelect={slug => navigate(`/game/${slug}`)} />
      </div>
    </div>
  )
}

/* ── Hero: No rental ── */

function RentalHero({ onBrowse }: { onBrowse: () => void }) {
  return (
    <div className="relative rounded-2xl overflow-hidden animate-fade-in">
      <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-accent/5 to-transparent" />
      <div className="absolute -top-16 -right-16 w-40 h-40 bg-accent/10 rounded-full blur-[50px]" />
      <div className="relative px-5 py-5">
        <h2 className="text-[22px] font-bold leading-tight mb-1">Во что сыграем сегодня?</h2>
        <p className="text-[13px] text-text-secondary/80 mb-4">Найдите аккаунт за пару минут.</p>
        <button
          onClick={onBrowse}
          className="w-full py-3 rounded-xl bg-accent text-white font-semibold text-[13px] active:opacity-80 transition-opacity shadow-lg shadow-accent/25"
        >
          Выбрать игру
        </button>
      </div>
    </div>
  )
}

/* ── Hero: Active rental ── */

function ActiveRentalHero({ rental, onOpen, onBrowse }: { rental: Rental; onOpen: () => void; onBrowse: () => void }) {
  const [timeLeft, setTimeLeft] = useState(calcTime(rental.expires_at))
  useEffect(() => { const i = setInterval(() => setTimeLeft(calcTime(rental.expires_at)), 1000); return () => clearInterval(i) }, [rental.expires_at])

  return (
    <div className="rounded-2xl overflow-hidden border border-accent/15 animate-fade-in">
      <div className="bg-accent/8 px-4 py-2 flex items-center justify-between">
        <span className="text-[11px] font-medium text-accent">Сейчас играете</span>
        <span className="flex items-center gap-1.5 text-[11px] text-success">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          Активна
        </span>
      </div>
      <div className="p-4 bg-surface-2">
        <p className="text-[11px] text-text-muted mb-0.5">{rental.game_name}</p>
        <p className="font-semibold text-sm mb-3">{rental.account_title}</p>
        <div className="flex items-center gap-2 mb-3">
          <CountdownBlock value={timeLeft.hours} label="ч" />
          <span className="text-text-muted text-lg font-light mt-[-14px]">:</span>
          <CountdownBlock value={timeLeft.minutes} label="м" />
          <span className="text-text-muted text-lg font-light mt-[-14px]">:</span>
          <CountdownBlock value={timeLeft.seconds} label="с" />
        </div>
        <button onClick={onOpen} className="w-full py-3 rounded-xl bg-accent text-white font-semibold text-[13px] active:opacity-80 shadow-lg shadow-accent/20">
          Открыть аренду
        </button>
        <button onClick={onBrowse} className="w-full mt-2 py-2.5 rounded-xl bg-surface-3/60 text-[12px] font-medium text-text-secondary active:bg-surface-3 transition-colors">
          Выбрать другую игру
        </button>
      </div>
    </div>
  )
}

function CountdownBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex-1 text-center">
      <div className="text-[22px] font-bold text-accent tabular-nums leading-none">{String(value).padStart(2, '0')}</div>
      <div className="text-[9px] text-text-muted uppercase tracking-wider mt-1">{label}</div>
    </div>
  )
}

function calcTime(expiresAt: string) {
  const diff = Math.max(0, new Date(expiresAt).getTime() - Date.now())
  return { hours: Math.floor(diff / 3600000), minutes: Math.floor((diff % 3600000) / 60000), seconds: Math.floor((diff % 60000) / 1000) }
}

/* ── Sell CTA ── */

function SellCard({ onStart }: { onStart: () => void }) {
  return (
    <button
      onClick={onStart}
      className="w-full text-left rounded-xl bg-surface-2/60 border border-white/[0.04] overflow-hidden transition-all active:scale-[0.98] animate-fade-in"
    >
      <div className="flex items-center gap-3.5 px-4 py-3">
        <div className="w-9 h-9 rounded-lg bg-accent/8 flex items-center justify-center shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-accent">
            <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[13px] font-semibold">Сдать свой аккаунт</p>
            <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-accent/8 text-accent">Доход</span>
          </div>
          <p className="text-[11px] text-text-muted mt-0.5">Получайте доход, когда не играете</p>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted/50 shrink-0">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </button>
  )
}
