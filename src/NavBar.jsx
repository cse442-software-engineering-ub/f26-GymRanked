import { Link } from 'react-router-dom'

// Add a `to` value when a teammate implements one of the future destinations.
// Keeping route ownership here lets new pages join the shared navigation without
// changing every signed-in screen.
const NAV_LINKS = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Workouts', to: '/weekly-plan' },
  { label: 'Plans', to: '/plans' },
  { label: 'Progress', futurePath: '/progress' },
  { label: 'Leaderboard', futurePath: '/leaderboard' },
  { label: 'Today', futurePath: '/today' },
]

function NavBar({ current }) {
  return (
    <header className="nav-bar">
      <Link className="nav-bar__brand" to="/dashboard" aria-label="GymRank dashboard">
        <span className="nav-bar__logo" aria-hidden="true" />
        <span className="nav-bar__brand-name">GymRank</span>
      </Link>
      <nav className="nav-bar__links" aria-label="Primary">
        {NAV_LINKS.map(({ label, to, futurePath }) => {
          const className =
            label === current ? 'nav-bar__link nav-bar__link--current' : 'nav-bar__link'
          return to ? (
            <Link key={label} to={to} className={className}>
              {label}
            </Link>
          ) : (
            <span key={label} className={className} aria-disabled="true" data-future-route={futurePath}>
              {label}
            </span>
          )
        })}
      </nav>
      <div className="nav-bar__actions">
        <button type="button" className="nav-bar__start-workout">
          Start Workout
        </button>
        <div className="nav-bar__avatar" aria-hidden="true">
          MM
        </div>
      </div>
    </header>
  )
}

export default NavBar
