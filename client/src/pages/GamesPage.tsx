import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchGames } from '../api'
import type { Game } from '../types'
import Header from '../components/Header'
import GameCard from '../components/GameCard'

export default function GamesPage() {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchGames().then(setGames).catch(console.error).finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex-1 nav-spacer max-w-lg mx-auto w-full">
      <Header title="Игры" />
      <div className="p-4 space-y-3">
        {loading ? (
          <>
            <div className="h-32 skeleton rounded-2xl" />
            <div className="h-32 skeleton rounded-2xl" />
            <div className="h-32 skeleton rounded-2xl" />
          </>
        ) : (
          games.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              onClick={() => navigate(`/game/${game.slug}`)}
            />
          ))
        )}
      </div>
    </div>
  )
}
