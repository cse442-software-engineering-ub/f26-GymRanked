import { useEffect, useRef } from 'react'

// Shown when "Complete workout" is pressed while an exercise still has a set that was started or typed but never
// logged. The user either goes back to log it, or ends the workout without it.
export default function UnloggedSetModal({ exercise, onLog, onEnd, onCancel }) {
  const logRef = useRef(null)

  useEffect(() => {
    logRef.current?.focus()
  }, [])

  function onKeyDown(event) {
    if (event.key === 'Escape') onCancel()
  }

  return <div className="modal-backdrop" onClick={onCancel} onKeyDown={onKeyDown}>
    <div className="confirm-workout-modal" role="alertdialog" aria-modal="true" aria-labelledby="unlogged-set-title" aria-describedby="unlogged-set-description" onClick={(event) => event.stopPropagation()}>
      <h2 id="unlogged-set-title">You have an unlogged set</h2>
      <p id="unlogged-set-description">{exercise} has a set you started but didn’t log. Log it now, or end the workout without it.</p>
      <button ref={logRef} type="button" className="wl-button wl-button--primary" onClick={onLog}>Log set</button>
      <button type="button" className="wl-button wl-button--quiet" onClick={onEnd}>End workout</button>
      <button type="button" className="confirm-workout-modal__cancel" onClick={onCancel}>Cancel</button>
    </div>
  </div>
}
