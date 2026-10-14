import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import NavBar from '../NavBar.jsx'
import WorkoutLogger from './WorkoutLogger.jsx'
import workoutLogApi from './workoutLogApi.js'
import { summaryPath } from './setLog.js'

export default function ActiveWorkoutPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState({ status: 'loading' })

  useEffect(() => {
    let active = true
    setState({ status: 'loading' })
    const load = sessionId ? workoutLogApi.getSession(sessionId) : workoutLogApi.startSession()
    load.then((session) => {
      if (!active) return
      if (!session?.id || !Array.isArray(session.exercises)) {
        setState({ status: 'error', message: 'This workout could not be loaded.' })
      } else if (session.completed_at) {
        navigate(summaryPath(session.id), { replace: true })
      } else {
        setState({ status: 'ready', session })
      }
    }).catch((error) => {
      if (!active) return
      if (error.status === 401) navigate('/login', { replace: true })
      else setState({ status: 'error', message: error.message || 'This workout could not be loaded.' })
    })
    return () => { active = false }
  }, [sessionId, attempt, navigate])

  const session = state.session
  const savedSets = session?.exercises.flatMap(({ name, sets }) =>
    (sets || []).map((set) => ({ ...set, exercise: name }))) || []

  return (
    <div className="dashboard-page">
      <NavBar current="Today" />
      <main className="dashboard-content">
        <header className="dashboard-header">
          <div>
            <span className="dashboard-header__eyebrow">TODAY'S WORKOUT</span>
            <h1>{session?.name || 'Your workout'}</h1>
            {session && <p>{session.plan} · {session.focus}</p>}
          </div>
        </header>
        {state.status === 'loading' && <p className="status" role="status">Loading your workout…</p>}
        {state.status === 'error' && (
          <section className="status status--error" role="alert">
            <p>{state.message}</p>
            <button type="button" onClick={() => setAttempt((value) => value + 1)}>Try again</button>
            <p><Link to="/weekly-plan">View your weekly plan</Link> or <Link to="/dashboard">return to dashboard</Link>.</p>
          </section>
        )}
        {state.status === 'ready' && (
          <WorkoutLogger
            key={session.id}
            sessionId={session.id}
            exercises={session.exercises.map(({ name }) => name)}
            savedSets={savedSets}
            onSessionEnded={() => navigate('/login', { replace: true })}
          />
        )}
      </main>
    </div>
  )
}
