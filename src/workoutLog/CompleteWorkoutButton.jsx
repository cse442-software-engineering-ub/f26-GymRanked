import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { completeErrorMessage, summaryPath } from './setLog.js'
import ConfirmWorkoutModal from './ConfirmWorkoutModal.jsx'
import UnloggedSetModal from './UnloggedSetModal.jsx'
import defaultApi from './workoutLogApi.js'
import './workoutLog.css'

// The Complete Workout button for the active workout screen (story #7). Checks that there is something to
// complete, sends the completion to the server, and opens the workout summary once it succeeds.
//
// Props:
//   sessionId       the workout session to complete
//   setCount        how many sets are saved across all exercises
//   hasUnsaved      true while the user has typed values that aren't saved yet
//   findUnlogged    returns the name of an exercise with a started but unlogged set, or null (optional)
//   onLogUnlogged   called with that name when the user chooses to log the set
//   onEndUnlogged   called when the user chooses to end the workout without it (the draft is thrown away)
//   completed       true if the workout is already completed (the button then says so and does nothing)
//   api             {completeWorkout}; defaults to the real server (workoutLogApi.js)
//   onCompleted     called with the server's reply instead of opening the summary (used by the preview page)
//   onSessionEnded  called when the server says the user is no longer logged in

export default function CompleteWorkoutButton({
  sessionId,
  setCount,
  hasUnsaved = false,
  findUnlogged,
  onLogUnlogged,
  onEndUnlogged,
  completed = false,
  api = defaultApi,
  onCompleted,
  onSessionEnded,
}) {
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [unlogged, setUnlogged] = useState(null) // exercise name while the unlogged-set prompt is open
  const submitting = useRef(false)
  const openButton = useRef(null)

  function finish(result) {
    if (onCompleted) onCompleted(result)
    else navigate(summaryPath(sessionId))
  }

  function openConfirmation() {
    if (busy || completed) return
    if (setCount === 0) {
      setMessage('Log at least one set before completing.')
      return
    }
    if (hasUnsaved) {
      setMessage("Save or clear the set you're still editing before completing.")
      return
    }
    const unloggedExercise = findUnlogged?.() ?? null
    if (unloggedExercise) {
      setMessage('')
      setUnlogged(unloggedExercise)
      return
    }
    setMessage('')
    setConfirming(true)
  }

  function endWithoutUnlogged() {
    onEndUnlogged?.()
    setUnlogged(null)
    setConfirming(true)
  }

  function cancelConfirmation() {
    if (submitting.current) return
    setConfirming(false)
    setMessage('')
    openButton.current?.focus()
  }

  async function complete() {
    if (submitting.current || completed || !confirming) return
    submitting.current = true
    setBusy(true)
    setMessage('')
    try {
      finish(await api.completeWorkout(sessionId))
    } catch (err) {
      // Completed already (for example in another tab): the summary is still the right place to go.
      if (err.status === 409) {
        finish({ session_id: sessionId })
        return
      }
      if (err.status === 401) onSessionEnded?.()
      setMessage(completeErrorMessage(err))
    } finally {
      submitting.current = false
      setBusy(false)
    }
  }

  if (completed) {
    return (
      <div className="wl-complete">
        <p className="wl-message wl-message--success" role="status">Workout completed</p>
      </div>
    )
  }

  return (
    <div className="wl-complete">
      <button ref={openButton} type="button" className="wl-button wl-button--primary wl-button--wide" onClick={openConfirmation} disabled={busy}>
        Complete workout
      </button>
      {!confirming && message && <p className="wl-message wl-message--error" role="alert">{message}</p>}
      {unlogged && <UnloggedSetModal exercise={unlogged} onLog={() => onLogUnlogged?.(unlogged)} onEnd={endWithoutUnlogged} onCancel={() => setUnlogged(null)} />}
      {confirming && <ConfirmWorkoutModal busy={busy} error={message} onConfirm={complete} onCancel={cancelConfirmation} />}
    </div>
  )
}
