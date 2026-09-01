import { useEffect, useState, useRef, useCallback } from 'react'
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
  const [showExtend, setShowExtend] = useState(false)
  const [toast, setToast] = useState('')

  const load = useCallback(() => {
    if (!rentalId) return
    fetchRental(Number(rentalId)).then(setRental).finally(() => setLoading(false))
  }, [rentalId])

  useEffect(() => { load() }, [load])

  const notify = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const handleExtend = async (hours: number) => {
    if (!rental) return
    try { await extendRental(rental.id, hours); setShowExtend(false); load(); notify(`✅ Продлено на ${hours}ч`) } catch { notify('❌ Ошибка') }
  }

  if (loading) return <div className="flex-1 max-w-lg mx-auto w-full"><Header title="Загрузка..." showBack /><div className="p-5 space-y-4"><div className="h-28 skeleton rounded-xl" /><div className="h-40 skeleton rounded-xl" /></div></div>
  if (!rental) return <div className="flex-1 max-w-lg mx-auto w-full"><Header title="Ошибка" showBack /><p className="p-4 text-center text-text-muted">Аренда не найдена</p></div>

  const isRenter = rental.renter_id === userId
  const isExpired = rental.status === 'completed'

  if (isExpired) {
    return (
      <div className="flex-1 max-w-lg mx-auto w-full">
        <Header title="Аренда завершена" showBack />
        <div className="flex flex-col items-center justify-center py-16 px-4 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-surface-2 flex items-center justify-center mb-4"><span className="text-3xl">⏱</span></div>
          <p className="text-lg font-bold mb-1">Аренда завершена</p>
          <p className="text-sm text-text-secondary mb-6">{rental.game_name} · {rental.account_title}</p>
          <button onClick={() => navigate('/games')} className="px-6 py-3 rounded-xl bg-accent text-white text-sm font-semibold active:opacity-80">🎮 Выбрать игру</button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 max-w-lg mx-auto w-full flex flex-col">
      <Header title="Аренда" showBack />
      <div className="flex-1 overflow-y-auto px-5 pt-2 pb-6 space-y-5">
        {toast && <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-surface-2 border border-white/10 text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg animate-slide-up">{toast}</div>}

        <div className="flex items-center gap-3 animate-fade-in">
          <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center text-xl">🎮</div>
          <div className="flex-1"><p className="text-xs text-text-muted">{rental.game_name}</p><p className="font-semibold">{rental.account_title}</p></div>
          <span className="flex items-center gap-1.5 text-[10px] font-medium text-success bg-success/10 px-2.5 py-1 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />Активна</span>
        </div>

        <CountdownCard expiresAt={rental.expires_at} />

        {isRenter && (
          <button onClick={() => setShowExtend(true)} className="w-full py-3 rounded-xl bg-surface-2 border border-accent/20 text-sm font-medium text-accent active:bg-surface-3">⏱ Продлить аренду</button>
        )}

        {isRenter && <CredentialsCard login="hidden" password="hidden" />}

        <div className="rounded-xl bg-surface-2 border border-white/5 p-4 text-sm animate-fade-in">
          <p><span className="text-text-muted">Оплачено:</span> <span className="font-medium">{rental.hours}ч · {rental.price}₽</span></p>
          <p><span className="text-text-muted">Начало:</span> {new Date(rental.started_at).toLocaleString('ru-RU')}</p>
        </div>
      </div>

      {showExtend && (
        <ExtendModal pricePerHour={rental.price / rental.hours} onSelect={handleExtend} onClose={() => setShowExtend(false)} />
      )}
    </div>
  )
}

function CountdownCard({ expiresAt }: { expiresAt: string }) {
  const [time, setTime] = useState(calc(expiresAt))
  useEffect(() => { const i = setInterval(() => setTime(calc(expiresAt)), 1000); return () => clearInterval(i) }, [expiresAt])
  const isLow = time.total < 3600000

  return (
    <div className={`rounded-2xl p-5 text-center animate-slide-up border ${isLow ? 'bg-warning/5 border-warning/20' : 'bg-surface-2 border-white/5'}`}>
      <p className="text-xs text-text-muted mb-1">Осталось</p>
      <div className="flex items-center justify-center gap-1 mb-2">
        <TimeBlock value={time.h} /><span className="text-2xl text-text-muted font-light">:</span>
        <TimeBlock value={time.m} /><span className="text-2xl text-text-muted font-light">:</span>
        <TimeBlock value={time.s} />
      </div>
      {isLow && <p className="text-xs text-warning font-medium mb-1">⚠️ Скоро закончится</p>}
      <p className="text-[11px] text-text-muted">До {new Date(expiresAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</p>
    </div>
  )
}

function TimeBlock({ value }: { value: number }) {
  return <div className="w-16"><span className="text-3xl font-bold text-accent tabular-nums">{String(value).padStart(2, '0')}</span></div>
}

function calc(expiresAt: string) {
  const diff = Math.max(0, new Date(expiresAt).getTime() - Date.now())
  return { total: diff, h: Math.floor(diff / 3600000), m: Math.floor((diff % 3600000) / 60000), s: Math.floor((diff % 60000) / 1000) }
}

function CredentialsCard({ login, password }: { login: string; password: string }) {
  const [show, setShow] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  const copy = async (text: string, field: string) => {
    try { await navigator.clipboard.writeText(text) } catch { const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.left = '-9999px'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta) }
    setCopied(field); setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="rounded-2xl bg-surface-2 border border-accent/15 overflow-hidden animate-slide-up glow-border">
      <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2"><span className="text-sm">🔐</span><span className="text-sm font-semibold">Данные аккаунта</span></div>
      <div className="p-4 space-y-3">
        <div>
          <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1.5">Логин</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-surface-3 rounded-lg px-3 py-2.5 font-mono text-sm truncate">{login}</div>
            <CopyBtn onClick={() => copy(login, 'login')} copied={copied === 'login'} />
          </div>
        </div>
        <div>
          <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1.5">Пароль</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-surface-3 rounded-lg px-3 py-2.5 font-mono text-sm truncate">{show ? password : '•'.repeat(password.length)}</div>
            <button onClick={() => setShow(v => !v)} className="w-9 h-9 flex items-center justify-center rounded-lg bg-surface-3 text-text-secondary">{show ? '🙈' : '👁'}</button>
            <CopyBtn onClick={() => copy(password, 'password')} copied={copied === 'password'} />
          </div>
        </div>
      </div>
    </div>
  )
}

function CopyBtn({ onClick, copied }: { onClick: () => void; copied: boolean }) {
  return <button onClick={onClick} className={`w-9 h-9 flex items-center justify-center rounded-lg shrink-0 ${copied ? 'bg-success/20 text-success' : 'bg-surface-3 text-text-secondary'}`}>{copied ? '✓' : '📋'}</button>
}

function ExtendModal({ pricePerHour, onSelect, onClose }: { pricePerHour: number; onSelect: (h: number) => void; onClose: () => void }) {
  const [selected, setSelected] = useState<number | null>(null)
  const [confirming, setConfirming] = useState(false)

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg bg-surface rounded-t-2xl p-5 animate-slide-up" style={{ paddingBottom: 'max(24px, calc(env(safe-area-inset-bottom, 0px) + 16px))' }} onClick={e => e.stopPropagation()}>
        <div className="w-9 h-1 bg-surface-3 rounded-full mx-auto mb-4" />
        {!confirming ? (
          <>
            <h3 className="text-lg font-bold mb-1">Продлить аренду</h3>
            <p className="text-sm text-text-secondary mb-4">Выберите срок</p>
            <div className="space-y-2 mb-5">
              {EXTEND_OPTIONS.map(o => {
                const price = Math.ceil(pricePerHour * o.hours)
                return <button key={o.hours} onClick={() => setSelected(o.hours)} className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${selected === o.hours ? 'bg-accent/10 border-accent/30' : 'bg-surface-2 border-white/5'}`}><span className="font-medium text-sm">{o.label}</span><span className={`font-bold ${selected === o.hours ? 'text-accent' : 'text-text-secondary'}`}>{price}₽</span></button>
              })}
            </div>
            <div className="flex gap-2">
              <button onClick={onClose} className="flex-1 py-3.5 rounded-xl bg-surface-2 border border-white/5 text-sm font-medium text-text-secondary">Отмена</button>
              <button onClick={() => selected && setConfirming(true)} disabled={!selected} className="flex-1 py-3.5 rounded-xl bg-accent text-white text-sm font-semibold disabled:opacity-30">Далее</button>
            </div>
          </>
        ) : (
          <>
            <div className="text-center py-4">
              <div className="text-3xl mb-3">⏱</div>
              <p className="text-base font-bold mb-1">Подтверждение</p>
              <p className="text-sm text-text-secondary">Продлить на {EXTEND_OPTIONS.find(o => o.hours === selected)?.label.replace('+', '')} за <span className="text-accent font-bold">{Math.ceil(pricePerHour * selected!)}₽</span>?</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setConfirming(false)} className="flex-1 py-3.5 rounded-xl bg-surface-2 border border-white/5 text-sm font-medium text-text-secondary">Назад</button>
              <button onClick={() => onSelect(selected!)} className="flex-1 py-3.5 rounded-xl bg-accent text-white text-sm font-semibold">Продлить</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
