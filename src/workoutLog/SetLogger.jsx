import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import BodyFigure from '../BodyFigure.jsx'
import { MUSCLE_LABELS, musclesFor } from '../exerciseMuscles.js'
import { validateSet } from './setValidation.js'
import { formatSet, isRetryable, nextSetNumber, saveErrorMessage, upsertSet } from './setLog.js'
import defaultApi from './workoutLogApi.js'
import './workoutLog.css'

// Weight and reps for one exercise on the active workout screen (story #7). Saves new sets, lets the user
// correct saved ones, and says whether each save worked. Everything it needs comes in through props, so the
// active workout screen only has to render one of these per exercise (or use WorkoutLogger.jsx for all of them).
//
// Props:
//   sessionId        the workout session the sets belong to
//   exercise         exercise name, e.g. "Bench press"
//   number           its position in the workout (1, 2, 3…), shown in the card's badge
//   initialSets      sets already saved for this exercise: [{id, exercise, set_number, weight_lb, reps}]
//   locked           true once the workout is completed: sets are shown but can't be added or changed
//   api              {saveSet, updateSet}; defaults to the real server (workoutLogApi.js)
//   onSetsChange     called with the saved sets whenever they change
//   onUnsavedChange  called with true while the user has typed values that aren't saved yet
//   onSessionEnded   called when the server says the user is no longer logged in

const EMPTY = { weight: '', reps: '' }

function SetFields({ idPrefix, values, errors, disabled, labelSuffix, placeholders, onChange, weightRef }) {
  const weightId = `${idPrefix}-weight`
  const repsId = `${idPrefix}-reps`
  return (
    <div className="wl-fields">
      <div className="wl-field">
        <label htmlFor={weightId}>Weight (lb){labelSuffix && <span className="wl-sr-only"> {labelSuffix}</span>}</label>
        <input
          ref={weightRef}
          id={weightId}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          required
          aria-required="true"
          value={values.weight}
          placeholder={placeholders?.weight}
          disabled={disabled}
          aria-invalid={errors.weight ? 'true' : undefined}
          aria-describedby={errors.weight ? `${weightId}-error` : undefined}
          onChange={(event) => onChange('weight', event.target.value)}
        />
        {errors.weight && <p id={`${weightId}-error`} className="wl-field-error">{errors.weight}</p>}
      </div>
      <div className="wl-field">
        <label htmlFor={repsId}>Reps{labelSuffix && <span className="wl-sr-only"> {labelSuffix}</span>}</label>
        <input
          id={repsId}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          required
          aria-required="true"
          value={values.reps}
          placeholder={placeholders?.reps}
          disabled={disabled}
          aria-invalid={errors.reps ? 'true' : undefined}
          aria-describedby={errors.reps ? `${repsId}-error` : undefined}
          onChange={(event) => onChange('reps', event.target.value)}
        />
        {errors.reps && <p id={`${repsId}-error`} className="wl-field-error">{errors.reps}</p>}
      </div>
    </div>
  )
}

// Shared by the new-set row and the edit row: the typed values, their errors, and the save status.
function useSetForm(initial = EMPTY) {
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState({ state: 'idle', message: '', retry: false })

  function change(field, value) {
    setValues((current) => ({ ...current, [field]: value }))
    // Typing in a field clears that field's error, so stale messages don't linger.
    setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current))
  }

  function reset(next = EMPTY) {
    setValues(next)
    setErrors({})
    setStatus({ state: 'idle', message: '', retry: false })
  }

  return { values, errors, setErrors, status, setStatus, change, reset }
}

