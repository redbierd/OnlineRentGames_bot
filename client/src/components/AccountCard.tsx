import type { Account } from '../types'

export default function AccountCard({ account, onClick }: { account: Account; onClick: () => void }) {
  const isUser = account.owner_type === 'user'

  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl bg-surface-2 border border-white/5 p-4 text-left transition-all active:scale-[0.98] hover:border-white/10"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-sm font-semibold truncate">{account.title}</h3>
            {isUser && (
              <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-accent/10 text-accent shrink-0">От пользователя</span>
            )}
          </div>
          <p className="text-xs text-accent mt-0.5">{account.rank}</p>
          <p className="text-xs text-text-muted mt-1.5 line-clamp-2">{account.description}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-lg font-bold text-accent">{account.price_per_day}₽</p>
          <p className="text-[10px] text-text-muted">в день</p>
        </div>
      </div>
    </button>
  )
}
