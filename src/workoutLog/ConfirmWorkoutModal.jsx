import { useEffect, useRef } from 'react'

export default function ConfirmWorkoutModal({ busy, error, onConfirm, onCancel }) {
  const confirmRef = useRef(null)

  useEffect(() => {
    confirmRef.current?.focus()
  }, [])

  function onKeyDown(event) {
    if (event.key === 'Escape' && !busy) onCancel()
  }

  return <div className="modal-backdrop" onClick={onCancel} onKeyDown={onKeyDown}>
    <div className="confirm-workout-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-workout-title" aria-describedby="confirm-workout-description" onClick={(event) => event.stopPropagation()}>
      <h2 id="confirm-workout-title">Complete this workout?</h2>
      <p id="confirm-workout-description">Your saved sets will be added to your workout history. You won’t be able to edit them after completing.</p>
      {error && <p className="wl-message wl-message--error" role="alert">{error}</p>}
      <button ref={confirmRef} type="button" className="wl-button wl-button--primary" onClick={onConfirm} disabled={busy}>{busy ? 'Completing…' : 'Complete workout'}</button>
      <button type="button" className="confirm-workout-modal__cancel" onClick={onCancel} disabled={busy}>Cancel</button>
    </div>
  </div>
}
