import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import NavBar from '../NavBar.jsx'
import LeaderboardSwitch from '../leaderboard/LeaderboardSwitch.jsx'
import StandingsList from './StandingsList.jsx'
import WeeklyHero from './WeeklyHero.jsx'
import { getWeeklyStandings, joinWeeklyCompetition, leaveWeeklyCompetition } from './weeklyApi.js'
import { msUntilReset } from './weeklyFormat.js'
import './weekly.css'

const ACTION_ERRORS = {
  join: "Couldn't join the weekly competition. Try again.",
  leave: "Couldn't leave the weekly competition. Try again.",
}

// Weekly consistency competition: this week's standings among people with the same weekly training-day goal, your
// own place, and the time left before the Monday reset (Monday visual brief, page 3). Every number comes from
// api/weekly_standings.php. The standings load again whenever the tab comes back into view, so a workout finished in
// another tab or on Home shows up here without a manual refresh.
function WeeklyStandingsPage() {
  const navigate = useNavigate()
  const [state, setState] = useState({ status: 'loading', data: null, fetchedAt: 0 })
  const [clock, setClock] = useState(() => Date.now())
  const [busy, setBusy] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [notice, setNotice] = useState('')
  // Only the newest request may change the page; older answers (and answers after leaving the page) are dropped.
  const latest = useRef(0)
  const resetReloaded = useRef(null)

  const show = useCallback((data) => setState({ status: 'ready', data, fetchedAt: Date.now() }), [])

  // quiet: keep what is on screen while loading, and keep it if the request fails (used for background refreshes).
  const load = useCallback(async (quiet) => {
    const id = ++latest.current
    if (!quiet) setState({ status: 'loading', data: null, fetchedAt: 0 })
    const response = await getWeeklyStandings()
    if (id !== latest.current) return
    if (response.status === 401) navigate('/login', { replace: true })
    else if (response.ok) show(response.data)
    else if (!quiet) setState({ status: 'error', data: null, fetchedAt: 0 })
  }, [navigate, show])

  useEffect(() => {
    load(false)
    return () => { latest.current += 1 }
  }, [load])

  useEffect(() => {
    const refresh = () => { if (document.visibilityState === 'visible') load(true) }
    document.addEventListener('visibilitychange', refresh)
    window.addEventListener('focus', refresh)
    return () => {
      document.removeEventListener('visibilitychange', refresh)
      window.removeEventListener('focus', refresh)
    }
  }, [load])

  useEffect(() => {
    const timer = setInterval(() => setClock(Date.now()), 15000)
    return () => clearInterval(timer)
  }, [])

  const { status, data, fetchedAt } = state
  const msLeft = data ? msUntilReset(data, fetchedAt, Math.max(clock, fetchedAt)) : 0

  // When the week ends while the page is open, load the new week once.
  useEffect(() => {
    if (data && msLeft <= 0 && resetReloaded.current !== data.resets_at) {
      resetReloaded.current = data.resets_at
      load(true)
    }
  }, [data, msLeft, load])

  // Join or leave, then show the answer (the same body as GET) in place, without a loading flash.
  async function act(action, request) {
    if (busy) return
    setBusy(action)
    setActionError(null)
    setNotice('')
    const response = await request()
    if (response.status === 401) {
      navigate('/login', { replace: true })
      return
    }
    setBusy(null)
    if (!response.ok) {
      setActionError(ACTION_ERRORS[action])
      return
    }
    latest.current += 1
    if (response.data.rows) show(response.data)
    else load(true)
    if (action === 'leave') setNotice("You've left the weekly competition. Your workouts are kept.")
  }

  return (
    <div className="weekly-page">
      <NavBar current="Leaderboard" />
      <main className="weekly-page__content" aria-busy={status === 'loading'}>
        <LeaderboardSwitch />

        {notice && <p className="weekly-notice" role="status">{notice}</p>}

        {/* Until the standings arrive, the heading is the hidden one; then it's your card's "You're #2". */}
        {!data && <h1 className="weekly-sr-only">Weekly consistency</h1>}

        {status === 'loading' && <p className="weekly-status" role="status">Loading this week&apos;s standings…</p>}

        {status === 'error' && (
          <div className="weekly-error" role="alert">
            <p>Couldn&apos;t load this week&apos;s standings. Check your connection and try again.</p>
            <button type="button" className="weekly-button" onClick={() => load(false)}>Try again</button>
          </div>
        )}

        {data && (
          <>
            <WeeklyHero data={data} msLeft={msLeft} busy={busy} error={actionError}
              onJoin={() => act('join', joinWeeklyCompetition)} onLeave={() => act('leave', leaveWeeklyCompetition)} />
            <section className="weekly-standings" aria-label="This week's standings">
              <StandingsList rows={data.rows} targetDays={data.target_days} />
            </section>
          </>
        )}
      </main>
    </div>
  )
}

export default WeeklyStandingsPage
