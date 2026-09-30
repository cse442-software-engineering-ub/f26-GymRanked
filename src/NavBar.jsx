import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authRequest } from './auth/api.js'

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
  const navigate = useNavigate()
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [logoutBusy, setLogoutBusy] = useState(false)
  const [logoutError, setLogoutError] = useState('')

  async function onLogout() {
    setLogoutBusy(true)
    setLogoutError('')
    try {
      await authRequest('logout', {})
      navigate('/login', { replace: true, state: { message: 'You are logged out.' } })
    } catch (error) {
      setLogoutError(error.message)
      setLogoutBusy(false)
    }
  }

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
        {(
          <div className="nav-bar__account">
            <button
              type="button"
              className="nav-bar__avatar"
              aria-label="Open account menu"
              aria-haspopup="menu"
              aria-expanded={accountMenuOpen}
              onClick={() => setAccountMenuOpen((open) => !open)}
            >
              MM
            </button>
            {accountMenuOpen && (
              <>
                <button
                  type="button"
                  className="nav-bar__menu-backdrop"
                  aria-label="Close account menu"
                  onClick={() => setAccountMenuOpen(false)}
                />
                <div className="nav-bar__account-menu" role="menu">
                  <span className="nav-bar__account-item" role="menuitem" aria-disabled="true">Profile</span>
                  <span className="nav-bar__account-item" role="menuitem" aria-disabled="true">Account Settings</span>
                  <button
                    type="button"
                    className="nav-bar__logout"
                    role="menuitem"
                    disabled={logoutBusy}
                    onClick={onLogout}
                  >
                    {logoutBusy ? 'Logging out…' : 'Log out'}
                  </button>
                  {logoutError && <span className="nav-bar__account-item" role="alert">{logoutError}</span>}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  )
}

export default NavBar
