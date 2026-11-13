import { useEffect, useState } from 'react'
import { EMPTY_DRAFT, loadDraft, saveDraft } from './setDraft.js'
import { formatSet, nextSetNumber, saveErrorMessage } from './workoutLog/setLog.js'
import { validateSet } from './workoutLog/setValidation.js'
import workoutLogApi from './workoutLog/workoutLogApi.js'

// The phone logger follows the short entry flow in the workout mockup.
export default function QuickSetLogger({ sessionId, exercise, exercisePosition, exerciseTotal, sets, onSetSaved }) {
  const [draft, setDraft] = useState(() => loadDraft(sessionId, exercise))
  const [errors, setErrors] = useState({})
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    setDraft(loadDraft(sessionId, exercise))
    setErrors({})
    setSaveError('')
    setNotice('')
  }, [sessionId, exercise])

  useEffect(() => { saveDraft(sessionId, exercise, draft) }, [sessionId, exercise, draft])
  useEffect(() => {
    if (!draft.restEndsAt || draft.restEndsAt <= now) return undefined
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [draft.restEndsAt, now])

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
      setDraft({ ...EMPTY_DRAFT })
      setNotice(`Set ${saved.set_number} saved`)
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
      <p className="quick-set__count">{sets.length} {sets.length === 1 ? 'set' : 'sets'} saved</p>
      {sets.length > 0 && <ol className="quick-set__saved" aria-label="Saved sets">{sets.map((set) => <li key={set.id}><span>Set {set.set_number}</span><strong>{formatSet(set)}</strong><span aria-hidden="true">✓</span></li>)}</ol>}
      {draft.restEndsAt && draft.restEndsAt > now ? (
        <div className="quick-set__rest"><span>Rest · {Math.floor((draft.restEndsAt - now) / 60000)}:{String(Math.ceil((draft.restEndsAt - now) / 1000) % 60).padStart(2, '0')}</span><button type="button" onClick={() => setDraft((previous) => ({ ...previous, restEndsAt: null }))}>Dismiss timer</button></div>
      ) : <button type="button" className="quick-set__rest-start" onClick={() => { setNow(Date.now()); setDraft((previous) => ({ ...previous, restEndsAt: Date.now() + 90000 })) }}>Start rest timer</button>}
    </section>
  )
}
