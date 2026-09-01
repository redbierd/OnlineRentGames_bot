import type { Account } from '../types'

export default function AccountCard({ account, onClick }: { account: Account; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full card-interactive p-4 text-left"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-[13px] font-semibold truncate leading-tight">{account.title}</h3>
          <p className="text-[11px] text-accent font-medium mt-1">{account.rank}</p>
          <p className="text-[11px] text-text-muted mt-1.5 line-clamp-2 leading-relaxed">{account.description}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-lg font-bold text-accent leading-none">{account.price_per_hour}₽</p>
          <p className="text-[10px] text-text-muted mt-0.5">в час</p>
        </div>
      </div>
    </button>
  )
}
