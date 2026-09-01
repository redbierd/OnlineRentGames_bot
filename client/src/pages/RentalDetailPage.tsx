import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchRental, extendRental } from '../api/server'
import { useAuth } from '../hooks/useAuth'
import type { Rental } from '../types'
import Header from '../components/Header'

const EXTEND_OPTIONS = [
  { hours: 1, label: '+1 час' },
  { hours: 3, label: '+3 часа' },
  { hours: 5, label: '+5 часов' },
  { hours: 24, label: '+24 часа' },
]

export default function RentalDetailPage() {
  const { rentalId } = useParams<{ rentalId: string }>()
  const { userId } = useAuth()
  const navigate = useNavigate()
  const [rental, setRental] = useState<Rental | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showExtend, setShowExtend] = useState(false)
  const [toast, setToast] = useState('')

  const load = useCallback(() => {
    if (!rentalId) { setLoading(false); setError('ID аренды не указан'); return }
    setLoading(true)
    setError('')
    fetchRental(Number(rentalId))
      .then(r => {
        if (r) { setRental(r) }
        else { setError('Не удалось загрузить данные аренды. Попробуйте ещё раз.') }
      })
      .catch(() => setError('Ошибка соединения с сервером'))
      .finally(() => setLoading(false))
  }, [rentalId])

  useEffect(() => { load() }, [load])

  const notify = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const handleExtend = async (hours: number) => {
    if (!rental) return
    try { await extendRental(rental.id, hours); setShowExtend(false); load(); notify(`Продлено на ${hours}ч`) } catch { notify('Ошибка') }
  }

  if (loading) {
    return (
      <div className="flex-1 max-w-lg mx-auto w-full">
        <Header title="Загрузка..." showBack />
        <div className="p-5 space-y-4">
          <div className="h-28 skeleton rounded-xl" />
          <div className="h-40 skeleton rounded-xl" />
        </div>
      </div>
    )
  }

  if (error || !rental) {
    return (
      <div className="flex-1 max-w-lg mx-auto w-full">
        <Header title="Ошибка" showBack />
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="w-14 h-14 rounded-full bg-danger/10 flex items-center justify-center mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-danger">
              <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <p className="text-[13px] text-text-secondary text-center mb-2">{error || 'Аренда не найдена'}</p>
          <p className="text-[11px] text-text-muted mb-6">ID: {rentalId}</p>
          <div className="flex gap-3">
            <button onClick={load} className="px-5 py-2.5 btn-secondary text-[13px]">Повторить</button>
            <button onClick={() => navigate('/rentals')} className="px-5 py-2.5 btn-primary text-[13px]">Мои аренды</button>
          </div>
        </div>
      </div>
    )
  }

  const isExpired = rental.status === 'completed'

  if (isExpired) {
    return (
      <div className="flex-1 max-w-lg mx-auto w-full">
        <Header title="Аренда завершена" showBack />
        <div className="flex flex-col items-center justify-center py-16 px-4 animate-fade-in">
          <div className="w-14 h-14 rounded-full bg-surface-2 flex items-center justify-center mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-muted">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <p className="text-lg font-bold mb-1">Аренда завершена</p>
          <p className="text-sm text-text-secondary mb-6">{rental.game_name} · {rental.account_title}</p>
          <button onClick={() => navigate('/games')} className="px-6 py-3 btn-primary text-sm">
            Выбрать игру
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 max-w-lg mx-auto w-full flex flex-col">
      <Header title="Аренда" showBack />

      <div className="flex-1 overflow-y-auto px-5 pt-2 pb-6 space-y-4">
        {toast && (
          <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-surface-2 border border-white/10 text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg animate-slide-up">
            {toast}
          </div>
        )}

        {/* Status */}
        <div className="flex items-center gap-3 animate-fade-in">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-accent">
              <rect x="2" y="6" width="20" height="12" rx="3" />
              <line x1="6" y1="12" x2="10" y2="12" />
              <line x1="8" y1="10" x2="8" y2="14" />
              <circle cx="15" cy="12" r="1" fill="currentColor" />
              <circle cx="18" cy="10" r="1" fill="currentColor" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-text-muted">{rental.game_name}</p>
            <p className="font-semibold text-sm truncate">{rental.account_title}</p>
          </div>
          <span className="flex items-center gap-1.5 text-[11px] text-success font-medium shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            Активна
          </span>
        </div>

        {/* Countdown */}
        <CountdownCard expiresAt={rental.expires_at} />

        {/* Extend */}
        <button
          onClick={() => setShowExtend(true)}
          className="w-full py-3 btn-secondary text-[13px] font-medium text-accent"
        >
          Продлить аренду
        </button>

        {/* Credentials */}
        <CredentialsCard login={rental.credentials?.login || '—'} password={rental.credentials?.password || '—'} />

        {/* Info */}
        <div className="card p-4 text-[13px] space-y-1.5 animate-fade-in">
          <div className="flex justify-between"><span className="text-text-muted">Оплачено</span><span className="font-medium">{rental.hours}ч · {rental.price}₽</span></div>
          <div className="flex justify-between"><span className="text-text-muted">Начало</span><span>{new Date(rental.started_at).toLocaleString('ru-RU')}</span></div>
        </div>
      </div>

      {/* Extend Modal */}
      {showExtend && (
        <ExtendModal pricePerHour={rental.price / rental.hours} onSelect={handleExtend} onClose={() => setShowExtend(false)} />
      )}
    </div>
  )
}

/* ── Countdown ── */

