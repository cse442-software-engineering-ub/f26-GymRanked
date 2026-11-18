import { NavLink } from 'react-router-dom'
import { rankingHref } from './rankingScope.js'
import './leaderboard.css'

// The two leaderboard views, at the top of both: this week's consistency competition and the all-time Strength
// (DOTS) boards. NavLink marks the open one with aria-current="page"; `end` keeps Strength from matching /weekly.
// Both links carry the audience (Everyone or Buddies), so switching boards keeps it (card 139).
export default function LeaderboardSwitch({ scope }) {
  return (
    <nav className="leaderboard-switch" aria-label="Leaderboards">
      <NavLink to={rankingHref('/leaderboard/weekly', { scope })} end>Weekly consistency</NavLink>
      <NavLink to={rankingHref('/leaderboard', { scope })} end>Strength</NavLink>
    </nav>
  )
}
