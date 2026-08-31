import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { fetchAccountById } from '../api'
import type { Account } from '../types'
import Header from '../components/Header'

const RENTAL_OPTIONS = [
  { days: 1, label: '1 день' },
  { days: 3, label: '3 дня' },
  { days: 7, label: '7 дней' },
  { days: 14, label: '14 дней' },
  { days: 30, label: '30 дней' },
]

export default function RentPage() {
  const { accountId } = useParams<{ accountId: string }>()
  const [account, setAccount] = useState<Account | null>(null)
  const [gameName, setGameName] = useState('')
  const [selectedDays, setSelectedDays] = useState(1)
  const [ordered, setOrdered] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!accountId) return
    fetchAccountById(Number(accountId)).then((data) => {
      if (data) {
        setAccount(data.account)
        setGameName(data.gameName)
      }
    }).finally(() => setLoading(false))
  }, [accountId])

  const handleOrder = () => {
    setOrdered(true)
    const tg = (window as any).Telegram?.WebApp
    tg?.HapticFeedback?.notificationOccurred('success')
  }

  if (loading) {
    return (
      <div className="flex-1 max-w-lg mx-auto w-full">
        <Header title="Загрузка..." showBack />
        <div className="p-4 space-y-4">
          <div className="h-28 skeleton rounded-xl" />
          <div className="h-12 skeleton rounded-xl" />
          <div className="h-32 skeleton rounded-xl" />
        </div>
      </div>
    )
  }

  if (!account) {
    return (
      <div className="flex-1 max-w-lg mx-auto w-full">
        <Header title="Ошибка" showBack />
        <div className="text-center py-16">
          <p className="text-text-secondary">Аккаунт не найден</p>
        </div>
      </div>
    )
  }

  if (ordered) {
    return (
      <div className="flex-1 max-w-lg mx-auto w-full">
        <Header title="Заказ оформлен" showBack />
        <div className="flex flex-col items-center justify-center py-20 px-4 animate-slide-up">
          <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00d68f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">Заявка отправлена!</h2>
          <p className="text-sm text-text-secondary text-center max-w-xs">
            Менеджер свяжется с вами в Telegram для подтверждения и оплаты
          </p>
        </div>
      </div>
    )
  }

  const totalPrice = account.price_per_day * selectedDays

  return (
    <div className="flex-1 flex flex-col max-w-lg mx-auto w-full">
      <Header title="Оформление" showBack />

      <div className="flex-1 p-4 space-y-5 overflow-y-auto pb-4">
        {/* Account Info */}
        <div className="rounded-xl bg-surface-2 border border-white/5 p-4 animate-fade-in">
          <p className="text-xs text-accent font-medium mb-1">{gameName}</p>
          <h2 className="text-lg font-bold">{account.title}</h2>
          <p className="text-sm text-text-secondary mt-0.5">{account.rank}</p>
          <p className="text-xs text-text-muted mt-2">{account.description}</p>
        </div>

        {/* Rental Period */}
        <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
          <h3 className="text-sm font-semibold text-text-secondary mb-3">Срок аренды</h3>
          <div className="grid grid-cols-3 gap-2">
            {RENTAL_OPTIONS.map((opt) => (
              <button
                key={opt.days}
                onClick={() => setSelectedDays(opt.days)}
                className={`py-3 rounded-xl text-sm font-medium transition-all ${
                  selectedDays === opt.days
                    ? 'bg-accent text-white shadow-lg shadow-accent/25'
                    : 'bg-surface-2 border border-white/5 text-text-secondary'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Price Summary */}
        <div className="rounded-xl bg-surface-2 border border-white/5 p-4 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-text-muted">Цена за день</span>
            <span>{account.price_per_day}₽</span>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-text-muted">Количество дней</span>
            <span>{selectedDays}</span>
          </div>
          <div className="border-t border-white/5 my-2" />
          <div className="flex justify-between font-bold text-lg">
            <span>Итого</span>
            <span className="text-accent">{totalPrice}₽</span>
          </div>
        </div>
      </div>

      {/* Order Button */}
      <div className="p-4 glass border-t border-white/5 safe-bottom">
        <button
          onClick={handleOrder}
          className="w-full py-4 rounded-xl bg-accent text-white font-semibold text-base transition-all active:opacity-80 shadow-lg shadow-accent/25"
        >
          Оплатить {totalPrice}₽
        </button>
      </div>
    </div>
  )
}