function CountdownCard({ expiresAt }: { expiresAt: string }) {
  const [time, setTime] = useState(calc(expiresAt))
  useEffect(() => { const i = setInterval(() => setTime(calc(expiresAt)), 1000); return () => clearInterval(i) }, [expiresAt])
  const isLow = time.total < 3600000

  return (
    <div className={`rounded-2xl p-5 text-center animate-slide-up border ${isLow ? 'bg-warning/5 border-warning/15' : 'bg-surface-2 border-white/[0.04]'}`}>
      <p className="text-[11px] text-text-muted mb-2">Осталось</p>
      <div className="flex items-center justify-center gap-1 mb-2">
        <TimeBlock value={time.h} />
        <span className="text-2xl text-text-muted/30 font-light">:</span>
        <TimeBlock value={time.m} />
        <span className="text-2xl text-text-muted/30 font-light">:</span>
        <TimeBlock value={time.s} />
      </div>
      {isLow && <p className="text-[11px] text-warning font-medium mb-1">Скоро закончится</p>}
      <p className="text-[11px] text-text-muted">До {new Date(expiresAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</p>
    </div>
  )
}

function TimeBlock({ value }: { value: number }) {
  return (
    <div className="w-16">
      <span className="text-3xl font-bold text-accent tabular-nums">{String(value).padStart(2, '0')}</span>
    </div>
  )
}

function calc(expiresAt: string) {
  const diff = Math.max(0, new Date(expiresAt).getTime() - Date.now())
  return { total: diff, h: Math.floor(diff / 3600000), m: Math.floor((diff % 3600000) / 60000), s: Math.floor((diff % 60000) / 1000) }
}

/* ── Credentials ── */

function CredentialsCard({ login, password }: { login: string; password: string }) {
  const [show, setShow] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  const copy = async (text: string, field: string) => {
    try { await navigator.clipboard.writeText(text) }
    catch {
      const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.left = '-9999px'
      document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta)
    }
    setCopied(field); setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="card overflow-hidden animate-fade-in">
      <div className="px-4 py-3 border-b border-white/[0.04] flex items-center gap-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-accent">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <span className="text-[13px] font-semibold">Данные аккаунта</span>
      </div>
      <div className="p-4 space-y-3">
        <div>
          <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1.5 font-medium">Логин</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-surface-3 rounded-lg px-3 py-2.5 font-mono text-[13px] truncate">{login}</div>
            <CopyBtn onClick={() => copy(login, 'login')} copied={copied === 'login'} />
          </div>
        </div>
        <div>
          <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1.5 font-medium">Пароль</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-surface-3 rounded-lg px-3 py-2.5 font-mono text-[13px] truncate">
              {show ? password : '•'.repeat(Math.min(password.length, 16))}
            </div>
            <button onClick={() => setShow(v => !v)} className="w-9 h-9 flex items-center justify-center rounded-lg bg-surface-3 text-text-secondary shrink-0">
              {show ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
              )}
            </button>
            <CopyBtn onClick={() => copy(password, 'password')} copied={copied === 'password'} />
          </div>
        </div>
      </div>
    </div>
  )
}

function CopyBtn({ onClick, copied }: { onClick: () => void; copied: boolean }) {
  return (
    <button onClick={onClick} className={`w-9 h-9 flex items-center justify-center rounded-lg shrink-0 transition-colors ${copied ? 'bg-success/15 text-success' : 'bg-surface-3 text-text-secondary'}`}>
      {copied ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
      )}
    </button>
  )
}

/* ── Extend Modal ── */

function ExtendModal({ pricePerHour, onSelect, onClose }: { pricePerHour: number; onSelect: (h: number) => void; onClose: () => void }) {
  const [selected, setSelected] = useState<number | null>(null)
  const [confirming, setConfirming] = useState(false)

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg bg-surface rounded-t-2xl p-5 animate-slide-up" style={{ paddingBottom: 'max(24px, calc(env(safe-area-inset-bottom, 0px) + 16px))' }} onClick={e => e.stopPropagation()}>
        <div className="w-9 h-1 bg-surface-3 rounded-full mx-auto mb-5" />
        {!confirming ? (
          <>
            <h3 className="text-lg font-bold mb-1">Продлить аренду</h3>
            <p className="text-[13px] text-text-secondary mb-4">Выберите срок</p>
            <div className="space-y-2 mb-5">
              {EXTEND_OPTIONS.map(o => {
                const price = Math.ceil(pricePerHour * o.hours)
                return (
                  <button key={o.hours} onClick={() => setSelected(o.hours)} className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${selected === o.hours ? 'bg-accent/10 border-accent/25' : 'bg-surface-2 border-white/[0.04]'}`}>
                    <span className="font-medium text-[13px]">{o.label}</span>
                    <span className={`font-bold text-[13px] ${selected === o.hours ? 'text-accent' : 'text-text-secondary'}`}>{price}₽</span>
                  </button>
                )
              })}
            </div>
            <div className="flex gap-2">
              <button onClick={onClose} className="flex-1 py-3.5 btn-secondary text-[13px]">Отмена</button>
              <button onClick={() => selected && setConfirming(true)} disabled={!selected} className="flex-1 py-3.5 btn-primary text-[13px] disabled:opacity-30 disabled:shadow-none">Далее</button>
            </div>
          </>
        ) : (
          <>
            <div className="text-center py-4">
              <div className="text-3xl mb-3">⏱</div>
              <p className="text-base font-bold mb-1">Подтверждение</p>
              <p className="text-[13px] text-text-secondary">Продлить на {EXTEND_OPTIONS.find(o => o.hours === selected)?.label.replace('+', '')} за <span className="text-accent font-bold">{Math.ceil(pricePerHour * selected!)}₽</span>?</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setConfirming(false)} className="flex-1 py-3.5 btn-secondary text-[13px]">Назад</button>
              <button onClick={() => onSelect(selected!)} className="flex-1 py-3.5 btn-primary text-[13px]">Продлить</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
