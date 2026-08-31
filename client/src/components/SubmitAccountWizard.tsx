import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { submitListing, getGamesStore } from '../api/admin'
import type { Game } from '../types'
import Header from './Header'

const STEPS = ['Игра', 'Аккаунт', 'Условия', 'Проверка']

export default function SubmitAccountWizard({ onClose }: { onClose?: () => void }) {
  const { userId, username } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [games, setGames] = useState<Game[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [gameId, setGameId] = useState<number | null>(null)
  const [title, setTitle] = useState('')
  const [rank, setRank] = useState('')
  const [description, setDescription] = useState('')
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [pricePerHour, setPricePerHour] = useState('')
  const [extraInfo, setExtraInfo] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => { setGames(getGamesStore()) }, [])

  const game = games.find(g => g.id === gameId)
  const canNext = step === 0 ? !!gameId : step === 1 ? (title && login && password && pricePerHour) : step === 2 ? true : false

  const handleSubmit = async () => {
    if (!gameId) return
    setSubmitting(true)
    setError('')
    try {
      await submitListing(userId, username, {
        game_id: gameId, game_name: game?.name || '', title, description, extra_info: extraInfo,
        price_per_day: Number(pricePerHour) * 24, rank, login, password,
      })
      navigate('/my-listings', { replace: true })
    } catch {
      setError('Не удалось отправить заявку. Попробуйте ещё раз.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex-1 max-w-lg mx-auto w-full flex flex-col">
      <Header title="Сдать аккаунт" showBack />

      {/* Progress */}
      <div className="px-5 pt-3 pb-2">
        <div className="flex gap-1">
          {STEPS.map((s, i) => (
            <div key={s} className={`flex-1 h-1 rounded-full transition-colors ${i <= step ? 'bg-accent' : 'bg-surface-3'}`} />
          ))}
        </div>
        <p className="text-xs text-text-muted mt-2">{step + 1} из {STEPS.length}: {STEPS[step]}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-2 pb-6 space-y-4">
        {/* Step 0: Game */}
        {step === 0 && (
          <div className="space-y-2 animate-fade-in">
            <h2 className="text-lg font-bold">Какую игру сдаём?</h2>
            {games.map(g => (
              <button
                key={g.id}
                onClick={() => setGameId(g.id)}
                className={`w-full p-4 rounded-xl border text-left transition-all ${gameId === g.id ? 'bg-accent/10 border-accent/30' : 'bg-surface-2 border-white/5'}`}
              >
                <p className="font-semibold">{g.name}</p>
                <p className="text-xs text-text-muted">{g.accounts_count} аккаунтов в каталоге</p>
              </button>
            ))}
          </div>
        )}

        {/* Step 1: Account info */}
        {step === 1 && (
          <div className="space-y-3 animate-fade-in">
            <h2 className="text-lg font-bold">Данные аккаунта</h2>
            <Field label="Название аккаунта" value={title} onChange={setTitle} placeholder="Prime Account #42" />
            <Field label="Ранг / Уровень" value={rank} onChange={setRank} placeholder="Diamond 2" />
            <div>
              <label className="text-xs text-text-muted block mb-1">Описание</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full px-3 py-2.5 rounded-xl bg-surface-2 border border-white/5 text-sm focus:outline-none focus:border-accent/30 resize-none" placeholder="Много скинов, высокий рейтинг..." />
            </div>
            <Field label="Логин" value={login} onChange={setLogin} placeholder="login" />
            <div>
              <label className="text-xs text-text-muted block mb-1">Пароль</label>
              <div className="flex gap-2">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="flex-1 px-3 py-2.5 rounded-xl bg-surface-2 border border-white/5 text-sm focus:outline-none focus:border-accent/30" placeholder="password" />
                <button onClick={() => setShowPassword(v => !v)} className="px-3 rounded-xl bg-surface-2 border border-white/5 text-text-secondary">{showPassword ? '🙈' : '👁'}</button>
              </div>
            </div>
            <Field label="Цена за час (₽)" value={pricePerHour} onChange={setPricePerHour} placeholder="50" type="number" />
          </div>
        )}

        {/* Step 2: Extra info */}
        {step === 2 && (
          <div className="space-y-3 animate-fade-in">
            <h2 className="text-lg font-bold">Дополнительно</h2>
            <div>
              <label className="text-xs text-text-muted block mb-1">Что нужно знать арендатору?</label>
              <textarea value={extraInfo} onChange={e => setExtraInfo(e.target.value)} rows={4} className="w-full px-3 py-2.5 rounded-xl bg-surface-2 border border-white/5 text-sm focus:outline-none focus:border-accent/30 resize-none" placeholder="Особенности аккаунта, ограничения, инструкции..." />
            </div>
            <div className="rounded-xl bg-surface-2 border border-white/5 p-3">
              <p className="text-xs text-text-muted">💡 Укажите важные детали: что можно/нельзя менять, регион, особенности.</p>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-lg font-bold">Проверка данных</h2>
            <div className="rounded-xl bg-surface-2 border border-white/5 p-4 space-y-2 text-sm">
              <p><span className="text-text-muted">Игра:</span> <span className="font-medium">{game?.name}</span></p>
              <p><span className="text-text-muted">Название:</span> <span className="font-medium">{title}</span></p>
              <p><span className="text-text-muted">Ранг:</span> <span className="font-medium">{rank || '—'}</span></p>
              <p><span className="text-text-muted">Цена:</span> <span className="font-medium text-accent">{pricePerHour}₽/час</span></p>
              {description && <p><span className="text-text-muted">Описание:</span> {description}</p>}
              {extraInfo && <p><span className="text-text-muted">Условия:</span> {extraInfo}</p>}
            </div>
            <div className="rounded-xl bg-warning/5 border border-warning/20 p-3">
              <p className="text-xs text-warning">⚠️ После отправки аккаунт будет проверен модератором. До одобрения он не появится в каталоге.</p>
            </div>
            {error && <div className="rounded-xl bg-danger/10 border border-danger/20 p-3"><p className="text-sm text-danger">{error}</p></div>}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="p-4 glass border-t border-white/5 safe-bottom flex gap-2">
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)} className="px-4 py-3.5 rounded-xl bg-surface-2 border border-white/5 text-sm font-medium text-text-secondary active:bg-surface-3">
            Назад
          </button>
        )}
        {step < 3 ? (
          <button onClick={() => setStep(s => s + 1)} disabled={!canNext} className="flex-1 py-3.5 rounded-xl bg-accent text-white text-sm font-semibold active:opacity-80 disabled:opacity-30 shadow-lg shadow-accent/25">
            Далее
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={submitting} className="flex-1 py-3.5 rounded-xl bg-accent text-white text-sm font-semibold active:opacity-80 disabled:opacity-50 shadow-lg shadow-accent/25">
            {submitting ? 'Отправка...' : '📨 Отправить на модерацию'}
          </button>
        )}
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string }) {
  return (
    <div>
      <label className="text-xs text-text-muted block mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-surface-2 border border-white/5 text-sm focus:outline-none focus:border-accent/30" placeholder={placeholder} />
    </div>
  )
}
