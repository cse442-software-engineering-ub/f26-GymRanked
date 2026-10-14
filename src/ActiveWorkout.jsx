import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import BodyFigure from './BodyFigure.jsx'
import GymBackdrop from './components/GymBackdrop.jsx'
import { MUSCLE_LABELS, musclesFor } from './exerciseMuscles.js'
import MobileDashboardIcon from './MobileDashboardIcon.jsx'
import NavBar from './NavBar.jsx'
import CompleteWorkoutButton from './workoutLog/CompleteWorkoutButton.jsx'
import { formatSet } from './workoutLog/setLog.js'
import { loadFinished } from './finishedExercises.js'
import { startSession } from './workoutSessionApi.js'

// Active workout screen: the user steps through the exercises of today's workout, saving each set with the
// story #7 set logger and resting between sets. Every exercise's logger stays mounted (only the current one
// is shown) so typed values and saved sets survive moving between exercises.
// The muscles an exercise works, written out next to the highlighted body figure.
function ExerciseMuscles({ name, finished }) {
  const muscles = musclesFor(name)
  if (muscles.length === 0 && !finished) return null
  return (
    <div className="active-muscles">
      <span className="active-muscles__text">{muscles.map((muscle) => MUSCLE_LABELS[muscle]).join(' · ')}</span>
      <BodyFigure muscles={muscles} />
      {finished && <span className="active-muscles__done">✓ Finished</span>}
    </div>
  )
}

function ActiveWorkout() {
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [status, setStatus] = useState('loading') // loading | ready | none | loggedOut | error
  const [errorMessage, setErrorMessage] = useState('')
  const [current, setCurrent] = useState(0)
  // Saved sets for each exercise, by name: the stats row and the step pills are worked out from these.
  const [savedSets, setSavedSets] = useState({})
  // Names of the exercises the user finished on their own page (ticked below).
  const [finished, setFinished] = useState(() => new Set())
  const [completed, setCompleted] = useState(false)

  useEffect(() => {
    startSession()
      .then((started) => {
        setSession(started)
        setCompleted(Boolean(started.completed_at))
        const saved = {}
        started.exercises.forEach((exercise) => {
          saved[exercise.name] = exercise.sets
        })
        // Reopening an unfinished workout lands on its first exercise that still has no sets.
        const firstEmpty = started.exercises.findIndex((exercise) => exercise.sets.length === 0)
        if (firstEmpty > 0) setCurrent(firstEmpty)
        setSavedSets(saved)
        setFinished(loadFinished(started.id))
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
    document.getElementById(`exercise-${index}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  const exercises = session?.exercises ?? []
  const allSets = Object.values(savedSets).flat()
  const setCount = allSets.length
  const volume = allSets.reduce((total, set) => total + set.weight_lb * set.reps, 0)
  const exercisesFinished = exercises.filter(({ name }) => finished.has(name)).length
  const countFor = (name) => savedSets[name]?.length ?? 0

  return (
    <div className="dashboard-page">
      <NavBar current="Workouts" />
      {status === 'ready' && (
        <GymBackdrop image="backdrops/dumbbells.webp" height={240} phoneHeight={200}>
          <span />
          <header className="dashboard-header">
            <div>
              <span className="dashboard-header__eyebrow">{completed ? 'WORKOUT COMPLETE' : 'ACTIVE WORKOUT'}</span>
              <h1>{session.name}</h1>
              <p>{session.plan} · {session.focus}</p>
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
                  <strong className="dashboard-metric__value">{exercisesFinished} of {exercises.length}</strong>
                  <span className="active-progress" aria-hidden="true">
                    <span style={{ width: `${(exercisesFinished / exercises.length) * 100}%` }} />
                  </span>
                </div>
              </article>
            </section>

            <ol className="active-steps" aria-label="Exercises">
              {exercises.map(({ name }, index) => {
                const classes = ['active-step']
                if (index === current) classes.push('active-step--current')
                if (finished.has(name)) classes.push('active-step--done')
                return (
                  <li key={name}>
                    <button
                      type="button"
                      className={classes.join(' ')}
                      aria-current={index === current ? 'step' : undefined}
                      onClick={() => goTo(index)}
                    >
                      {finished.has(name) ? '✓ ' : ''}{name}
                    </button>
                  </li>
                )
              })}
            </ol>

            <p className="active-workout__position">
              Current exercise: {exercises[current].name} ({current + 1} of {exercises.length})
            </p>

            <div className="wl-workout">
              {exercises.map((exercise, index) => (
                <div
                  key={exercise.name}
                  id={`exercise-${index}`}
                  className={index === current ? 'active-exercise active-exercise--current' : 'active-exercise'}
                  onFocus={() => setCurrent(index)}
                >
                  <ExerciseMuscles name={exercise.name} finished={finished.has(exercise.name)} />
                  <section className="wl-exercise active-begin" aria-label={exercise.name}>
                    <div className="wl-exercise__header">
                      <h3>{exercise.name}</h3>
                      <span className="wl-exercise__count">
                        {countFor(exercise.name) === 0
                          ? 'Not started'
                          : `${countFor(exercise.name)} ${countFor(exercise.name) === 1 ? 'set' : 'sets'}`}
                      </span>
                    </div>
                    {countFor(exercise.name) > 0 && (
                      <ol className="active-saved-sets">
                        {savedSets[exercise.name].map((set) => (
                          <li key={set.id}>
                            <span>Set {set.set_number}</span>
                            <strong>{formatSet(set)}</strong>
                          </li>
                        ))}
                      </ol>
                    )}
                    {!completed && (
                      <button
                        type="button"
                        className={`wl-button wl-button--wide ${finished.has(exercise.name) ? 'wl-button--quiet' : 'wl-button--primary'}`}
                        onClick={() => navigate(`/workout/active/${index}`)}
                      >
                        {countFor(exercise.name) === 0 ? 'Begin exercise' : 'Continue exercise'}
                      </button>
                    )}
                  </section>
                </div>
              ))}
            </div>

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

            <CompleteWorkoutButton
              sessionId={session.id}
              setCount={setCount}
              completed={completed}
              onCompleted={() => setCompleted(true)}
              onSessionEnded={() => setStatus('loggedOut')}
            />
            {completed && <Link to="/weekly-plan" className="active-workout__back">Back to weekly plan</Link>}
          </>
        )}
      </main>
    </div>
  )
}

export default ActiveWorkout
