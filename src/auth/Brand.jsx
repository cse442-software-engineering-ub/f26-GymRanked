import { Link } from 'react-router-dom'
import MobileDashboardIcon from '../MobileDashboardIcon.jsx'

// The GymRank mark on the entry screens: the same dumbbell square as the menu's (src/navigation/AppMenu.jsx), so the
// brand panel and the sidebar it turns into carry one mark.
export default function Brand() {
  return <Link className="brand" to="/login" aria-label="GymRank login">
    <span className="brand__mark" aria-hidden="true"><MobileDashboardIcon name="dumbbell" /></span>GymRank
  </Link>
}
