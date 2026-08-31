import { useState } from 'react'
import { CURRENT_TERMS_VERSION, setAcceptedVersion } from '../utils/terms'
import { trackAcceptTerms } from '../utils/activity'

const JOKE = `Пользовательское соглашение (версия ${CURRENT_TERMS_VERSION})

1. Общие положения
Настоящее соглашение регулирует использование сервиса аренды игровых аккаунтов GameRent.

2. Предмет соглашения
Сервис предоставляет пользователям временную аренду игровых аккаунтов на условиях, указанных при оформлении аренды.

3. Права и обязанности
Пользователь обязуется использовать аккаунты только в личных целях и не передавать доступ третьим лицам.

4. Ответственность
Сервис не несёт ответственности за действия пользователя в арендованных аккаунтах.

5. Заключительные положения
Анекдот: Пограммист женился. Жена говорит: "Сходи в магазин, купи батон хлеба. Если будут яйца — возьми десяток." Он вернулся с десятью батонами хлеба. "Зачем тебе десять батонов?!" — "Яйца были."`

export default function TermsScreen({ onAccept }: { onAccept: () => void }) {
  const [showTerms, setShowTerms] = useState(false)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState('')

  const handleAccept = async () => {
    setAccepting(true)
    setError('')
    try {
      // Save locally
      setAcceptedVersion(CURRENT_TERMS_VERSION)
      trackAcceptTerms()

      // Try to sync with bot backend (best effort)
      try {
        const userId = localStorage.getItem('tg_user_id') || ''
        if (userId) {
          await fetch(`/api/terms/accept`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, version: CURRENT_TERMS_VERSION }),
          }).catch(() => {}) // Silent fail - localStorage is primary
        }
      } catch {}

      onAccept()
    } catch {
      setError('Не удалось сохранить согласие. Попробуйте ещё раз.')
    } finally {
      setAccepting(false)
    }
  }

  if (showTerms) {
    return (
      <div className="fixed inset-0 z-[200] bg-surface flex flex-col">
        <div className="flex items-center gap-3 px-4 h-12 border-b border-white/5 shrink-0">
          <button onClick={() => setShowTerms(false)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-2 text-text-secondary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <h1 className="text-base font-semibold">Пользовательское соглашение</h1>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <pre className="text-xs text-text-secondary whitespace-pre-wrap leading-relaxed font-sans">{JOKE}</pre>
        </div>
        <div className="p-4 border-t border-white/5 shrink-0">
          <button onClick={() => setShowTerms(false)} className="w-full py-3 rounded-xl bg-surface-2 border border-white/5 text-sm font-medium text-text-secondary active:bg-surface-3">
            Закрыть
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[200] bg-surface flex flex-col items-center justify-center px-6 animate-fade-in">
      {/* Background glow */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-accent/10 rounded-full blur-[80px]" />

      <div className="relative w-full max-w-sm space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-2xl bg-accent/15 flex items-center justify-center animate-pulse-glow">
            <span className="text-4xl">🎮</span>
          </div>
        </div>

        {/* Title */}
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Добро пожаловать</h1>
          <p className="text-sm text-text-secondary">Перед началом работы ознакомьтесь с условиями использования сервиса.</p>
        </div>

        {/* Info cards */}
        <div className="space-y-2">
          <InfoCard icon="🔒" title="Ваши данные" text="Мы используем данные Telegram, необходимые для работы профиля и сервиса." />
          <InfoCard icon="💳" title="Оплата" text="Платежи обрабатываются через доступные в сервисе платёжные инструменты." />
          <InfoCard icon="🎮" title="Аренда" text="Перед использованием аккаунтов ознакомьтесь с правилами сервиса." />
        </div>

        {/* Agreement text */}
        <p className="text-xs text-text-muted text-center leading-relaxed">
          Нажимая «Принять», вы соглашаетесь с{' '}
          <button onClick={() => setShowTerms(true)} className="text-accent underline">Пользовательским соглашением</button>
          {' '}и правилами использования сервиса.
        </p>

        {/* Error */}
        {error && (
          <div className="rounded-xl bg-danger/10 border border-danger/20 p-3 text-center">
            <p className="text-sm text-danger">{error}</p>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={handleAccept}
          disabled={accepting}
          className="w-full py-4 rounded-xl bg-accent text-white font-semibold text-base active:opacity-80 transition-opacity shadow-lg shadow-accent/30 disabled:opacity-50"
        >
          {accepting ? 'Сохранение...' : '✅ Принять и продолжить'}
        </button>
      </div>
    </div>
  )
}

function InfoCard({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-surface-2 border border-white/5">
      <span className="text-lg mt-0.5">{icon}</span>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-text-muted mt-0.5">{text}</p>
      </div>
    </div>
  )
}
