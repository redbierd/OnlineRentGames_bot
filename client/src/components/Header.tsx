import { useNavigate } from 'react-router-dom'

export default function Header({ title, showBack }: { title: string; showBack?: boolean }) {
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-40 glass border-b border-white/5">
      <div className="flex items-center gap-3 px-4 h-12 max-w-lg mx-auto">
        {showBack && (
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-2 text-text-secondary active:bg-surface-3 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}
        <h1 className="text-base font-semibold truncate">{title}</h1>
      </div>
    </header>
  )
}
