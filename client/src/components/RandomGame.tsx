import { useState } from 'react'
import type { Game } from '../types'

const GAME_META: Record<string, { desc: string }> = {
  valorant: { desc: 'Тактический шутер 5v5 от Riot Games' },
  fortnite: { desc: 'Королевская битва с уникальным строительством' },
  cs2: { desc: 'Легендарный тактический шутер от Valve' },
}

export default function RandomGame({ games, onSelect }: { games: Game[]; onSelect: (slug: string) => void }) {
  const [suggestion, setSuggestion] = useState<Game | null>(null)

  const pick = () => {
    const random = games[Math.floor(Math.random() * games.length)]
    setSuggestion(random)
  }

  if (suggestion) {
    const meta = GAME_META[suggestion.slug] || { desc: '' }
    return (
      <div className="rounded-xl bg-surface-2/60 border border-white/[0.04] p-4 animate-fade-in">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${suggestion.color}15` }}>
            <div className="w-3 h-3 rounded-full" style={{ background: suggestion.color }} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-text-muted mb-0.5">Рекомендуем</p>
            <p className="text-[13px] font-bold">{suggestion.name}</p>
            <p className="text-[11px] text-text-secondary mt-0.5">{meta.desc}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onSelect(suggestion.slug)}
            className="flex-1 py-2.5 rounded-lg bg-accent text-white text-[12px] font-semibold active:opacity-80 transition-opacity"
          >
            Посмотреть аккаунты
          </button>
          <button
            onClick={pick}
            className="px-4 py-2.5 rounded-lg bg-surface-3/60 text-[12px] text-text-secondary active:bg-surface-3 transition-colors"
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
      className="w-full py-3 rounded-xl bg-surface-2/40 border border-white/[0.03] text-[13px] text-text-muted font-medium active:bg-surface-2 transition-colors"
    >
      Не знаю, во что играть
    </button>
  )
}
