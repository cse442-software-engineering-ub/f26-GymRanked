import { Link } from 'react-router-dom'

// Workouts is the weekly workout plan and Plans the plan library; the other screens
// (including the Figma Dashboard) don't have a page to link to yet.
const NAV_LINKS = [
  { label: 'Dashboard' },
  { label: 'Workouts', to: '/weekly-plan' },
  { label: 'Plans', to: '/plans' },
  { label: 'Progress' },
  { label: 'Leaderboard' },
  { label: 'Today' },
]

function NavBar({ current }) {
  return (
    <header className="nav-bar">
      <div className="nav-bar__brand">
        <span className="nav-bar__logo" aria-hidden="true" />
        <span className="nav-bar__brand-name">GymRank</span>
      </div>
      <nav className="nav-bar__links" aria-label="Primary">
        {NAV_LINKS.map(({ label, to }) => {
          const className =
            label === current ? 'nav-bar__link nav-bar__link--current' : 'nav-bar__link'
          return to ? (
            <Link key={label} to={to} className={className}>
              {label}
            </Link>
          ) : (
            <span key={label} className={className}>
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
