import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { getGamesStore } from '../../api/admin'
import type { Game } from '../../types'
import Header from '../../components/Header'

export default function AdminGames() {
  const { userId } = useAuth()
  const [games] = useState<Game[]>(getGamesStore())

  return (
    <div className="flex-1 nav-spacer max-w-lg mx-auto w-full">
      <Header title="Игры" showBack />
      <div className="p-4 space-y-3">
        {games.map(game => (
          <div key={game.id} className="rounded-xl bg-surface-2 border border-white/5 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl" style={{ background: `${game.color}20` }}>
                {game.slug === 'valorant' ? '🎯' : game.slug === 'fortnite' ? '🪂' : '💥'}
              </div>
              <div className="flex-1"><p className="font-semibold">{game.name}</p><p className="text-xs text-text-muted">{game.accounts_count} аккаунтов</p></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
