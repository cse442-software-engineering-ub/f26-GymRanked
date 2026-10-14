import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import NavBar from '../NavBar.jsx'
import MobileDashboardIcon from '../MobileDashboardIcon.jsx'
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

// A future summary response can be passed as location.state.summary with the same display fields.
// Until that data exists, the completed-session route shows an honest unavailable state.
export default function WorkoutSummaryPage({ preview = false }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [shareStatus, setShareStatus] = useState('')
  const summary = preview ? PREVIEW_SUMMARY : location.state?.summary
  const highlights = Array.isArray(summary?.highlights) ? summary.highlights : []

  async function shareSummary() {
    const text = `${preview ? 'Sample GymRank workout: ' : 'GymRank workout: '}${summary.workoutName} · ${summary.duration} · ${summary.totalVolume} total volume · ${summary.newPrs} new PRs`
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
        {!summary ? (
          <section className="workout-summary__empty" aria-labelledby="workout-summary-title">
            <span className="workout-summary__check"><SummaryIcon name="check" /></span>
            <h1 id="workout-summary-title">Workout complete</h1>
            <p>Your workout is complete. Session details are not available yet.</p>
            <button type="button" className="workout-summary__primary" onClick={() => navigate('/dashboard')}>Return home <SummaryIcon name="arrow" /></button>
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
              {summary.newPrs > 0 && (
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
              <Metric label="New PRs" value={summary.newPrs} icon="trophy" accent />
            </section>

            <section className="workout-summary__highlights" aria-labelledby="workout-summary-highlights">
              <header className="workout-summary__section-heading">
                <SummaryIcon name="list" />
                <div><h2 id="workout-summary-highlights">Session highlights</h2><p>Your strongest sets and progress from last time.</p></div>
              </header>
              {highlights.length > 0 ? (
                <table>
                  <thead><tr><th scope="col">Exercise</th><th scope="col">Top set</th><th scope="col">Vs last</th></tr></thead>
                  <tbody>
                    {highlights.map((item) => (
                      <tr key={item.exercise}>
                        <th scope="row"><SummaryIcon name="dumbbell" />{item.exercise}</th>
                        <td data-label="Top set">{item.topSet}</td>
                        <td data-label="Vs last" className={item.improved ? 'workout-summary__improved' : 'workout-summary__no-change'}>{item.versusLast}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <p className="workout-summary__no-highlights">Exercise comparisons are not available for this workout.</p>}
            </section>

            <div className="workout-summary__actions">
              <button type="button" className="workout-summary__primary" onClick={() => navigate('/dashboard')}>Save and return home <SummaryIcon name="arrow" /></button>
              <button type="button" className="workout-summary__secondary" onClick={shareSummary}><SummaryIcon name="share" /> Share summary</button>
            </div>
            {shareStatus && <p className="workout-summary__share-status" role="status">{shareStatus}</p>}
          </>
        )}
      </main>
    </div>
  )
}
