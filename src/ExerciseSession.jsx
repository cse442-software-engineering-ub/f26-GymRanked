import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import BodyFigure from './BodyFigure.jsx'
import Breadcrumb from './Breadcrumb.jsx'
import { markFinished } from './finishedExercises.js'
import { EMPTY_DRAFT, loadDraft, saveDraft } from './setDraft.js'
import { MUSCLE_LABELS, musclesFor } from './exerciseMuscles.js'
import NavBar from './NavBar.jsx'
import RestTimer from './RestTimer.jsx'
import { formatSet, nextSetNumber, saveErrorMessage, upsertSet } from './workoutLog/setLog.js'
import { validateSet } from './workoutLog/setValidation.js'
import workoutLogApi from './workoutLog/workoutLogApi.js'
import { startSession } from './workoutSessionApi.js'
import './workoutLog/workoutLog.css'

const DEFAULT_REST_SECONDS = 90

function formatClock(seconds) {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

// One exercise of the active workout (opened by "Begin exercise"): for each set the user starts a timer,
// can pause and end it, enters the weight and reps, and finishes the set, which saves it and starts a rest.
function ExerciseSession() {
  const { exerciseIndex } = useParams()
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [status, setStatus] = useState('loading') // loading | ready | missing | loggedOut | error
  const [errorMessage, setErrorMessage] = useState('')
  const [sets, setSets] = useState([])
  // The set the user is in the middle of (see setDraft.js). The timer is idle until Start, then running or
  // paused, and ended once the set is finished; it counts from timestamps so it keeps going while away.
  const [draft, setDraft] = useState(EMPTY_DRAFT)
  const [now, setNow] = useState(() => Date.now())
  const [fieldErrors, setFieldErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const index = Number(exerciseIndex)
  const exercise = session?.exercises[index]

  useEffect(() => {
    startSession()
      .then((started) => {
        setSession(started)
        const found = started.exercises[index]
        if (!found || started.completed_at) {
          setStatus('missing')
          return
        }
        setSets(found.sets.map((set) => ({ ...set, exercise: found.name })))
        setDraft(loadDraft(started.id, found.name))
        setStatus('ready')
      })
      .catch((err) => {
        if (err.status === 401) setStatus('loggedOut')
        else if (err.status === 409) setStatus('missing')
        else {
          setErrorMessage(err.message)
          setStatus('error')
        }
      })
  }, [index])

  // Remember the set in progress, once it has been loaded back.
  useEffect(() => {
    if (status === 'ready') saveDraft(session.id, exercise.name, draft)
  }, [draft]) // eslint-disable-line react-hooks/exhaustive-deps

  const timer = draft.timer
  const values = { weight: draft.weight, reps: draft.reps }
  const restEndsAt = draft.restEndsAt
  const resting = restEndsAt !== null

  useEffect(() => {
    if (timer !== 'running') return undefined
    const interval = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(interval)
  }, [timer])

  const elapsedMs = draft.accumulatedMs + (timer === 'running' && draft.runningSince ? now - draft.runningSince : 0)
  const elapsed = Math.max(0, Math.floor(elapsedMs / 1000))

  function startTimer() {
    const started = Date.now()
    setNow(started)
    setDraft((d) => ({ ...d, timer: 'running', accumulatedMs: 0, runningSince: started }))
  }

  function pauseTimer() {
    setDraft((d) => ({ ...d, timer: 'paused', accumulatedMs: d.accumulatedMs + (Date.now() - d.runningSince), runningSince: null }))
  }

  function resumeTimer() {
    const resumed = Date.now()
    setNow(resumed)
    setDraft((d) => ({ ...d, timer: 'running', runningSince: resumed }))
  }

  function endTimer() {
    setDraft((d) => ({
      ...d,
      timer: 'ended',
      accumulatedMs: d.accumulatedMs + (d.runningSince ? Date.now() - d.runningSince : 0),
      runningSince: null,
    }))
  }

  function updateValue(field, value) {
    setDraft((d) => ({ ...d, [field]: value }))
    setFieldErrors((previous) => ({ ...previous, [field]: undefined }))
  }

  const restTotal = draft.restTotal ?? DEFAULT_REST_SECONDS

  function adjustRest(delta) {
    setDraft((d) => ({
      ...d,
      restTotal: Math.max(15, (d.restTotal ?? DEFAULT_REST_SECONDS) + delta),
      restEndsAt: d.restEndsAt === null ? null : Math.max(Date.now() + 1000, d.restEndsAt + delta * 1000),
    }))
  }

  function endRest() {
    setDraft((d) => ({ ...d, restEndsAt: null }))
  }

  async function finishSet() {
    if (saving) return
    const checked = validateSet(values)
    if (!checked.ok) {
      setFieldErrors(checked.errors)
      return
    }
    setSaving(true)
    setSaveError('')
    try {
      const saved = await workoutLogApi.saveSet({
        sessionId: session.id,
        exercise: exercise.name,
        setNumber: nextSetNumber(sets),
        weightLb: checked.values.weight_lb,
        reps: checked.values.reps,
      })
      setSets((previous) => upsertSet(previous, saved))
      // The next set starts fresh, after a rest of the length the user last chose.
      setDraft({ ...EMPTY_DRAFT, restTotal, restEndsAt: Date.now() + restTotal * 1000 })
    } catch (err) {
      if (err.status === 401) setStatus('loggedOut')
      else {
        if (err.fieldErrors && Object.keys(err.fieldErrors).length > 0) setFieldErrors(err.fieldErrors)
        setSaveError(saveErrorMessage(err))
      }
    } finally {
      setSaving(false)
    }
  }

  const muscles = exercise ? musclesFor(exercise.name) : []
  const setNumber = nextSetNumber(sets)

  return (
    <div className="dashboard-page">
      <NavBar current="Workouts" />
      <main className="dashboard-content exercise-session" aria-busy={status === 'loading'}>
        <Breadcrumb
          crumbs={[
            { label: 'Weekly plan', to: '/weekly-plan' },
            { label: 'Active workout', to: '/workout/active' },
            { label: exercise?.name ?? 'Exercise' },
          ]}
        />
        {status === 'loading' && <p className="status">Loading your exercise...</p>}
        {status === 'loggedOut' && (
          <p className="status">
            <Link to="/login">Log in</Link> to log your workout.
          </p>
        )}
        {status === 'error' && (
          <p className="status status--error" role="alert">
            Couldn&apos;t load your exercise: {errorMessage}. Refresh the page to try again.
          </p>
        )}
        {status === 'missing' && (
          <p className="status">
            This exercise isn&apos;t available (the workout may be finished). <Link to="/workout/active">Back to your workout</Link>
          </p>
        )}
        {status === 'ready' && (
          <>
            <header className="exercise-session__header">
              <div>
                <span className="dashboard-header__eyebrow">
                  EXERCISE {index + 1} OF {session.exercises.length} · {session.name.toUpperCase()}
                </span>
                <h1>{exercise.name}</h1>
                {muscles.length > 0 && (
                  <p className="active-muscles__text">{muscles.map((muscle) => MUSCLE_LABELS[muscle]).join(' · ')}</p>
                )}
              </div>
              {muscles.length > 0 && <BodyFigure muscles={muscles} />}
            </header>

            {resting ? (
              <RestTimer endsAt={restEndsAt} total={restTotal} onAdjust={adjustRest} onDone={endRest} />
            ) : (
              <section className="wl-exercise exercise-session__set" aria-labelledby="set-heading">
                <div className="wl-exercise__header">
                  <h2 id="set-heading" className="exercise-session__set-title">Set {setNumber}</h2>
                  <span className="wl-exercise__count">{sets.length} {sets.length === 1 ? 'set' : 'sets'} saved</span>
                </div>

                <div className="set-timer" role="group" aria-label="Set timer">
                  <span className="set-timer__time" role="timer" aria-live="off">{formatClock(elapsed)}</span>
                  <span className="set-timer__state">
                    {timer === 'idle' && 'Ready'}
                    {timer === 'running' && 'Set in progress'}
                    {timer === 'paused' && 'Paused'}
                    {timer === 'ended' && 'Set finished'}
                  </span>
                  <div className="set-timer__controls">
                    {timer === 'idle' && (
                      <button type="button" className="wl-button wl-button--primary" onClick={startTimer}>
                        Start set
                      </button>
                    )}
                    {timer === 'running' && (
                      <button type="button" className="wl-button wl-button--quiet" onClick={pauseTimer}>
                        Pause
                      </button>
                    )}
                    {timer === 'paused' && (
                      <button type="button" className="wl-button wl-button--primary" onClick={resumeTimer}>
                        Resume
                      </button>
                    )}
                    {(timer === 'running' || timer === 'paused') && (
                      <button type="button" className="wl-button wl-button--quiet" onClick={endTimer}>
                        Finish set
                      </button>
                    )}
                  </div>
                </div>

                {timer !== 'ended' ? (
                  <p className="exercise-session__hint exercise-session__hint--set">
                    {timer === 'idle' ? 'Start the set, then finish it to log its weight and reps.' : 'Finish the set to log its weight and reps.'}
                  </p>
                ) : (
                  <>
                    <div className="wl-fields">
                      <div className="wl-field">
                        <label htmlFor="set-weight">Weight (lb)</label>
                        <input
                          id="set-weight"
                          type="text"
                          inputMode="decimal"
                          autoComplete="off"
                          placeholder="e.g. 135"
                          value={values.weight}
                          disabled={saving}
                          aria-invalid={fieldErrors.weight ? 'true' : undefined}
                          aria-describedby={fieldErrors.weight ? 'set-weight-error' : undefined}
                          onChange={(event) => updateValue('weight', event.target.value)}
                        />
                        {fieldErrors.weight && <p id="set-weight-error" className="wl-field-error">{fieldErrors.weight}</p>}
                      </div>
                      <div className="wl-field">
                        <label htmlFor="set-reps">Reps</label>
                        <input
                          id="set-reps"
                          type="text"
                          inputMode="numeric"
                          autoComplete="off"
                          placeholder="e.g. 8"
                          value={values.reps}
                          disabled={saving}
                          aria-invalid={fieldErrors.reps ? 'true' : undefined}
                          aria-describedby={fieldErrors.reps ? 'set-reps-error' : undefined}
                          onChange={(event) => updateValue('reps', event.target.value)}
                        />
                        {fieldErrors.reps && <p id="set-reps-error" className="wl-field-error">{fieldErrors.reps}</p>}
                      </div>
                    </div>
                    {saveError && <p className="wl-message wl-message--error" role="alert">{saveError}</p>}
                    <button
                      type="button"
                      className="wl-button wl-button--primary wl-button--wide"
                      onClick={finishSet}
                      disabled={saving}
                    >
                      {saving ? 'Saving…' : 'Log set'}
                    </button>
                  </>
                )}
              </section>
            )}

            {sets.length > 0 && (
              <section className="exercise-session__saved" aria-label="Saved sets">
                <h2>Saved sets</h2>
                <ol>
                  {sets.map((set) => (
                    <li key={set.id}>
                      <span>Set {set.set_number}</span>
                      <strong>{formatSet(set)}</strong>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            <div className="exercise-session__footer">
              <button
                type="button"
                className="wl-button wl-button--quiet"
                disabled={saving}
                onClick={() => navigate('/workout/active')}
              >
                ‹ Return to workout
              </button>
              <button
                type="button"
                className="wl-button wl-button--primary"
                disabled={saving || sets.length === 0}
                onClick={() => {
                  markFinished(session.id, exercise.name)
                  navigate('/workout/active')
                }}
              >
                Finish exercise
              </button>
            </div>
            {sets.length === 0 && <p className="exercise-session__hint">Save at least one set to finish this exercise.</p>}
          </>
        )}
      </main>
    </div>
  )
}

export default ExerciseSession
