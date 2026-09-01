import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { fetchModeration, approveAccount, rejectAccount } from '../../api/server'
import Header from '../../components/Header'

const REASONS = ['Неверные данные', 'Недостаточно информации', 'Некорректное описание', 'Некорректная цена', 'Не соответствует требованиям', 'Другая причина']

export default function AdminListingDetail() {
  const { listingId } = useParams<{ listingId: string }>()
  const [account, setAccount] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')
  const [showReject, setShowReject] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectComment, setRejectComment] = useState('')
  const [showCreds, setShowCreds] = useState(false)

  const load = useCallback(() => {
    if (!listingId) return
    fetchModeration().then(all => setAccount(all.find(a => a.id === Number(listingId)))).finally(() => setLoading(false))
  }, [listingId])

  useEffect(() => { load() }, [load])

  const notify = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const handleApprove = async () => {
    if (!confirm('Одобрить аккаунт?')) return
    try { await approveAccount(Number(listingId)); load(); notify('✅ Одобрен') } catch { notify('❌ Ошибка') }
  }

  const handleReject = async () => {
    if (!rejectReason) return alert('Выберите причину')
    try { await rejectAccount(Number(listingId), rejectReason, rejectComment); setShowReject(false); load(); notify('❌ Отклонён') } catch { notify('❌ Ошибка') }
  }

  if (loading) return <div className="flex-1 nav-spacer max-w-lg mx-auto w-full"><Header title="Загрузка..." showBack /></div>
  if (!account) return <div className="flex-1 nav-spacer max-w-lg mx-auto w-full"><Header title="Ошибка" showBack /></div>

  return (
    <div className="flex-1 nav-spacer max-w-lg mx-auto w-full">
      <Header title="Заявка" showBack />
      <div className="p-4 space-y-4">
        {toast && <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-surface-2 border border-white/10 text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg animate-slide-up">{toast}</div>}

        <div className="rounded-xl bg-surface-2 border border-white/5 p-4 space-y-2 text-sm animate-fade-in">
          <p><span className="text-text-muted">Игра:</span> <span className="font-medium">{account.game_name}</span></p>
          <p><span className="text-text-muted">Название:</span> <span className="font-medium">{account.title}</span></p>
          <p><span className="text-text-muted">Ранг:</span> {account.rank || '—'}</p>
          <p><span className="text-text-muted">Цена:</span> <span className="text-accent font-medium">{account.price_per_hour}₽/час</span></p>
          <p><span className="text-text-muted">Описание:</span> {account.description || '—'}</p>
          {account.extra_info && <p><span className="text-text-muted">Условия:</span> {account.extra_info}</p>}
        </div>

        <div className="rounded-xl bg-surface-2 border border-white/5 p-4 text-sm">
          <p><span className="text-text-muted">Владелец:</span> @{account.owner_username || '—'}</p>
          <p><span className="text-text-muted">Telegram ID:</span> {account.owner_id}</p>
          <p><span className="text-text-muted">Создано:</span> {new Date(account.created_at).toLocaleString('ru-RU')}</p>
        </div>

        <div className="rounded-xl bg-surface-2 border border-accent/15 overflow-hidden glow-border">
          <button onClick={() => setShowCreds(v => !v)} className="w-full px-4 py-3 flex items-center justify-between text-sm"><span>🔐 Данные аккаунта</span><span className="text-xs text-text-muted">{showCreds ? 'Скрыть' : 'Показать'}</span></button>
          {showCreds && <div className="px-4 pb-3 space-y-2 animate-fade-in"><div className="bg-surface-3 rounded-lg px-3 py-2 font-mono text-sm">{account.login}</div><div className="bg-surface-3 rounded-lg px-3 py-2 font-mono text-sm">{account.password}</div></div>}
        </div>

        {account.status === 'pending_moderation' && (
          <div className="space-y-2">
            <button onClick={handleApprove} className="w-full py-3.5 rounded-xl bg-success text-white font-semibold text-sm active:opacity-80">✅ Одобрить</button>
            <button onClick={() => setShowReject(true)} className="w-full py-3.5 rounded-xl bg-danger/10 text-danger font-semibold text-sm active:bg-danger/20">❌ Отклонить</button>
          </div>
        )}
      </div>

      {showReject && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center" onClick={() => setShowReject(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-lg bg-surface rounded-t-2xl p-5 animate-slide-up" style={{ paddingBottom: 'max(24px, calc(env(safe-area-inset-bottom, 0px) + 16px))' }} onClick={e => e.stopPropagation()}>
            <div className="w-9 h-1 bg-surface-3 rounded-full mx-auto mb-4" />
            <h3 className="text-lg font-bold mb-3">Причина отказа</h3>
            <div className="space-y-2 mb-3">
              {REASONS.map(r => <button key={r} onClick={() => setRejectReason(r)} className={`w-full p-3 rounded-xl border text-left text-sm ${rejectReason === r ? 'bg-danger/10 border-danger/30' : 'bg-surface-2 border-white/5'}`}>{r}</button>)}
            </div>
            <textarea value={rejectComment} onChange={e => setRejectComment(e.target.value)} rows={2} placeholder="Комментарий (необязательно)" className="w-full px-3 py-2.5 rounded-xl bg-surface-2 border border-white/5 text-sm focus:outline-none resize-none mb-3" />
            <button onClick={handleReject} className="w-full py-3.5 rounded-xl bg-danger text-white font-semibold text-sm">❌ Отклонить</button>
          </div>
        </div>
      )}
    </div>
  )
}
