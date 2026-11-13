import { useEffect, useRef, useState } from 'react'
import { EMPTY_DRAFT, loadDraft, saveDraft } from './setDraft.js'
import { formatSet, nextSetNumber, saveErrorMessage } from './workoutLog/setLog.js'
import { validateSet } from './workoutLog/setValidation.js'
import workoutLogApi from './workoutLog/workoutLogApi.js'

const DEFAULT_REST_SECONDS = 90
const REST_STEP_SECONDS = 15

function formatClock(seconds) {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

// The phone logger follows the short entry flow in the workout mockup.
export default function QuickSetLogger({ sessionId, exercise, exercisePosition, exerciseTotal, sets, onSetSaved }) {
  const [draft, setDraft] = useState(() => loadDraft(sessionId, exercise))
  const [errors, setErrors] = useState({})
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [now, setNow] = useState(() => Date.now())
  const [scrollToRest, setScrollToRest] = useState(false)
  const restRef = useRef(null)

  useEffect(() => {
    setDraft(loadDraft(sessionId, exercise))
    setErrors({})
    setSaveError('')
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
    setDraft((previous) => ({
      ...previous,
      timer: 'ended',
      accumulatedMs: previous.accumulatedMs + (previous.runningSince ? ended - previous.runningSince : 0),
      runningSince: null,
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
    setDraft((previous) => ({ ...previous, [field]: value }))
    setErrors((previous) => ({ ...previous, [field]: undefined }))
    setNotice('')
  }

  async function logSet(event) {
    event.preventDefault()
    if (saving) return
    const checked = validateSet({ weight: draft.weight, reps: draft.reps })
    if (!checked.ok) {
      setErrors(checked.errors)
      return
    }
    setSaving(true)
    setSaveError('')
    try {
      const saved = await workoutLogApi.saveSet({
        sessionId, exercise, setNumber: nextSetNumber(sets),
        weightLb: checked.values.weight_lb, reps: checked.values.reps,
      })
      onSetSaved(exercise, saved)
      const restStarted = Date.now()
      setNow(restStarted)
      setDraft({ ...EMPTY_DRAFT, restTotal, restEndsAt: restStarted + restTotal * 1000 })
      setNotice(`Set ${saved.set_number} saved`)
      setScrollToRest(true)
    } catch (error) {
      if (error.fieldErrors) setErrors(error.fieldErrors)
      setSaveError(saveErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="quick-set" aria-label={`Log sets for ${exercise}`}>
      <div className="quick-set__heading"><h2>Log a set</h2><span>Set {nextSetNumber(sets)}</span></div>
      <p className="quick-set__context">Exercise {exercisePosition} of {exerciseTotal}</p>
      <h3>{exercise}</h3>
      <div className="quick-set__timer" role="group" aria-label="Set timer">
        <div><span className="quick-set__timer-label">Set timer</span><strong role="timer" aria-live="off">{formatClock(elapsedSeconds)}</strong><span className="quick-set__timer-state">{draft.timer === 'idle' ? 'Ready' : draft.timer === 'running' ? 'In progress' : draft.timer === 'paused' ? 'Paused' : 'Set finished'}</span></div>
        <div className="quick-set__timer-actions">
          {draft.timer === 'idle' && <button type="button" onClick={startTimer} disabled={saving}>Start timer</button>}
          {draft.timer === 'running' && <><button type="button" onClick={pauseTimer} disabled={saving}>Pause</button><button type="button" onClick={finishTimer} disabled={saving}>Finish set</button></>}
          {draft.timer === 'paused' && <><button type="button" onClick={resumeTimer} disabled={saving}>Resume</button><button type="button" onClick={finishTimer} disabled={saving}>Finish set</button></>}
          {draft.timer === 'ended' && <button type="button" onClick={startTimer} disabled={saving}>Restart timer</button>}
        </div>
      </div>
      <form onSubmit={logSet}>
        <label>Reps
          <input type="text" inputMode="numeric" autoComplete="off" value={draft.reps} onChange={(event) => update('reps', event.target.value)} aria-invalid={Boolean(errors.reps)} aria-describedby={errors.reps ? 'quick-reps-error' : undefined} disabled={saving} />
          {errors.reps && <span id="quick-reps-error" className="wl-field-error">{errors.reps}</span>}
        </label>
        <label>Weight (lb)
          <input type="text" inputMode="decimal" autoComplete="off" value={draft.weight} onChange={(event) => update('weight', event.target.value)} aria-invalid={Boolean(errors.weight)} aria-describedby={errors.weight ? 'quick-weight-error' : undefined} disabled={saving} />
          {errors.weight && <span id="quick-weight-error" className="wl-field-error">{errors.weight}</span>}
        </label>
        <button type="submit" className="wl-button wl-button--primary" disabled={saving}>{saving ? 'Saving…' : 'Log set'}</button>
      </form>
      {saveError && <p className="wl-message wl-message--error" role="alert">{saveError}</p>}
      {notice && <p className="wl-message wl-message--success" role="status">{notice}</p>}
      {restSeconds !== null && <div ref={restRef} className="quick-set__rest" role="group" aria-label="Rest timer">
        <div className="quick-set__rest-heading"><span>Rest timer</span><strong role="timer" aria-live="off">{restSeconds === 0 ? 'Rest finished' : formatClock(restSeconds)}</strong></div>
        <div className="quick-set__rest-bar" aria-hidden="true"><span style={{ width: `${Math.min(100, (restSeconds / restTotal) * 100)}%` }} /></div>
        <div className="quick-set__rest-actions">
          {restSeconds > 0 && <><button type="button" onClick={() => adjustRest(-REST_STEP_SECONDS)}>−15s</button><button type="button" onClick={() => adjustRest(REST_STEP_SECONDS)}>+15s</button></>}
          <button type="button" onClick={() => setDraft((previous) => ({ ...previous, restEndsAt: null }))}>{restSeconds === 0 ? 'Dismiss' : 'Skip rest'}</button>
        </div>
      </div>}
      <p className="quick-set__count">{sets.length} {sets.length === 1 ? 'set' : 'sets'} saved</p>
      {sets.length > 0 && <ol className="quick-set__saved" aria-label="Saved sets">{sets.map((set) => <li key={set.id}><span>Set {set.set_number}</span><strong>{formatSet(set)}</strong><span aria-hidden="true">✓</span></li>)}</ol>}
    </section>
  )
}
