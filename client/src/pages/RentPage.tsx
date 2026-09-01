import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchAccountById } from '../api'
import { createRental } from '../api/server'
import type { Account } from '../types'
import Header from '../components/Header'

const OPTIONS = [
  { hours: 1, label: '1 час' },
  { hours: 3, label: '3 часа' },
  { hours: 5, label: '5 часов' },
  { hours: 12, label: '12 часов' },
  { hours: 24, label: '24 часа' },
]

export default function RentPage() {
  const { accountId } = useParams<{ accountId: string }>()
  const navigate = useNavigate()
  const [account, setAccount] = useState<Account | null>(null)
  const [gameName, setGameName] = useState('')
  const [hours, setHours] = useState(3)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!accountId) return
    fetchAccountById(Number(accountId)).then(d => {
      if (d) { setAccount(d.account as unknown as Account); setGameName(d.gameName) }
    }).finally(() => setLoading(false))
  }, [accountId])

  const handleSubmit = async () => {
    if (!account) return
    setSubmitting(true); setError('')
    try {
      await createRental(account.id, hours)
      setDone(true)
    } catch (e: any) {
      setError(e.message === 'Account not available' ? 'Этот аккаунт только что арендовали' : 'Ошибка. Попробуйте ещё раз.')
    } finally { setSubmitting(false) }
  }

  if (loading) return <div className="flex-1 max-w-lg mx-auto w-full"><Header title="Загрузка..." showBack /><div className="p-4 space-y-4"><div className="h-28 skeleton rounded-xl" /><div className="h-32 skeleton rounded-xl" /></div></div>
  if (!account) return <div className="flex-1 max-w-lg mx-auto w-full"><Header title="Ошибка" showBack /><p className="p-4 text-center text-text-muted">Аккаунт не найден</p></div>

  if (done) {
    return (
      <div className="flex-1 max-w-lg mx-auto w-full">
        <Header title="Аренда оформлена" showBack />
        <div className="flex flex-col items-center justify-center py-16 px-4 animate-slide-up">
          <div className="w-16 h-16 rounded-full bg-success/15 flex items-center justify-center mb-4"><span className="text-3xl">✅</span></div>
          <h2 className="text-xl font-bold mb-2">Аренда активна!</h2>
          <p className="text-sm text-text-secondary text-center mb-4">Данные аккаунта доступны в разделе «Аренды»</p>
          <button onClick={() => navigate('/rentals')} className="px-6 py-3 rounded-xl bg-accent text-white text-sm font-semibold active:opacity-80">Перейти к арендам</button>
        </div>
      </div>
    )
  }

  const pricePerHour = account.price_per_hour
  const total = Math.ceil(pricePerHour * hours)

  return (
    <div className="flex-1 flex flex-col max-w-lg mx-auto w-full">
      <Header title="Аренда" showBack />
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <div className="rounded-xl bg-surface-2 border border-white/5 p-4 animate-fade-in">
          <p className="text-xs text-accent font-medium mb-1">{gameName}</p>
          <h2 className="text-lg font-bold">{account.title}</h2>
          <p className="text-sm text-text-secondary">{account.rank}</p>
          <p className="text-xs text-text-muted mt-2">{account.description}</p>
          <p className="text-sm text-accent font-bold mt-2">{pricePerHour}₽/час</p>
        </div>
        <div className="animate-fade-in">
          <h3 className="text-sm font-semibold text-text-secondary mb-3">Срок аренды</h3>
          <div className="grid grid-cols-3 gap-2">
            {OPTIONS.map(o => (
              <button key={o.hours} onClick={() => setHours(o.hours)} className={`py-3 rounded-xl text-sm font-medium transition-all ${hours === o.hours ? 'bg-accent text-white shadow-lg shadow-accent/25' : 'bg-surface-2 border border-white/5 text-text-secondary'}`}>{o.label}</button>
            ))}
          </div>
        </div>
        <div className="rounded-xl bg-surface-2 border border-white/5 p-4 animate-fade-in">
          <div className="flex justify-between text-sm mb-2"><span className="text-text-muted">Цена за час</span><span>{pricePerHour}₽</span></div>
          <div className="flex justify-between text-sm mb-2"><span className="text-text-muted">Часов</span><span>{hours}</span></div>
          <div className="border-t border-white/5 my-2" />
          <div className="flex justify-between font-bold text-lg"><span>Итого</span><span className="text-accent">{total}₽</span></div>
        </div>
        {error && <div className="rounded-xl bg-danger/10 border border-danger/20 p-3"><p className="text-sm text-danger">{error}</p></div>}
      </div>
      <div className="p-4 glass border-t border-white/5 safe-bottom">
        <button onClick={handleSubmit} disabled={submitting} className="w-full py-4 rounded-xl bg-accent text-white font-semibold text-base transition-all active:opacity-80 shadow-lg shadow-accent/25 disabled:opacity-50">
          {submitting ? 'Обработка...' : `Оплатить ${total}₽`}
        </button>
      </div>
    </div>
  )
}