export default function SetLogger({
  sessionId,
  exercise,
  number,
  initialSets = [],
  locked = false,
  api = defaultApi,
  onSetsChange,
  onUnsavedChange,
  onSessionEnded,
}) {
  const baseId = useId()
  const headingId = `${baseId}-heading`
  const [sets, setSets] = useState(() => upsertSetsInOrder(initialSets))
  const [notice, setNotice] = useState(null) // {id, text}: the latest success, shown beside that set
  const [sessionEnded, setSessionEnded] = useState(false)
  const draft = useSetForm()
  const [editingId, setEditingId] = useState(null)
  const edit = useSetForm()
  const draftWeightRef = useRef(null)
  const editWeightRef = useRef(null)
  // Bumped after each successful save; the effect below then moves the cursor to the next set's Weight box.
  // Focusing straight away doesn't work because the box is still disabled until the save finishes rendering.
  const [focusDraft, setFocusDraft] = useState(0)

  const muscles = musclesFor(exercise)
  const draftDirty = draft.values.weight.trim() !== '' || draft.values.reps.trim() !== ''
  const unsaved = draftDirty || editingId !== null

  useEffect(() => { onSetsChange?.(sets) }, [sets]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { onUnsavedChange?.(unsaved) }, [unsaved]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (editingId !== null) editWeightRef.current?.focus() }, [editingId])
  useEffect(() => { if (focusDraft > 0) draftWeightRef.current?.focus() }, [focusDraft])

  function handleFailure(form, err) {
    if (err.status === 401) {
      // The banner at the top of the exercise says this once, with a Log in link; don't repeat it under the form.
      setSessionEnded(true)
      onSessionEnded?.()
      form.setStatus({ state: 'failed', message: '', retry: false })
      return
    }
    if (err.fieldErrors && Object.keys(err.fieldErrors).length > 0) form.setErrors(err.fieldErrors)
    // The typed values stay in the inputs, so nothing has to be re-entered.
    form.setStatus({ state: 'failed', message: saveErrorMessage(err), retry: isRetryable(err) })
  }

  async function saveDraft() {
    if (draft.status.state === 'saving') return
    const checked = validateSet(draft.values)
    if (!checked.ok) {
      draft.setErrors(checked.errors)
      draft.setStatus({ state: 'idle', message: '', retry: false })
      return
    }
    const setNumber = nextSetNumber(sets)
    draft.setStatus({ state: 'saving', message: '', retry: false })
    try {
      const saved = await api.saveSet({
        sessionId,
        exercise,
        setNumber,
        weightLb: checked.values.weight_lb,
        reps: checked.values.reps,
      })
      setSets((current) => upsertSet(current, saved))
      setNotice({ id: saved.id, text: `Set ${saved.set_number} saved` })
      draft.reset()
      setFocusDraft((count) => count + 1)
    } catch (err) {
      handleFailure(draft, err)
    }
  }

  function startEdit(set) {
    setNotice(null)
    setEditingId(set.id)
    edit.reset({ weight: String(set.weight_lb), reps: String(set.reps) })
  }

  function cancelEdit() {
    if (edit.status.state === 'saving') return
    setEditingId(null)
    edit.reset()
  }

  async function saveEdit() {
    if (edit.status.state === 'saving') return
    const checked = validateSet(edit.values)
    if (!checked.ok) {
      edit.setErrors(checked.errors)
      edit.setStatus({ state: 'idle', message: '', retry: false })
      return
    }
    edit.setStatus({ state: 'saving', message: '', retry: false })
    try {
      const saved = await api.updateSet({ id: editingId, weightLb: checked.values.weight_lb, reps: checked.values.reps })
      setSets((current) => upsertSet(current, saved))
      setNotice({ id: saved.id, text: `Set ${saved.set_number} updated` })
      setEditingId(null)
      edit.reset()
    } catch (err) {
      handleFailure(edit, err)
    }
  }

  const lastSet = sets[sets.length - 1]
  const draftNumber = nextSetNumber(sets)
  const draftSaving = draft.status.state === 'saving'
  const editSaving = edit.status.state === 'saving'

  return (
    <section className="wl-exercise" aria-labelledby={headingId}>
      <header className="wl-exercise__header">
        {number && <span className={sets.length > 0 ? 'wl-exercise__badge wl-exercise__badge--started' : 'wl-exercise__badge'} aria-hidden="true">{number}</span>}
        <div className="wl-exercise__title">
          <h3 id={headingId}>{exercise}</h3>
          {muscles.length > 0 && (
            <span className="wl-exercise__muscles">{muscles.map((muscle) => MUSCLE_LABELS[muscle]).join(' · ')}</span>
          )}
          <span className="wl-exercise__count">{sets.length === 1 ? '1 set' : `${sets.length} sets`}</span>
        </div>
        {muscles.length > 0 && <BodyFigure muscles={muscles} />}
      </header>

      {sessionEnded && (
        <p className="wl-message wl-message--error" role="alert">
          Your session ended. <Link to="/login">Log in</Link> to keep logging.
        </p>
      )}

      {sets.length > 0 && (
        <ol className="wl-sets" aria-label={`${exercise} sets`}>
          {sets.map((set) =>
            editingId === set.id ? (
              <li key={set.id} className="wl-set wl-set--editing">
                <form
                  className="wl-set-form"
                  noValidate
                  aria-label={`Edit set ${set.set_number}`}
                  onSubmit={(event) => { event.preventDefault(); saveEdit() }}
                >
                  <span className="wl-set__number">Set {set.set_number}</span>
                  <SetFields
                    idPrefix={`${baseId}-edit-${set.id}`}
                    values={edit.values}
                    errors={edit.errors}
                    disabled={editSaving}
                    labelSuffix={`for set ${set.set_number}`}
                    onChange={edit.change}
                    weightRef={editWeightRef}
                  />
                  <div className="wl-actions">
                    <button type="submit" className="wl-button wl-button--primary" disabled={editSaving}>
                      {editSaving ? 'Saving…' : 'Save'}
                    </button>
                    <button type="button" className="wl-button" onClick={cancelEdit} disabled={editSaving}>Cancel</button>
                    {edit.status.retry && !editSaving && (
                      <button type="button" className="wl-button" onClick={saveEdit}>Retry</button>
                    )}
                  </div>
                  {edit.status.message && (
                    <p className="wl-message wl-message--error" role="alert">{edit.status.message}</p>
                  )}
                </form>
              </li>
            ) : (
              <li key={set.id} className="wl-set">
                <span className="wl-set__number">Set {set.set_number}</span>
                <span className="wl-set__value">{formatSet(set)}</span>
                {notice?.id === set.id && !locked && (
                  <span className="wl-set__notice" role="status">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                    {notice.text}
                  </span>
                )}
                {!locked && (
                  <button
                    type="button"
                    className="wl-button wl-button--quiet"
                    onClick={() => startEdit(set)}
                    disabled={editingId !== null || draftSaving}
                    aria-label={`Edit set ${set.set_number}, ${formatSet(set)}`}
                  >
                    Edit
                  </button>
                )}
              </li>
            ),
          )}
        </ol>
      )}

      {locked ? (
        <p className="wl-locked">{sets.length === 0 ? 'No sets logged.' : 'Workout completed — these sets can no longer be changed.'}</p>
      ) : (
        <form
          className="wl-set-form wl-set-form--new"
          noValidate
          aria-label={`Log set ${draftNumber} of ${exercise}`}
          onSubmit={(event) => { event.preventDefault(); saveDraft() }}
        >
          <span className="wl-set__number">Set {draftNumber}</span>
          <SetFields
            idPrefix={`${baseId}-new`}
            values={draft.values}
            errors={draft.errors}
            disabled={draftSaving}
            placeholders={lastSet ? { weight: String(lastSet.weight_lb), reps: String(lastSet.reps) } : { weight: 'e.g. 135', reps: 'e.g. 8' }}
            onChange={draft.change}
            weightRef={draftWeightRef}
          />
          <p className="wl-hint">Weight from 0 to 1500 lb, up to 2 decimal places (0 for bodyweight). Reps from 1 to 100.</p>
          <div className="wl-actions">
            <button type="submit" className="wl-button wl-button--primary" disabled={draftSaving}>
              {draftSaving ? 'Saving…' : 'Save set'}
            </button>
            {draft.status.retry && !draftSaving && (
              <button type="button" className="wl-button" onClick={saveDraft}>Retry</button>
            )}
          </div>
          {draft.status.message && (
            <p className="wl-message wl-message--error" role="alert">{draft.status.message}</p>
          )}
        </form>
      )}
    </section>
  )
}

function upsertSetsInOrder(sets) {
  return sets.reduce((all, set) => upsertSet(all, set), [])
}
