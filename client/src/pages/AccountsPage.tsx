import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchGames, fetchAccounts } from '../api'
import type { Game, Account } from '../types'
import Header from '../components/Header'
import AccountCard from '../components/AccountCard'
import { FavoriteButton } from '../components/FavoriteButton'

export default function AccountsPage() {
  const { slug } = useParams<{ slug: string }>()
  const [game, setGame] = useState<Game | null>(null)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (!slug) return
    fetchGames().then((games) => {
      const found = games.find((g) => g.slug === slug)
      if (found) {
        setGame(found)
        fetchAccounts(found.id).then(setAccounts).finally(() => setLoading(false))
      }
    })
  }, [slug])

  if (loading || !game) {
    return (
      <div className="flex-1 max-w-lg mx-auto w-full">
        <Header title="Загрузка..." showBack />
        <div className="p-4 space-y-3">
          <div className="h-20 skeleton rounded-xl" />
          <div className="h-20 skeleton rounded-xl" />
          <div className="h-20 skeleton rounded-xl" />
        </div>
      </div>
    )
  }

  const available = accounts.filter((a) => a.status === 'available')

  return (
    <div className="flex-1 max-w-lg mx-auto w-full">
      <Header title={game.name} showBack />

      {/* Game Banner */}
      <div
        className="p-5 flex items-center justify-between"
        style={{ background: `linear-gradient(135deg, ${game.color}25, transparent)` }}
      >
        <div>
          <h2 className="text-xl font-bold">{game.name}</h2>
          <p className="text-sm text-text-secondary mt-0.5">
            {available.length > 0 ? `${available.length} аккаунтов доступно` : 'Нет доступных аккаунтов'}
          </p>
        </div>
        <FavoriteButton gameId={game.id} />
      </div>

      {/* Accounts List */}
      <div className="p-4 space-y-2 pb-8">
        {accounts.map((account) => (
          <AccountCard
            key={account.id}
            account={account}
            onClick={() => navigate(`/rent/${account.id}`)}
          />
        ))}
      </div>
    </div>
  )
}
