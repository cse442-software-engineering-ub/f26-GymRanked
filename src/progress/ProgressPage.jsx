import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authRequest } from '../auth/api.js'
import NavBar from '../NavBar.jsx'
import workoutLogApi from '../workoutLog/workoutLogApi.js'
import ExerciseProgress from './ExerciseProgress.jsx'
import { NO_VALUE, RANGES, emptyRangeText, formatCount, formatPercent, formatPounds, rangeByKey, rangeDates } from './progressFormat.js'
import './progress.css'

// Story #8: pick one exercise and see its saved strength, volume and PR numbers and its trend, for the last 30 days,
// the last 90 days or all time (Sam's Sprint 1 design #30, focused on one exercise). Every number comes from
// api/exercise_progress.php (card 109); changing exercise needs no new request, changing range does.
function ProgressPage() {
  const navigate = useNavigate()
  const [range, setRange] = useState('all')
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState({ status: 'loading', progress: null })
  // Completed workouts in all history, known from the first (All time) answer; 0 shows the empty page.
  const [allTimeWorkouts, setAllTimeWorkouts] = useState(null)
  const [chosen, setChosen] = useState(null)
  const [fullName, setFullName] = useState('')

  useEffect(() => {
    let active = true
    authRequest('session')
      .then((data) => { if (active) setFullName(data.user.full_name.trim()) })
      .catch(() => {})
    return () => { active = false }
  }, [])

  useEffect(() => {
    let active = true
    setResult({ status: 'loading', progress: null })
    workoutLogApi.getExerciseProgress(rangeDates(range))
      .then((progress) => {
        if (!active) return
        setResult({ status: 'ready', progress })
        if (range === 'all') setAllTimeWorkouts(progress.summary.workouts)
      })
      .catch((error) => {
        if (!active) return
        if (error.status === 401) navigate('/login', { replace: true })
        else setResult({ status: 'error', progress: null })
      })
    return () => { active = false }
  }, [range, attempt, navigate])

  const { status, progress } = result
  const noHistory = allTimeWorkouts === 0
  const exercises = progress?.exercises ?? []
  // The chosen exercise stays while it is in the range; otherwise the first one, A to Z.
  const exercise = exercises.find((item) => item.exercise === chosen) ?? exercises[0] ?? null
  const rangeEmpty = status === 'ready' && progress.summary.workouts === 0
  const summary = status === 'ready' && !rangeEmpty ? progress.summary : null
  const line = rangeByKey(range).line

  return (
    <div className="progress-page">
      <NavBar current="Progress" />
      <main className="progress-page__content" aria-busy={status === 'loading'}>
        <div className="progress-page__heading">
          <h1>Your progress</h1>
          <p>{fullName ? `${fullName} · ${line}` : line}</p>
        </div>

        {!noHistory && (
          <div className="progress-range" role="group" aria-label="Time range">
            {RANGES.map((item) => (
              <button key={item.key} type="button" aria-pressed={range === item.key} onClick={() => setRange(item.key)}>
                {item.label}
              </button>
            ))}
          </div>
        )}

        {status === 'loading' && <p className="progress-page__status">Loading your progress...</p>}

        {status === 'error' && (
          <div className="progress-error" role="alert">
            <p>Couldn&apos;t load your progress. Check your connection and try again.</p>
            <button type="button" onClick={() => setAttempt((value) => value + 1)}>Try again</button>
          </div>
        )}

        {status === 'ready' && noHistory && (
          <section className="progress-empty" aria-labelledby="progress-empty-title">
            <h2 id="progress-empty-title">No progress to track yet</h2>
            <p>Log your first workout and your volume, personal records, and strength trends will start showing up here.</p>
            <Link to="/weekly-plan" className="button-primary progress-empty__action">Start a workout</Link>
          </section>
        )}

        {status === 'ready' && !noHistory && (
          <>
            <div className="progress-summary">
              {[
                ['Volume', summary ? formatPounds(summary.total_volume_lb) : NO_VALUE],
                ['Strength gain', summary ? formatPercent(summary.strength_gain_pct) : NO_VALUE],
                ['New PRs', summary ? formatCount(summary.new_prs) : NO_VALUE],
                ['Workouts logged', summary ? formatCount(summary.workouts) : NO_VALUE],
              ].map(([label, value]) => (
                <div key={label} className="progress-metric">
                  <span className="progress-metric__label">{label}</span>
                  <strong className="progress-metric__value">{value}</strong>
                </div>
              ))}
            </div>
            {rangeEmpty && <p className="progress-page__status">{emptyRangeText(range)}</p>}
          </>
        )}

        <Link to="/progress/history" className="progress-history-link">
          <span>
            <span className="progress-history-link__title">Workout history</span>
            <span className="progress-history-link__caption">Every finished workout, set by set</span>
          </span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </Link>

        {status === 'ready' && exercise && (
          <>
            <div className="progress-picker">
              <label htmlFor="progress-exercise">Exercise</label>
              <select id="progress-exercise" value={exercise.exercise} onChange={(event) => setChosen(event.target.value)}>
                {exercises.map((item) => (
                  <option key={item.exercise} value={item.exercise}>{item.exercise}</option>
                ))}
              </select>
            </div>
            <ExerciseProgress
              exercise={exercise}
              prs={progress.prs.filter((pr) => pr.exercise === exercise.exercise)}
            />
          </>
        )}
      </main>
    </div>
  )
}

export default ProgressPage
