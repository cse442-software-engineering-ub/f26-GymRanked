import { useEffect, useRef } from 'react'

export default function IncompleteWorkoutModal({ exercises, busy, error, onConfirm, onCancel }) {
  const cancelRef = useRef(null)
  useEffect(() => { cancelRef.current?.focus() }, [])

  return <div className="modal-backdrop" onClick={busy ? undefined : onCancel} onKeyDown={(event) => { if (event.key === 'Escape' && !busy) onCancel() }}>
    <div className="confirm-workout-modal" role="alertdialog" aria-modal="true" aria-labelledby="incomplete-workout-title" aria-describedby="incomplete-workout-description" onClick={(event) => event.stopPropagation()}>
      <h2 id="incomplete-workout-title">Some exercises have no logged sets</h2>
      <p id="incomplete-workout-description">{exercises.join(', ')} {exercises.length === 1 ? 'has' : 'have'} no saved sets. You can return to log them, or finish now and save this partial workout to your history.</p>
      {error && <p className="wl-message wl-message--error" role="alert">{error}</p>}
      <button ref={cancelRef} type="button" className="wl-button wl-button--primary" onClick={onCancel} disabled={busy}>Keep logging</button>
      <button type="button" className="wl-button" onClick={onConfirm} disabled={busy}>{busy ? 'Saving…' : 'Save partial workout'}</button>
    </div>
  </div>
}
