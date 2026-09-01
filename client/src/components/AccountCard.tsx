import type { Account } from '../types'

export default function AccountCard({ account, onClick }: { account: Account; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl bg-surface-2 border border-white/5 p-4 text-left transition-all active:scale-[0.98] hover:border-white/10"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold truncate">{account.title}</h3>
          <p className="text-xs text-accent mt-0.5">{account.rank}</p>
          <p className="text-xs text-text-muted mt-1.5 line-clamp-2">{account.description}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-lg font-bold text-accent">{account.price_per_hour}₽</p>
          <p className="text-[10px] text-text-muted">в час</p>
        </div>
      </div>
    </button>
  )
}
