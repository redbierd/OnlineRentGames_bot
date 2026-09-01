import { useEffect, useState } from 'react'
import { fetchWallet, topUpWallet } from '../api/server'
import Header from '../components/Header'

const TX_LABELS: Record<string, { label: string; color: string; prefix: string }> = {
  topup: { label: 'Пополнение', color: 'text-success', prefix: '+' },
  rental_payment: { label: 'Оплата аренды', color: 'text-danger', prefix: '' },
  rental_income: { label: 'Доход от аренды', color: 'text-success', prefix: '+' },
  cashback: { label: 'Кэшбэк', color: 'text-accent', prefix: '+' },
}

export default function WalletPage() {
  const [balance, setBalance] = useState(0)
  const [cashbackPoints, setCashbackPoints] = useState(0)
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showTopup, setShowTopup] = useState(false)
  const [topupAmount, setTopupAmount] = useState('')
  const [tab, setTab] = useState<'balance' | 'cashback'>('balance')
  const [toast, setToast] = useState('')

  const load = () => fetchWallet().then(w => { setBalance(w.balance); setCashbackPoints(w.cashbackPoints); setTransactions(w.transactions) }).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const notify = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const handleTopup = async () => {
    const amount = Number(topupAmount)
    if (!amount || amount <= 0) return
    try { await topUpWallet(amount); setShowTopup(false); setTopupAmount(''); load(); notify(`+${amount}₽`) } catch { notify('Ошибка') }
  }

  const balanceTxns = transactions.filter(t => t.type !== 'cashback')
  const cashbackTxns = transactions.filter(t => t.type === 'cashback')

  if (loading) {
    return (
      <div className="flex-1 max-w-lg mx-auto w-full">
        <Header title="Кошелёк" showBack />
        <div className="p-5 space-y-4">
          <div className="h-24 skeleton rounded-2xl" />
          <div className="h-16 skeleton rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 max-w-lg mx-auto w-full flex flex-col">
      <Header title="Кошелёк" showBack />

      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-6 space-y-4">
        {toast && <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-surface-2 border border-white/10 text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg animate-slide-up">{toast}</div>}

        {/* Balance Card */}
        <div className="card p-5 animate-fade-in glow-border">
          <p className="text-[11px] text-text-muted mb-1">Баланс</p>
          <p className="text-3xl font-bold mb-4">{balance}₽</p>
          <div className="flex gap-2">
            <button onClick={() => setShowTopup(true)} className="flex-1 py-2.5 btn-primary text-[12px]">Пополнить</button>
            <button className="flex-1 py-2.5 btn-secondary text-[12px]">Вывод</button>
          </div>
        </div>

        {/* Cashback */}
        <div className="card p-4 animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎁</span>
            <div>
              <p className="text-[11px] text-text-muted">Кэшбэк</p>
              <p className="text-xl font-bold text-success">{cashbackPoints} <span className="text-[12px] font-normal text-text-muted">баллов</span></p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button onClick={() => setTab('balance')} className={`flex-1 py-2.5 rounded-xl text-[12px] font-medium transition-colors ${tab === 'balance' ? 'bg-accent text-white' : 'bg-surface-2 text-text-secondary'}`}>
            Баланс
          </button>
          <button onClick={() => setTab('cashback')} className={`flex-1 py-2.5 rounded-xl text-[12px] font-medium transition-colors ${tab === 'cashback' ? 'bg-accent text-white' : 'bg-surface-2 text-text-secondary'}`}>
            Кэшбэк
          </button>
        </div>

        {/* Transactions */}
        <div className="space-y-2">
          {(tab === 'balance' ? balanceTxns : cashbackTxns).length === 0 ? (
            <p className="text-center text-text-muted text-sm py-8">
              {tab === 'balance' ? 'Нет транзакций' : 'Нет начислений кэшбэка'}
            </p>
          ) : (
            (tab === 'balance' ? balanceTxns : cashbackTxns).map(t => {
              const meta = TX_LABELS[t.type] || { label: t.type, color: 'text-text-secondary', prefix: '' }
              return (
                <div key={t.id} className="card p-3 flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium">{meta.label}</p>
                    <p className="text-[11px] text-text-muted">{t.description}</p>
                    <p className="text-[10px] text-text-muted">{new Date(t.created_at).toLocaleString('ru-RU')}</p>
                  </div>
                  <p className={`text-[15px] font-bold ${meta.color} shrink-0 ml-3`}>
                    {meta.prefix}{t.amount}₽
                  </p>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Topup Modal */}
      {showTopup && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center" onClick={() => setShowTopup(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-lg bg-surface rounded-t-2xl p-5 animate-slide-up" style={{ paddingBottom: 'max(24px, calc(env(safe-area-inset-bottom, 0px) + 16px))' }} onClick={e => e.stopPropagation()}>
            <div className="w-9 h-1 bg-surface-3 rounded-full mx-auto mb-5" />
            <h3 className="text-lg font-bold mb-4 text-center">Пополнить баланс</h3>
            <input
              type="number"
              value={topupAmount}
              onChange={e => setTopupAmount(e.target.value)}
              placeholder="Сумма"
              className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-white/[0.04] text-lg font-bold text-center focus:outline-none focus:border-accent/30 mb-4"
            />
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[100, 300, 500, 1000].map(a => (
                <button key={a} onClick={() => setTopupAmount(String(a))} className="py-2.5 rounded-lg bg-surface-3 text-[12px] font-medium text-text-secondary active:bg-surface-2">
                  {a}₽
                </button>
              ))}
            </div>
            <button onClick={handleTopup} className="w-full py-4 btn-primary text-[15px]">
              Пополнить
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
