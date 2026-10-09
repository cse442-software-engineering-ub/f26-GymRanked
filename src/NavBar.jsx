import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authRequest } from './auth/api.js'
import MobileDashboardIcon from './MobileDashboardIcon.jsx'

// Add a `to` value when a teammate implements one of the future destinations.
// Keeping route ownership here lets new pages join the shared navigation without
// changing every signed-in screen.
const NAV_LINKS = [
  { label: 'Dashboard', to: '/dashboard', icon: 'home' },
  { label: 'Workouts', to: '/weekly-plan', icon: 'dumbbell' },
  { label: 'Plans', to: '/plans', icon: 'calendar' },
  { label: 'Progress', futurePath: '/progress', icon: 'progress' },
  { label: 'Leaderboard', futurePath: '/leaderboard', icon: 'trophy' },
  { label: 'Today', futurePath: '/today', icon: 'today' },
]

function NavBar({ current, userName = '' }) {
  const navigate = useNavigate()
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [logoutBusy, setLogoutBusy] = useState(false)
  const [logoutError, setLogoutError] = useState('')
  const [sessionUserName, setSessionUserName] = useState(userName.trim())
  const nameParts = sessionUserName.split(/\s+/).filter(Boolean)
  const hasSingleName = nameParts.length === 1
  const avatarInitials = nameParts.length > 1
    ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
    : (nameParts[0]?.[0] || '?').toUpperCase()

  useEffect(() => {
    if (userName.trim()) setSessionUserName(userName.trim())
  }, [userName])

  useEffect(() => {
    if (!mobileMenuOpen) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setMobileMenuOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [mobileMenuOpen])

  useEffect(() => {
    let active = true
    authRequest('session')
      .then(data => {
        if (active) setSessionUserName(data.user.full_name.trim())
      })
      .catch(() => {
        if (active) navigate('/login', { replace: true })
      })
    return () => { active = false }
  }, [navigate])

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
        <span className="nav-bar__logo" aria-hidden="true"><MobileDashboardIcon name="dumbbell" /></span>
        <span className="nav-bar__brand-name">GymRank</span>
      </Link>
      <button type="button" className="nav-bar__mobile-toggle" aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={mobileMenuOpen} aria-controls="mobile-navigation" onClick={() => setMobileMenuOpen((open) => !open)}>
        <span /><span /><span />
      </button>
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
        <button type="button" className="nav-bar__start-workout" onClick={() => navigate('/weekly-plan')}>
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
              <span className={hasSingleName ? 'nav-bar__avatar-text nav-bar__avatar-text--single' : 'nav-bar__avatar-text'}>
                {avatarInitials}
              </span>
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
      <button type="button" className={`nav-bar__mobile-backdrop${mobileMenuOpen ? ' is-open' : ''}`} aria-label="Close navigation menu" tabIndex={mobileMenuOpen ? 0 : -1} onClick={() => setMobileMenuOpen(false)} />
      <nav id="mobile-navigation" className={`nav-bar__mobile-drawer${mobileMenuOpen ? ' is-open' : ''}`} aria-label="Mobile navigation" aria-hidden={!mobileMenuOpen}>
        <span className="nav-bar__mobile-caption">Menu</span>
        {NAV_LINKS.map(({ label, to, futurePath, icon }) => {
          const className = label === current ? 'nav-bar__mobile-link is-current' : 'nav-bar__mobile-link'
          return to ? (
            <Link key={label} to={to} className={className} aria-current={label === current ? 'page' : undefined} tabIndex={mobileMenuOpen ? 0 : -1} onClick={() => setMobileMenuOpen(false)}>
              <MobileDashboardIcon name={icon} />{label}
            </Link>
          ) : (
            <span key={label} className={className} aria-disabled="true" data-future-route={futurePath}>
              <MobileDashboardIcon name={icon} />{label}
            </span>
          )
        })}
        <div className="nav-bar__mobile-account"><span className="nav-bar__mobile-avatar">{avatarInitials}</span><span>{sessionUserName}</span></div>
        <button type="button" className="nav-bar__mobile-logout" disabled={logoutBusy} tabIndex={mobileMenuOpen ? 0 : -1} onClick={onLogout}>
          <MobileDashboardIcon name="logout" />{logoutBusy ? 'Logging out…' : 'Log out'}
        </button>
        {logoutError && <span className="nav-bar__mobile-error" role="alert">{logoutError}</span>}
      </nav>
    </header>
  )
}

export default NavBar
