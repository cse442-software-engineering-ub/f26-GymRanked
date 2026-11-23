import { useEffect, useRef, useState } from 'react'
import ExerciseGuide from './ExerciseGuide.jsx'
import ExerciseAlternatives from './workoutLog/ExerciseAlternatives.jsx'
import { EMPTY_DRAFT, loadDraft, saveDraft } from './setDraft.js'
import { formatSet, isRetryable, lastSavedSet, newSetRequestId, nextSetNumber, repeatValues, saveErrorMessage } from './workoutLog/setLog.js'
import { validateSet } from './workoutLog/setValidation.js'
import workoutLogApi from './workoutLog/workoutLogApi.js'

const DEFAULT_REST_SECONDS = 90
const REST_STEP_SECONDS = 15

function formatClock(seconds) {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

function readDraft(sessionId, exercise) {
  const saved = loadDraft(sessionId, exercise)
  // A rest that ended while away resets the set clock, but keeps typed values.
  return saved.timer === 'ended' && saved.restEndsAt === null
    ? { ...saved, timer: 'idle', accumulatedMs: 0 }
    : saved
}

function formatVolume(value) {
  return `${Number(value.toFixed(2)).toLocaleString()} lb`
}

// The phone logger follows the short entry flow in the workout mockup.
export default function QuickSetLogger({ sessionId, exercise, exercisePosition, exerciseTotal, workoutExercises, onSwitchExercise, totalVolume, sets, onSetSaved }) {
  const [draft, setDraft] = useState(() => readDraft(sessionId, exercise))
  const [errors, setErrors] = useState({})
  const [saveError, setSaveError] = useState('')
  const [canRetry, setCanRetry] = useState(false)
  const pendingSave = useRef(null)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [now, setNow] = useState(() => Date.now())
  const [scrollToRest, setScrollToRest] = useState(false)
  const restRef = useRef(null)
  const weightRef = useRef(null)
  const lastSet = lastSavedSet(sets, exercise)

  useEffect(() => {
    setDraft(readDraft(sessionId, exercise))
    setErrors({})
    setSaveError('')
    setCanRetry(false)
    pendingSave.current = null
    setNotice('')
  }, [sessionId, exercise])

  useEffect(() => { saveDraft(sessionId, exercise, draft) }, [sessionId, exercise, draft])
  useEffect(() => {
    if (scrollToRest && restRef.current) {
      restRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      setScrollToRest(false)
    }
  }, [scrollToRest, draft.restEndsAt])
  useEffect(() => {
    if (draft.timer !== 'running' && !draft.restEndsAt) return undefined
    const interval = setInterval(() => setNow(Date.now()), draft.timer === 'running' ? 250 : 1000)
    return () => clearInterval(interval)
  }, [draft.timer, draft.restEndsAt])
  useEffect(() => {
    if (draft.restEndsAt && now >= draft.restEndsAt) {
      setDraft((previous) => previous.restEndsAt && Date.now() >= previous.restEndsAt
        ? { ...previous, timer: 'idle', accumulatedMs: 0, runningSince: null, restEndsAt: null }
        : previous)
    }
  }, [now, draft.restEndsAt])

  const elapsedMs = draft.accumulatedMs + (draft.timer === 'running' && draft.runningSince ? now - draft.runningSince : 0)
  const elapsedSeconds = Math.max(0, Math.floor(elapsedMs / 1000))
  const restSeconds = draft.restEndsAt === null ? null : Math.max(0, Math.ceil((draft.restEndsAt - now) / 1000))
  const restTotal = draft.restTotal ?? DEFAULT_REST_SECONDS

  function startTimer() {
    const started = Date.now()
    setNow(started)
    setDraft((previous) => ({ ...previous, timer: 'running', accumulatedMs: 0, runningSince: started, restEndsAt: null }))
  }

  function pauseTimer() {
    const paused = Date.now()
    setNow(paused)
    setDraft((previous) => ({ ...previous, timer: 'paused', accumulatedMs: previous.accumulatedMs + (paused - previous.runningSince), runningSince: null }))
  }

  function resumeTimer() {
    const resumed = Date.now()
    setNow(resumed)
    setDraft((previous) => ({ ...previous, timer: 'running', runningSince: resumed }))
  }

  function finishTimer() {
    const ended = Date.now()
    setNow(ended)
    setScrollToRest(true)
    setDraft((previous) => ({
      ...previous,
      timer: 'ended',
      accumulatedMs: previous.accumulatedMs + (previous.runningSince ? ended - previous.runningSince : 0),
      runningSince: null,
      restTotal: previous.restTotal ?? DEFAULT_REST_SECONDS,
      restEndsAt: ended + (previous.restTotal ?? DEFAULT_REST_SECONDS) * 1000,
    }))
  }

  function adjustRest(delta) {
    const changed = Date.now()
    setNow(changed)
    setDraft((previous) => ({
      ...previous,
      restTotal: Math.max(REST_STEP_SECONDS, (previous.restTotal ?? DEFAULT_REST_SECONDS) + delta),
      restEndsAt: Math.max(changed + 1000, previous.restEndsAt + delta * 1000),
    }))
  }

  function update(field, value) {
    setCanRetry(false)
    pendingSave.current = null
    setDraft((previous) => ({ ...previous, [field]: value }))
    setErrors((previous) => ({ ...previous, [field]: undefined }))
    setNotice('')
  }

  // Fills the boxes from the exercise's latest saved set. Saves nothing: the user still presses Log set.
  function repeatLastSet() {
    if (!lastSet || saving) return
    setDraft((previous) => ({ ...previous, ...repeatValues(lastSet) }))
    setErrors((previous) => ({ ...previous, weight: undefined, reps: undefined }))
    setSaveError('')
    setCanRetry(false)
    pendingSave.current = null
    setNotice(`Weight and reps filled from Set ${lastSet.set_number}`)
    weightRef.current?.focus()
  }

  async function logSet(event, retry = false) {
    event?.preventDefault()
    if (saving) return
    if (draft.timer === 'running' || draft.timer === 'paused') {
      setSaveError('Finish the set timer before logging this set.')
      return
    }
    const checked = validateSet({ weight: draft.weight, reps: draft.reps })
    if (!checked.ok) {
      setErrors(checked.errors)
      return
    }
    setSaving(true)
    setSaveError('')
    setCanRetry(false)
    const request = retry && pendingSave.current ? pendingSave.current : {
      sessionId, exercise, setNumber: nextSetNumber(sets),
      weightLb: checked.values.weight_lb, reps: checked.values.reps, requestId: newSetRequestId(),
    }
    pendingSave.current = request
    try {
      const saved = await workoutLogApi.saveSet(request)
      pendingSave.current = null
      onSetSaved(exercise, saved)
      setDraft((previous) => ({
        ...EMPTY_DRAFT,
        timer: previous.restEndsAt ? 'ended' : 'idle',
        accumulatedMs: previous.restEndsAt ? previous.accumulatedMs : 0,
        restTotal: previous.restTotal,
        restEndsAt: previous.restEndsAt,
      }))
      setNotice(`Set ${saved.set_number} saved`)
    } catch (error) {
      if (error.fieldErrors) setErrors(error.fieldErrors)
      setSaveError(saveErrorMessage(error))
      setCanRetry(isRetryable(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="quick-set" aria-label={`Log sets for ${exercise}`}>
      <div className="quick-set__heading"><h2>Log a set</h2><span>Set {nextSetNumber(sets)}</span></div>
      <p className="quick-set__context">Exercise {exercisePosition} of {exerciseTotal}</p>
      <h3>{exercise}</h3>
      <div className="quick-set__tools" aria-label="Exercise information">
        <ExerciseGuide name={exercise} />
        <ExerciseAlternatives
          exercise={exercise}
          workoutExercises={workoutExercises}
          locked={sets.length > 0}
          onSwitch={onSwitchExercise}
        />
      </div>
      <div className="quick-set__timers">
      <div className="quick-set__timer" role="group" aria-label="Set timer">
        <div><span className="quick-set__timer-label">Set timer</span><strong role="timer" aria-live="off">{formatClock(elapsedSeconds)}</strong><span className="quick-set__timer-state">{restSeconds !== null ? 'Resting' : draft.timer === 'idle' ? 'Ready' : draft.timer === 'running' ? 'In progress' : draft.timer === 'paused' ? 'Paused' : 'Set finished'}</span></div>
        <div className="quick-set__timer-actions">
          {draft.timer === 'idle' && <button type="button" onClick={startTimer} disabled={saving}>Start timer</button>}
          {draft.timer === 'running' && <><button type="button" onClick={pauseTimer} disabled={saving}>Pause</button><button type="button" onClick={finishTimer} disabled={saving}>Finish set</button></>}
          {draft.timer === 'paused' && <><button type="button" onClick={resumeTimer} disabled={saving}>Resume</button><button type="button" onClick={finishTimer} disabled={saving}>Finish set</button></>}
          {draft.timer === 'ended' && <button type="button" onClick={startTimer} disabled={saving}>Restart timer</button>}
        </div>
      </div>
      {restSeconds !== null ? <div ref={restRef} className="quick-set__rest" role="group" aria-label="Rest timer">
        <div className="quick-set__rest-heading"><span>Rest timer</span><strong role="timer" aria-live="off">{formatClock(restSeconds)}</strong></div>
        <div className="quick-set__rest-bar" aria-hidden="true"><span style={{ width: `${Math.min(100, (restSeconds / restTotal) * 100)}%` }} /></div>
        <div className="quick-set__rest-actions">
          <button type="button" onClick={() => adjustRest(-REST_STEP_SECONDS)}>−15s</button><button type="button" onClick={() => adjustRest(REST_STEP_SECONDS)}>+15s</button>
          <button type="button" onClick={() => setDraft((previous) => ({ ...previous, timer: 'idle', accumulatedMs: 0, restEndsAt: null }))}>Skip rest</button>
        </div>
      </div> : <div className="quick-set__rest-placeholder">Rest timer starts when you finish a set.</div>}
      </div>
      <form onSubmit={logSet}>
        <label>Weight (lb)
          <input ref={weightRef} type="text" inputMode="decimal" autoComplete="off" value={draft.weight} onChange={(event) => update('weight', event.target.value)} aria-invalid={Boolean(errors.weight)} aria-describedby={errors.weight ? 'quick-weight-error' : undefined} disabled={saving} />
          {errors.weight && <span id="quick-weight-error" className="wl-field-error">{errors.weight}</span>}
        </label>
        <label>Reps
          <input type="text" inputMode="numeric" autoComplete="off" value={draft.reps} onChange={(event) => update('reps', event.target.value)} aria-invalid={Boolean(errors.reps)} aria-describedby={errors.reps ? 'quick-reps-error' : undefined} disabled={saving} />
          {errors.reps && <span id="quick-reps-error" className="wl-field-error">{errors.reps}</span>}
        </label>
        <button type="button" className="wl-button wl-button--quiet" onClick={repeatLastSet} disabled={saving || !lastSet}>Repeat last set</button>
        <button type="submit" className="wl-button wl-button--primary" disabled={saving}>{saving ? 'Saving…' : 'Log set'}</button>
      </form>
      {saveError && <p className="wl-message wl-message--error" role="alert">{saveError}</p>}
      {canRetry && <button type="button" className="wl-button wl-button--quiet" onClick={() => logSet(null, true)} disabled={saving}>Retry saving set</button>}
      {notice && <p className="wl-message wl-message--success" role="status">{notice}</p>}
      <p className="quick-set__count">{sets.length} {sets.length === 1 ? 'set' : 'sets'} saved</p>
      {sets.length > 0 && <ol className="quick-set__saved" aria-label="Saved sets">{sets.map((set) => <li key={set.id}><span>Set {set.set_number}</span><strong>{formatSet(set)}</strong><span aria-hidden="true">✓</span></li>)}</ol>}
      <div className="quick-set__volume"><span>Exercise volume: {formatVolume(sets.reduce((total, set) => total + set.weight_lb * set.reps, 0))}</span><span>Total volume: {formatVolume(totalVolume)}</span></div>
    </section>
  )
}
