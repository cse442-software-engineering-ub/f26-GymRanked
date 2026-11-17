import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import GymBackdrop from './components/GymBackdrop.jsx'
import MobileDashboardIcon from './MobileDashboardIcon.jsx'
import QuickSetLogger from './QuickSetLogger.jsx'
import { fetchCurrentPlan, fetchPlan } from './plansApi.js'
import CompleteWorkoutButton from './workoutLog/CompleteWorkoutButton.jsx'
import { summaryPath, upsertSet } from './workoutLog/setLog.js'
import { clearUnloggedSets, EMPTY_DRAFT, findUnloggedExercise, loadDraft, saveDraft } from './setDraft.js'
import { startSession } from './workoutSessionApi.js'
import workoutLogApi from './workoutLog/workoutLogApi.js'

// Active workout screen: the user selects an exercise and logs sets inline.
function ActiveWorkout() {
  const navigate = useNavigate()
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 640px)').matches)
  const [session, setSession] = useState(null)
  const [status, setStatus] = useState('loading') // loading | ready | none | loggedOut | error
  const [errorMessage, setErrorMessage] = useState('')
  const [current, setCurrent] = useState(0)
  // Saved sets for each exercise, by name: the stats row and the step pills are worked out from these.
  const [savedSets, setSavedSets] = useState({})
  const [completed, setCompleted] = useState(false)
  const [expectedMinutes, setExpectedMinutes] = useState(null)

  useEffect(() => {
    if (!session) return
    try { sessionStorage.setItem(`gymrank.activeExercise.${session.id}`, String(current)) } catch { /* Storage is optional. */ }
  }, [current, mobile, session])

  useEffect(() => {
    const query = window.matchMedia('(max-width: 640px)')
    const update = () => setMobile(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (!mobile || !session) return undefined
    let active = true
    fetchCurrentPlan().then(({ plan }) => (
      plan?.name === session.plan ? fetchPlan(plan.id) : null
    )).then((details) => {
      const day = details?.days?.find((item) => item.name === session.name)
      if (active) setExpectedMinutes(day?.duration_minutes ?? null)
    }).catch(() => { if (active) setExpectedMinutes(null) })
    return () => { active = false }
  }, [mobile, session?.id])

  useEffect(() => {
    startSession()
      .then((started) => {
        if (started.completed_at) {
          navigate(summaryPath(started.id), { replace: true })
          return
        }
        setSession(started)
        setCompleted(Boolean(started.completed_at))
        const saved = {}
        started.exercises.forEach((exercise) => {
          saved[exercise.name] = exercise.sets
        })
        // Reopen the selected exercise when returning to the workout.
        const firstEmpty = started.exercises.findIndex((exercise) => exercise.sets.length === 0)
        const fallback = firstEmpty > 0 ? firstEmpty : 0
        let selected = fallback
        try {
          const savedIndex = sessionStorage.getItem(`gymrank.activeExercise.${started.id}`)
          const remembered = Number(savedIndex)
          if (savedIndex !== null && Number.isInteger(remembered) && remembered >= 0 && remembered < started.exercises.length) selected = remembered
        } catch { /* Use the first unfinished exercise. */ }
        setCurrent(selected)
        setSavedSets(saved)
        setStatus('ready')
      })
      .catch((err) => {
        if (err.status === 401) setStatus('loggedOut')
        else if (err.status === 409) setStatus('none')
        else {
          setErrorMessage(err.message)
          setStatus('error')
        }
      })
  }, [])

  // Makes an exercise the current one and brings its card into view.
  function goTo(index) {
    setCurrent(index)
    document.querySelector('.active-workout__mobile-log')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  async function switchExercise(replacement) {
    const previousName = session.exercises[current].name
    try {
      const updated = await workoutLogApi.swapExercise({ sessionId: session.id, exercise: previousName, replacement })
      saveDraft(session.id, replacement, loadDraft(session.id, previousName))
      saveDraft(session.id, previousName, EMPTY_DRAFT)
      setSavedSets((previous) => {
        const next = { ...previous }
        delete next[previousName]
        next[replacement] = updated.exercises[current].sets
        return next
      })
      setSession(updated)
    } catch (error) {
      if (error.status === 401) setStatus('loggedOut')
      throw error
    }
  }

  const exercises = session?.exercises ?? []
  const allSets = Object.values(savedSets).flat()
  const setCount = allSets.length
  const volume = allSets.reduce((total, set) => total + set.weight_lb * set.reps, 0)
  const exercisesLogged = exercises.filter(({ name }) => (savedSets[name]?.length ?? 0) > 0).length
  const countFor = (name) => savedSets[name]?.length ?? 0

  return (
    <div className="dashboard-page active-workout-page">
      {status === 'ready' && <div className="active-workout__mobile-heading"><h1>Workouts</h1></div>}
      {status === 'ready' && (
        <GymBackdrop image="backdrops/dumbbells.webp" height={240} phoneHeight={200}>
          <span />
          <header className="dashboard-header">
            <div>
              <span className="dashboard-header__eyebrow">{completed ? 'WORKOUT COMPLETE' : mobile ? 'IN PROGRESS' : 'ACTIVE WORKOUT'}</span>
              <h1>{session.name}</h1>
              <p>{session.plan} · {session.focus}</p>
              {expectedMinutes && <p className="active-workout__mobile-time">About {expectedMinutes} min</p>}
              <div className="active-workout__hero-stats" aria-label="Workout progress">
                <span><strong>{setCount}</strong> {setCount === 1 ? 'set' : 'sets'} logged</span>
                <span><strong>{current + 1}</strong> of {exercises.length} exercises</span>
              </div>
            </div>
          </header>
        </GymBackdrop>
      )}
      <main className="dashboard-content" aria-busy={status === 'loading'}>
        {status === 'loading' && <p className="status">Starting your workout...</p>}
        {status === 'loggedOut' && (
          <p className="status">
            <Link to="/login">Log in</Link> to start your workout.
          </p>
        )}
        {status === 'error' && (
          <p className="status status--error" role="alert">
            Couldn&apos;t start your workout: {errorMessage}. Refresh the page to try again.
          </p>
        )}
        {status === 'none' && (
          <p className="status">
            There is no workout to start today: pick a plan or check for a rest day.{' '}
            <Link to="/weekly-plan">Back to your weekly plan</Link>
          </p>
        )}
        {status === 'ready' && (
          <>
            <section className="dashboard-metrics active-metrics" aria-label="Workout progress">
              <article className="dashboard-metric">
                <span className="dashboard-metric__icon" aria-hidden="true"><MobileDashboardIcon name="dumbbell" /></span>
                <div className="dashboard-metric__body">
                  <span className="dashboard-metric__label">Sets logged</span>
                  <strong className="dashboard-metric__value">{setCount}</strong>
                  <span className="dashboard-metric__hint">
                    {setCount === 0 ? 'Save your first set below' : `${setCount} saved so far`}
                  </span>
                </div>
              </article>
              <article className="dashboard-metric">
                <span className="dashboard-metric__icon" aria-hidden="true"><MobileDashboardIcon name="progress" /></span>
                <div className="dashboard-metric__body">
                  <span className="dashboard-metric__label">Volume</span>
                  <strong className="dashboard-metric__value">{Math.round(volume).toLocaleString()} lb</strong>
                  <span className="dashboard-metric__hint">Weight × reps, all sets</span>
                </div>
              </article>
              <article className="dashboard-metric">
                <span className="dashboard-metric__icon" aria-hidden="true"><MobileDashboardIcon name="calendar" /></span>
                <div className="dashboard-metric__body">
                  <span className="dashboard-metric__label">Exercises</span>
                  <strong className="dashboard-metric__value">{exercisesLogged} of {exercises.length}</strong>
                  <span className="active-progress" aria-hidden="true">
                    <span style={{ width: `${(exercisesLogged / exercises.length) * 100}%` }} />
                  </span>
                </div>
              </article>
            </section>

            <ol className="active-steps" aria-label="Exercises">
              {exercises.map(({ name }, index) => {
                const classes = ['active-step']
                if (index === current) classes.push('active-step--current')
                return (
                  <li key={name}>
                    <button
                      type="button"
                      className={classes.join(' ')}
                      aria-current={index === current ? 'step' : undefined}
                      onClick={() => goTo(index)}
                    >
                      <span className="active-step__index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                      <span className="active-step__name">{name}</span>
                      <span className="active-step__count">{countFor(name)} {countFor(name) === 1 ? 'set' : 'sets'}</span>
                    </button>
                  </li>
                )
              })}
            </ol>

            <p className="active-workout__position">
              Current exercise: {exercises[current].name} ({current + 1} of {exercises.length})
            </p>

            {!completed && (
              <div className="active-workout__mobile-log">
                <QuickSetLogger
                  key={`${session.id}-${exercises[current].name}`}
                  sessionId={session.id}
                  exercise={exercises[current].name}
                  exercisePosition={current + 1}
                  exerciseTotal={exercises.length}
                  sets={savedSets[exercises[current].name] ?? []}
                  totalVolume={volume}
                  workoutExercises={exercises.map(({ name }) => name)}
                  onSwitchExercise={switchExercise}
                  onSetSaved={(name, set) => setSavedSets((previous) => ({
                    ...previous,
                    [name]: upsertSet(previous[name] ?? [], set),
                  }))}
                />
              </div>
            )}

            <div className="active-workout__nav">
              <button
                type="button"
                className="wl-button wl-button--quiet"
                disabled={current === 0}
                onClick={() => goTo(current - 1)}
              >
                ‹ Previous exercise
              </button>
              <button
                type="button"
                className="wl-button wl-button--quiet"
                disabled={current + 1 >= exercises.length}
                onClick={() => goTo(current + 1)}
              >
                Next exercise ›
              </button>
            </div>

            <section className="active-workout__finish" aria-label="Workout actions">
              {!completed && <div className="active-workout__finish-copy"><h2>Ready to wrap up?</h2><p>Your logged sets are saved as you go.</p></div>}
              <CompleteWorkoutButton
                sessionId={session.id}
                setCount={setCount}
                completed={completed}
                buttonLabel={mobile ? 'Finish workout' : 'Complete workout'}
                retryLabel={mobile}
                findUnlogged={() => findUnloggedExercise(session.id, exercises.map(({ name }) => name))}
                findMissingExercises={() => exercises.filter(({ name }) => countFor(name) === 0).map(({ name }) => name)}
                onLogUnlogged={(name) => {
                  const index = exercises.findIndex((exercise) => exercise.name === name)
                  setCurrent(index)
                }}
                onEndUnlogged={() => clearUnloggedSets(session.id, exercises.map(({ name }) => name))}
                onCompleted={() => navigate(summaryPath(session.id))}
                onSessionEnded={() => setStatus('loggedOut')}
              />
              {!completed && <Link className="active-workout__leave" to="/dashboard">Leave and return later</Link>}
            </section>
            {completed && <Link to="/weekly-plan" className="active-workout__back">Back to weekly plan</Link>}
          </>
        )}
      </main>
    </div>
  )
}

export default ActiveWorkout
