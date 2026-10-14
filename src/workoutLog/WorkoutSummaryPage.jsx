import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import NavBar from '../NavBar.jsx'
import MobileDashboardIcon from '../MobileDashboardIcon.jsx'
import workoutLogApi from './workoutLogApi.js'
import { displaySummary } from './workoutSummary.js'
import './workoutSummary.css'

// Sample content for the design preview only. Real sessions never display these example numbers.
const PREVIEW_SUMMARY = {
  workoutName: 'Push day',
  duration: '52 min 14 sec',
  totalVolume: '18,420 lb',
  setsCompleted: 21,
  exerciseCount: 5,
  newPrs: 2,
  highlights: [
    { exercise: 'Bench press', topSet: '185 lb × 5', versusLast: '+5 lb', improved: true },
    { exercise: 'Incline dumbbell press', topSet: '70 lb × 8', versusLast: 'PR', improved: true },
    { exercise: 'Cable fly', topSet: '40 lb × 12', versusLast: '—' },
    { exercise: 'Tricep pushdown', topSet: '55 lb × 12', versusLast: 'PR', improved: true },
  ],
}

function SummaryIcon({ name, className = '' }) {
  if (name === 'dumbbell' || name === 'trophy') return <MobileDashboardIcon name={name} className={className} />
  const paths = {
    check: <path d="m5 12 4 4L19 6" />,
    volume: <><path d="M5 19v-5m7 5V9m7 10V4" /></>,
    sets: <><path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5" /></>,
    list: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
    arrow: <><path d="M4 12h16m-6-6 6 6-6 6" /></>,
    share: <><path d="M12 15V3m-4 4 4-4 4 4" /><path d="M5 13v7h14v-7" /></>,
  }
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

function Metric({ label, value, icon, accent = false }) {
  return (
    <article className="workout-summary__metric">
      <span className={accent ? 'workout-summary__metric-icon workout-summary__metric-icon--accent' : 'workout-summary__metric-icon'}><SummaryIcon name={icon} /></span>
      <div>
        <span className="workout-summary__metric-label">{label}</span>
        <strong className={accent ? 'workout-summary__metric-value workout-summary__metric-value--accent' : 'workout-summary__metric-value'}>{value}</strong>
      </div>
    </article>
  )
}

export default function WorkoutSummaryPage({ preview = false }) {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const [shareStatus, setShareStatus] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState({ status: preview ? 'ready' : 'loading' })

  useEffect(() => {
    if (preview) return undefined
    let active = true
    setState({ status: 'loading' })
    workoutLogApi.getSession(sessionId).then((session) => {
      if (!active) return
      if (!session?.id || !Array.isArray(session.exercises)) {
        setState({ status: 'error', message: 'This workout could not be loaded.' })
      } else {
        setState({ status: 'ready', session })
      }
    }).catch((error) => {
      if (!active) return
      if (error.status === 401) navigate('/login', { replace: true })
      else setState({ status: 'error', message: error.status === 404 ? 'This workout was not found.' : "Couldn't load this workout. Check your connection and try again." })
    })
    return () => { active = false }
  }, [preview, sessionId, attempt, navigate])

  const summary = preview ? PREVIEW_SUMMARY : displaySummary(state.session)
  const highlights = Array.isArray(summary?.highlights) ? summary.highlights : []

  async function shareSummary() {
    const text = `${preview ? 'Sample GymRank workout: ' : 'GymRank workout: '}${summary.workoutName} · ${summary.duration} · ${summary.totalVolume} total volume · ${summary.setsCompleted} sets${preview ? ` · ${summary.newPrs} new PRs` : ''}`
    try {
      if (navigator.share) {
        await navigator.share({ title: 'GymRank workout summary', text })
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
        setShareStatus('Summary copied to clipboard.')
      } else {
        setShareStatus('Sharing is unavailable in this browser.')
      }
    } catch (error) {
      if (error.name !== 'AbortError') setShareStatus('Could not share the summary. Try again.')
    }
  }

  return (
    <div className="workout-summary-page">
      <NavBar current="Workouts" />
      <main className="workout-summary">
        {preview && <p className="workout-summary__preview">Design preview · Example workout data</p>}
        {!preview && state.status === 'loading' ? (
          <section className="workout-summary__empty" role="status"><h1>Loading workout summary…</h1></section>
        ) : !preview && state.status === 'error' ? (
          <section className="workout-summary__empty" role="alert">
            <h1>Workout summary unavailable</h1>
            <p>{state.message}</p>
            <button type="button" className="workout-summary__primary" onClick={() => setAttempt((value) => value + 1)}>Try again</button>
            <Link to="/dashboard">Return to dashboard</Link>
          </section>
        ) : !summary ? (
          <section className="workout-summary__empty">
            <h1>Workout still in progress</h1>
            <p>Complete this workout to see its summary.</p>
            <Link to={`/workouts/${sessionId}`}>Return to workout</Link>
          </section>
        ) : (
          <>
            <header className="workout-summary__hero">
              <div className="workout-summary__intro">
                <span className="workout-summary__eyebrow">Session complete</span>
                <div className="workout-summary__headline">
                  <span className="workout-summary__check"><SummaryIcon name="check" /></span>
                  <div>
                    <h1 id="workout-summary-title">Workout complete</h1>
                    <p>{summary.workoutName} <span aria-hidden="true">·</span> {summary.duration}</p>
                  </div>
                </div>
              </div>
              {preview && summary.newPrs > 0 && (
                <aside className="workout-summary__pr" aria-label="Personal records">
                  <SummaryIcon name="trophy" />
                  <div><strong>{summary.newPrs} new personal records</strong><span>Great work! You set {summary.newPrs} new PRs in this session.</span></div>
                </aside>
              )}
            </header>

            <section className="workout-summary__metrics" aria-label="Session statistics">
              <Metric label="Total volume" value={summary.totalVolume} icon="volume" />
              <Metric label="Sets completed" value={summary.setsCompleted} icon="sets" />
              <Metric label="Exercises" value={summary.exerciseCount} icon="dumbbell" />
              {preview ? <Metric label="New PRs" value={summary.newPrs} icon="trophy" accent /> : <Metric label="Total reps" value={summary.totalReps} icon="list" />}
            </section>

            <section className="workout-summary__highlights" aria-labelledby="workout-summary-highlights">
              <header className="workout-summary__section-heading">
                <SummaryIcon name="list" />
                <div><h2 id="workout-summary-highlights">Session highlights</h2><p>{preview ? 'Your strongest sets and progress from last time.' : 'Your top logged set for each exercise.'}</p></div>
              </header>
              {highlights.length > 0 ? (
                <table>
                  <thead><tr><th scope="col">Exercise</th><th scope="col">Top set</th><th scope="col">{preview ? 'Vs last' : 'Sets logged'}</th></tr></thead>
                  <tbody>
                    {highlights.map((item) => (
                      <tr key={item.exercise}>
                        <th scope="row"><SummaryIcon name="dumbbell" />{item.exercise}</th>
                        <td data-label="Top set">{item.topSet}</td>
                        {preview ? <td data-label="Vs last" className={item.improved ? 'workout-summary__improved' : 'workout-summary__no-change'}>{item.versusLast}</td> : <td data-label="Sets logged">{item.setCount}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <p className="workout-summary__no-highlights">No sets were recorded for this workout.</p>}
            </section>

            <div className="workout-summary__actions">
              <button type="button" className="workout-summary__primary" onClick={() => navigate('/dashboard')}>Return to dashboard <SummaryIcon name="arrow" /></button>
              <button type="button" className="workout-summary__secondary" onClick={shareSummary}><SummaryIcon name="share" /> Share summary</button>
            </div>
            {shareStatus && <p className="workout-summary__share-status" role="status">{shareStatus}</p>}
          </>
        )}
      </main>
    </div>
  )
}
