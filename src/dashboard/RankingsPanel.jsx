import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import MobileDashboardIcon from '../MobileDashboardIcon.jsx'
import { getLeaderboard } from '../leaderboard/leaderboardApi.js'
import { getWeeklyStandings } from '../weekly/weeklyApi.js'
import { strengthRow, weeklyRow } from './dashboardFormat.js'

// "Your rankings": your weekly consistency rank and overall strength rank, among everyone or only your buddies group
// (?scope=buddies on api/weekly_standings.php and api/leaderboard.php). hasGroup is null while the buddies group is
// loading, then true or false; without a group the Buddies choice asks you to join one instead of ranking you alone.
export default function RankingsPanel({ hasGroup, attempt }) {
  const [scope, setScope] = useState('everyone')
  const [state, setState] = useState({ status: 'loading', weekly: null, strength: null })
  const [retry, setRetry] = useState(0)
  const needsGroup = scope === 'buddies' && hasGroup === false
  const waiting = scope === 'buddies' && hasGroup === null

  useEffect(() => {
    if (needsGroup || waiting) return undefined
    let active = true
    setState({ status: 'loading', weekly: null, strength: null })
    Promise.all([getWeeklyStandings(scope), getLeaderboard('overall', scope)]).then(([weekly, strength]) => {
      if (!active) return
      setState(weekly.ok || strength.ok
        ? { status: 'ready', weekly: weekly.ok ? weekly.data : null, strength: strength.ok ? strength.data : null }
        : { status: 'error', weekly: null, strength: null })
    })
    return () => { active = false }
  }, [scope, needsGroup, waiting, attempt, retry])

  const rows = [
    { key: 'weekly', title: 'Weekly consistency', to: '/leaderboard/weekly', ...weeklyRow(state.weekly) },
    { key: 'strength', title: 'Overall strength', to: '/leaderboard', ...strengthRow(state.strength) },
  ]
  return (
    <section className="home-rankings" aria-labelledby="home-rankings-title">
      <header className="home-section-heading">
        <h2 id="home-rankings-title">Your rankings</h2>
        <label className="home-rankings__scope">
          <span className="home-sr-only">Rank among</span>
          <select value={scope} onChange={(event) => setScope(event.target.value)}>
            <option value="everyone">Everyone</option>
            <option value="buddies">Buddies</option>
          </select>
        </label>
      </header>
      {needsGroup ? (
        <p className="home-muted">Join a buddies group to see how you rank against your friends. <Link to="/buddies">Open Buddies</Link></p>
      ) : state.status === 'error' ? (
        <p className="home-error" role="alert">
          Couldn't load your rankings. <button type="button" onClick={() => setRetry((value) => value + 1)}>Try again</button>
        </p>
      ) : state.status === 'loading' || waiting ? (
        <p className="home-muted" role="status">Loading your rankings…</p>
      ) : (
        <ul className="home-rankings__list">
          {rows.map((row) => (
            <li key={row.key}>
              <Link to={row.to} className="home-rankings__row">
                <span className="home-rankings__name"><strong>{row.title}</strong><span>{row.detail}</span></span>
                <span className="home-rankings__rank">{row.rank}</span>
                <MobileDashboardIcon name="chevron" className="home-rankings__chevron" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
