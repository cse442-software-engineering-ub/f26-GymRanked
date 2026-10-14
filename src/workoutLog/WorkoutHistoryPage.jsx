import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import NavBar from '../NavBar.jsx'
import workoutLogApi from './workoutLogApi.js'
import { summaryPath } from './setLog.js'
import { formatDuration, formatVolume } from './workoutSummary.js'
import './workoutSummary.css'

export default function WorkoutHistoryPage() {
  const navigate = useNavigate()
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState({ status: 'loading' })

  useEffect(() => {
    let active = true
    setState({ status: 'loading' })
    workoutLogApi.getHistory().then((sessions) => {
      if (active) setState({ status: 'ready', sessions: Array.isArray(sessions) ? sessions : [] })
    }).catch((error) => {
      if (!active) return
      if (error.status === 401) navigate('/login', { replace: true })
      else setState({ status: 'error' })
    })
    return () => { active = false }
  }, [attempt, navigate])

  return (
    <div className="workout-summary-page">
      <NavBar current="Workouts" />
      <main className="workout-summary workout-history">
        <p className="workout-summary__eyebrow">Your training</p>
        <h1>Workout history</h1>
        <p className="workout-history__intro">Review your completed workouts and open any session summary.</p>
        {state.status === 'loading' && <p role="status">Loading your workout history…</p>}
        {state.status === 'error' && (
          <div role="alert">
            <p>Couldn't load your workout history. Check your connection and try again.</p>
            <button type="button" className="workout-summary__secondary" onClick={() => setAttempt((value) => value + 1)}>Try again</button>
          </div>
        )}
        {state.status === 'ready' && state.sessions.length === 0 && (
          <div className="workout-history__empty">
            <h2>No completed workouts yet</h2>
            <p>Finished workouts will appear here.</p>
            <Link to="/dashboard">Return to dashboard</Link>
          </div>
        )}
        {state.status === 'ready' && state.sessions.length > 0 && (
          <ol className="workout-history__list">
            {state.sessions.map((session) => (
              <li key={session.id}>
                <Link to={summaryPath(session.id)}>
                  <div>
                    <strong>{session.name}</strong>
                    <span>{session.plan} · {new Date(session.completed_at).toLocaleDateString()}</span>
                  </div>
                  <span>{formatVolume(session.total_volume_lb)} · {formatDuration(session.duration_seconds)}</span>
                  <span aria-hidden="true">›</span>
                </Link>
              </li>
            ))}
          </ol>
        )}
        <Link className="workout-history__back" to="/dashboard">← Back to dashboard</Link>
      </main>
    </div>
  )
}
