import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchOrderById, fetchOrderCredentials, fetchAccountById } from '../api'
import type { Order, AccountCredentials } from '../types'
import Header from '../components/Header'

const GAME_ICONS: Record<string, string> = {
  valorant: '🎯', fortnite: '🪂', cs2: '💥',
}

const EXTEND_OPTIONS = [
  { hours: 1, label: '+1 час' },
  { hours: 3, label: '+3 часа' },
  { hours: 5, label: '+5 часов' },
  { hours: 24, label: '+24 часа' },
]

export default function RentalDetailPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order | null>(null)
  const [creds, setCreds] = useState<AccountCredentials | null>(null)
  const [pricePerDay, setPricePerDay] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [showExtend, setShowExtend] = useState(false)
  const [extendSuccess, setExtendSuccess] = useState(false)

  const load = useCallback(() => {
    if (!orderId) return
    setLoading(true)
    setError(false)
    Promise.all([fetchOrderById(Number(orderId)), fetchOrderCredentials(Number(orderId))])
      .then(async ([o, c]) => {
        setOrder(o)
        setCreds(c)
        if (o) {
          const acc = await fetchAccountById(o.account_id)
          if (acc) setPricePerDay(acc.account.price_per_day)
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [orderId])

  useEffect(() => { load() }, [load])

  const handleExtend = useCallback((hours: number) => {
    if (!order) return
    const newExpires = new Date(new Date(order.expires_at).getTime() + hours * 3600000).toISOString()
    setOrder(prev => prev ? { ...prev, expires_at: newExpires } : prev)
    setShowExtend(false)
    setExtendSuccess(true)
    setTimeout(() => setExtendSuccess(false), 3000)
  }, [order])

  if (loading) return <LoadingState />
  if (error) return <ErrorState onRetry={load} />
  if (!order) return <ErrorState onRetry={load} />

  const isExpired = order.status === 'completed' || new Date(order.expires_at).getTime() <= Date.now()

  if (isExpired) return <ExpiredState gameName={order.game_name} onBrowse={() => navigate('/games')} />

  return (
    <div className="flex-1 max-w-lg mx-auto w-full flex flex-col">
      <Header title="Ваша аренда" showBack />

      <div className="flex-1 overflow-y-auto px-5 pt-2 nav-spacer space-y-5">
        {/* Success toast */}
        {extendSuccess && (
          <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
            <div className="bg-success/90 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg backdrop-blur-sm">
              ✅ Аренда продлена
            </div>
          </div>
        )}

        {/* Game info + status */}
        <div className="flex items-center gap-3 animate-fade-in">
          <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center text-xl">
            {GAME_ICONS[order.game_slug] || '🎮'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-text-muted">Аренда аккаунта</p>
            <p className="font-semibold truncate">{order.game_name}</p>
          </div>
          <span className="flex items-center gap-1.5 text-[10px] font-medium text-success bg-success/10 px-2.5 py-1 rounded-full shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            АКТИВНА
          </span>
        </div>

        {/* Countdown */}
        <CountdownCard expiresAt={order.expires_at} />

        {/* Extend button */}
        <button
          onClick={() => setShowExtend(true)}
          className="w-full py-3 rounded-xl bg-surface-2 border border-accent/20 text-sm font-medium text-accent active:bg-surface-3 transition-colors"
        >
          ⏱ Продлить аренду
        </button>

        {/* Credentials */}
        {creds && <CredentialsCard credentials={creds} />}

        {/* How to use */}
        <InstructionsCard />

        {/* CTA */}
        <button
          onClick={() => navigate('/games')}
          className="w-full py-3.5 rounded-xl bg-surface-2 border border-white/5 text-sm font-medium text-text-secondary active:bg-surface-3 transition-colors"
        >
          🎮 Выбрать другую игру
        </button>
      </div>

      {/* Extend Modal */}
      {showExtend && (
        <ExtendModal
          pricePerDay={pricePerDay}
          onSelect={handleExtend}
          onClose={() => setShowExtend(false)}
        />
      )}
    </div>
  )
}

/* ── Extend Modal ── */

function ExtendModal({ pricePerDay, onSelect, onClose }: { pricePerDay: number; onSelect: (hours: number) => void; onClose: () => void }) {
  const [selected, setSelected] = useState<number | null>(null)
  const [confirming, setConfirming] = useState(false)

  const pricePerHour = pricePerDay / 24

  const handleConfirm = () => {
    if (selected !== null) {
      onSelect(selected)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Sheet */}
      <div
        className="relative w-full max-w-lg bg-surface rounded-t-2xl p-5 animate-slide-up"
        style={{ paddingBottom: 'max(24px, calc(env(safe-area-inset-bottom, 0px) + 16px))' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-9 h-1 bg-surface-3 rounded-full mx-auto mb-4" />

        {!confirming ? (
          <>
            <h3 className="text-lg font-bold mb-1">Продлить аренду</h3>
            <p className="text-sm text-text-secondary mb-4">Выберите срок продления</p>

            <div className="space-y-2 mb-5">
              {EXTEND_OPTIONS.map(opt => {
                const price = Math.ceil(pricePerHour * opt.hours)
                const isSelected = selected === opt.hours
                return (
                  <button
                    key={opt.hours}
                    onClick={() => setSelected(opt.hours)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-accent/10 border-accent/30'
                        : 'bg-surface-2 border-white/5 active:bg-surface-3'
                    }`}
                  >
                    <span className="font-medium text-sm">{opt.label}</span>
                    <span className={`font-bold ${isSelected ? 'text-accent' : 'text-text-secondary'}`}>{price}₽</span>
                  </button>
                )
              })}
            </div>

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-3.5 rounded-xl bg-surface-2 border border-white/5 text-sm font-medium text-text-secondary active:bg-surface-3 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={() => selected !== null && setConfirming(true)}
                disabled={selected === null}
                className="flex-1 py-3.5 rounded-xl bg-accent text-white text-sm font-semibold active:opacity-80 transition-opacity shadow-lg shadow-accent/25 disabled:opacity-30 disabled:shadow-none"
              >
                Далее
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="text-center py-4">
              <div className="text-3xl mb-3">⏱</div>
              <p className="text-base font-bold mb-1">Подтверждение</p>
              <p className="text-sm text-text-secondary">
                Продлить аренду на {EXTEND_OPTIONS.find(o => o.hours === selected)?.label.replace('+', '')} за{' '}
                <span className="text-accent font-bold">{Math.ceil(pricePerHour * selected!)}₽</span>?
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setConfirming(false)}
                className="flex-1 py-3.5 rounded-xl bg-surface-2 border border-white/5 text-sm font-medium text-text-secondary active:bg-surface-3 transition-colors"
              >
                Назад
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-3.5 rounded-xl bg-accent text-white text-sm font-semibold active:opacity-80 transition-opacity shadow-lg shadow-accent/25"
              >
                Продлить
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/* ── Countdown ── */

function CountdownCard({ expiresAt }: { expiresAt: string }) {
  const [time, setTime] = useState(calcTime(expiresAt))
  const intervalRef = useRef<ReturnType<typeof setInterval>>()

  useEffect(() => {
    intervalRef.current = setInterval(() => setTime(calcTime(expiresAt)), 1000)
    return () => clearInterval(intervalRef.current)
  }, [expiresAt])

  const isLow = time.totalMs < 3600000
  const expiresDate = new Date(expiresAt)
  const timeStr = expiresDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className={`rounded-2xl p-5 text-center animate-slide-up border ${isLow ? 'bg-warning/5 border-warning/20' : 'bg-surface-2 border-white/5'}`}>
      <p className="text-xs text-text-muted mb-1">Осталось</p>

      <div className="flex items-center justify-center gap-1 mb-2">
        <TimeBlock value={time.hours} />
        <span className="text-2xl text-text-muted font-light">:</span>
        <TimeBlock value={time.minutes} />
        <span className="text-2xl text-text-muted font-light">:</span>
        <TimeBlock value={time.seconds} />
      </div>

      {isLow && (
        <p className="text-xs text-warning font-medium mb-1">⚠️ Скоро закончится</p>
      )}

      <p className="text-[11px] text-text-muted">
        Аренда действует до {timeStr}
      </p>
    </div>
  )
}

function TimeBlock({ value }: { value: number }) {
  return (
    <div className="w-16">
      <span className="text-3xl font-bold text-accent tabular-nums">
        {String(value).padStart(2, '0')}
      </span>
    </div>
  )
}

function calcTime(expiresAt: string) {
  const diff = Math.max(0, new Date(expiresAt).getTime() - Date.now())
  return {
    totalMs: diff,
    hours: Math.floor(diff / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  }
}

/* ── Credentials ── */

function CredentialsCard({ credentials }: { credentials: AccountCredentials }) {
  const [showPassword, setShowPassword] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const copy = useCallback(async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.left = '-9999px'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }, [])

  const copyAll = useCallback(() => {
    copy(`Login: ${credentials.login}\nPassword: ${credentials.password}`, 'all')
  }, [credentials, copy])

  return (
    <div className="rounded-2xl bg-surface-2 border border-accent/15 overflow-hidden animate-slide-up glow-border" style={{ animationDelay: '100ms' }}>
      <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
        <span className="text-sm">🔐</span>
        <span className="text-sm font-semibold">Данные аккаунта</span>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1.5">Логин</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-surface-3 rounded-lg px-3 py-2.5 font-mono text-sm truncate">
              {credentials.login}
            </div>
            <CopyButton onClick={() => copy(credentials.login, 'login')} copied={copiedField === 'login'} />
          </div>
        </div>

        <div>
          <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1.5">Пароль</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-surface-3 rounded-lg px-3 py-2.5 font-mono text-sm truncate">
              {showPassword ? credentials.password : '•'.repeat(credentials.password.length)}
            </div>
            <button
              onClick={() => setShowPassword(v => !v)}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-surface-3 text-text-secondary active:bg-surface transition-colors shrink-0"
            >
              {showPassword ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
            <CopyButton onClick={() => copy(credentials.password, 'password')} copied={copiedField === 'password'} />
          </div>
        </div>

        <button
          onClick={copyAll}
          className={`w-full py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] ${
            copiedField === 'all' ? 'bg-success/20 text-success' : 'bg-accent text-white shadow-lg shadow-accent/25'
          }`}
        >
          {copiedField === 'all' ? '✓ Скопировано' : '📋 Скопировать данные'}
        </button>

        <div className="flex items-center justify-center gap-1.5 pt-1">
          <span className="w-1.5 h-1.5 rounded-full bg-success" />
          <span className="text-[11px] text-text-muted">Аккаунт готов к использованию</span>
        </div>
      </div>
    </div>
  )
}

function CopyButton({ onClick, copied }: { onClick: () => void; copied: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-9 h-9 flex items-center justify-center rounded-lg shrink-0 transition-colors active:scale-95 ${
        copied ? 'bg-success/20 text-success' : 'bg-surface-3 text-text-secondary active:bg-surface'
      }`}
    >
      {copied ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
    </button>
  )
}

/* ── Instructions ── */

function InstructionsCard() {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-xl bg-surface-2 border border-white/5 overflow-hidden animate-fade-in" style={{ animationDelay: '200ms' }}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full px-4 py-3 flex items-center justify-between text-sm text-text-secondary"
      >
        <span>ℹ️ Как войти?</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${open ? 'rotate-180' : ''}`}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="px-4 pb-3 text-xs text-text-muted space-y-1.5 animate-fade-in">
          <p>1. Скопируйте логин</p>
          <p>2. Скопируйте пароль</p>
          <p>3. Откройте игру</p>
          <p>4. Введите данные аккаунта</p>
          <p>5. Начните играть</p>
        </div>
      )}
    </div>
  )
}

/* ── States ── */

function LoadingState() {
  return (
    <div className="flex-1 max-w-lg mx-auto w-full">
      <Header title="Загрузка..." showBack />
      <div className="p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl skeleton" />
          <div className="flex-1"><div className="h-3 w-20 skeleton mb-1.5" /><div className="h-4 w-32 skeleton" /></div>
        </div>
        <div className="h-28 skeleton rounded-2xl" />
        <div className="h-40 skeleton rounded-2xl" />
      </div>
    </div>
  )
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex-1 max-w-lg mx-auto w-full">
      <Header title="Ошибка" showBack />
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="text-4xl mb-4">😕</div>
        <p className="text-sm text-text-secondary mb-4 text-center">Не удалось загрузить данные аренды</p>
        <button onClick={onRetry} className="px-6 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold active:opacity-80 transition-opacity">
          Повторить
        </button>
      </div>
    </div>
  )
}

function ExpiredState({ gameName, onBrowse }: { gameName: string; onBrowse: () => void }) {
  return (
    <div className="flex-1 max-w-lg mx-auto w-full">
      <Header title="Аренда завершена" showBack />
      <div className="flex flex-col items-center justify-center py-20 px-4 animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-surface-2 flex items-center justify-center mb-4">
          <span className="text-3xl">⏱</span>
        </div>
        <p className="text-lg font-bold mb-1">Аренда завершена</p>
        <p className="text-sm text-text-secondary mb-6">{gameName}</p>
        <button onClick={onBrowse} className="w-full max-w-xs py-3.5 rounded-xl bg-accent text-white font-semibold text-sm active:opacity-80 transition-opacity shadow-lg shadow-accent/25">
          🎮 Выбрать новую игру
        </button>
      </div>
    </div>
  )
}
