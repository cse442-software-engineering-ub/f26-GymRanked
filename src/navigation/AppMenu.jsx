import { Link, useLocation } from 'react-router-dom'
import MobileDashboardIcon from '../MobileDashboardIcon.jsx'
import { MENU_GROUPS, PROFILE_PATH, currentFor, initialsOf } from './menuMap.js'

// The GymRank mark and name, linking to the Dashboard. Shown at the top of the sidebar, of the phone strip and of
// the phone menu.
export function MenuBrand({ onNavigate }) {
  return (
    <Link className="app-brand" to="/dashboard" aria-label="GymRank dashboard" onClick={onNavigate}>
      <span className="app-brand__mark" aria-hidden="true"><MobileDashboardIcon name="dumbbell" /></span>
      <span className="app-brand__name">GymRank</span>
    </Link>
  )
}

// The menu itself: the groups from the menu map, then the profile row and "Log out". The sidebar and the phone menu
// both render this, so they always hold the same rows. `label` names the landmark ("Primary" in the sidebar,
// "Mobile navigation" in the phone menu). The row for the open section gets aria-current and the highlight.
function AppMenu({ label, userName, onNavigate, onLogout, logoutBusy, logoutError }) {
  const { pathname } = useLocation()
  const profileCurrent = currentFor(pathname, 'profile', PROFILE_PATH)

  return (
    <nav className="app-menu" aria-label={label}>
      {MENU_GROUPS.map((group) => (
        <div key={group.name} className="app-menu__group" role="group" aria-label={group.name}>
          <p className="app-menu__group-name" aria-hidden="true">{group.name}</p>
          {group.links.map((link) => (
            <Link key={link.section} to={link.to} className="app-menu__link"
              aria-current={currentFor(pathname, link.section, link.to)} onClick={onNavigate}>
              <MobileDashboardIcon name={link.icon} />
              <span>{link.label}</span>
            </Link>
          ))}
        </div>
      ))}

      <div className="app-menu__foot">
        <Link to={PROFILE_PATH} className="app-menu__profile" aria-current={profileCurrent} onClick={onNavigate}>
          <span className="app-menu__avatar" aria-hidden="true">{initialsOf(userName)}</span>
          <span className="app-menu__who">
            <strong>{userName || 'Your account'}</strong>
            <small>View profile</small>
          </span>
          <MobileDashboardIcon name="chevron" />
        </Link>
        <button type="button" className="app-menu__logout" disabled={logoutBusy} onClick={onLogout}>
          <MobileDashboardIcon name="logout" />
          <span>{logoutBusy ? 'Logging out…' : 'Log out'}</span>
        </button>
        {logoutError && <p className="app-menu__error" role="alert">{logoutError}</p>}
      </div>
    </nav>
  )
}

export default AppMenu
