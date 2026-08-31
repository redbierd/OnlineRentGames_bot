import { useState } from 'react'
import type { Game } from '../types'

const GAME_META: Record<string, { icon: string; desc: string; minPrice: number }> = {
  valorant: { icon: '🎯', desc: 'Тактический шутер 5v5 от Riot Games', minPrice: 50 },
  fortnite: { icon: '🪂', desc: 'Королевская битва с уникальным строительством', minPrice: 80 },
  cs2: { icon: '💥', desc: 'Легендарный тактический шутер от Valve', minPrice: 60 },
}

export default function RandomGame({ games, onSelect }: { games: Game[]; onSelect: (slug: string) => void }) {
  const [suggestion, setSuggestion] = useState<Game | null>(null)

  const pick = () => {
    const random = games[Math.floor(Math.random() * games.length)]
    setSuggestion(random)
  }

  if (suggestion) {
    const meta = GAME_META[suggestion.slug] || { icon: '🎮', desc: '', minPrice: 0 }
    return (
      <div className="rounded-xl bg-surface-2 border border-white/5 p-4 animate-fade-in">
        <div className="flex items-start gap-3 mb-3">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl shrink-0"
            style={{ background: `${suggestion.color}20` }}
          >
            {meta.icon}
          </div>
          <div className="min-w-0">
            <p className="text-xs text-text-muted mb-0.5">Рекомендуем</p>
            <p className="font-bold">{suggestion.name}</p>
            <p className="text-xs text-text-secondary mt-0.5">{meta.desc}</p>
            <p className="text-xs text-accent mt-1">от {meta.minPrice}₽/день</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onSelect(suggestion.slug)}
            className="flex-1 py-2.5 rounded-lg bg-accent text-white text-sm font-semibold active:opacity-80 transition-opacity"
          >
            Посмотреть аккаунты
          </button>
          <button
            onClick={pick}
            className="px-4 py-2.5 rounded-lg bg-surface-3 text-xs text-text-secondary active:bg-surface transition-colors"
          >
            Другую
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={pick}
      className="w-full py-3 rounded-xl bg-surface-2 border border-white/5 text-sm text-text-secondary font-medium active:bg-surface-3 transition-colors"
    >
      🎲 Не знаю, во что играть
    </button>
  )
}
