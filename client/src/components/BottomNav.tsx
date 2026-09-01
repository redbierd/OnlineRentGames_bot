import { useLocation, useNavigate } from 'react-router-dom'

const tabs = [
  { path: '/', label: 'Главная', icon: HomeIcon },
  { path: '/games', label: 'Игры', icon: GamesIcon },
  { path: '/rentals', label: 'Аренды', icon: RentalsIcon },
  { path: '/profile', label: 'Профиль', icon: ProfileIcon },
]

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  const hideOn = ['/game/', '/rent/', '/admin', '/submit-account', '/my-listings']
  if (hideOn.some(p => location.pathname.startsWith(p))) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/[0.03] safe-bottom">
      <div className="flex items-center justify-around max-w-lg mx-auto h-14">
        {tabs.map((tab) => {
          const active = location.pathname === tab.path
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="flex flex-col items-center gap-0.5 px-4 py-1.5 transition-colors relative"
            >
              {active && (
                <div className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-0.5 bg-accent rounded-full" />
              )}
              <tab.icon active={active} />
              <span className={`text-[10px] font-medium ${active ? 'text-accent' : 'text-text-muted/50'}`}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function GamesIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="3" />
      <line x1="6" y1="12" x2="10" y2="12" />
      <line x1="8" y1="10" x2="8" y2="14" />
      <circle cx="15" cy="12" r="1" fill={active ? 'currentColor' : 'none'} />
      <circle cx="18" cy="10" r="1" fill={active ? 'currentColor' : 'none'} />
    </svg>
  )
}

function RentalsIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="3" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      {active && <circle cx="12" cy="16" r="1.5" fill="currentColor" />}
    </svg>
  )
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    </svg>
  )
}
