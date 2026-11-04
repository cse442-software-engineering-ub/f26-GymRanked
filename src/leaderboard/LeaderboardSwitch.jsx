import { NavLink } from 'react-router-dom'
import './leaderboard.css'

// The two leaderboard views, at the top of both: this week's consistency competition and the all-time Strength
// (DOTS) boards. NavLink marks the open one with aria-current="page"; `end` keeps Strength from matching /weekly.
export default function LeaderboardSwitch() {
  return (
    <nav className="leaderboard-switch" aria-label="Leaderboards">
      <NavLink to="/leaderboard/weekly" end>Weekly consistency</NavLink>
      <NavLink to="/leaderboard" end>Strength</NavLink>
    </nav>
  )
}
