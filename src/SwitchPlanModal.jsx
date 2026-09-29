import { useEffect, useRef } from 'react'

// Figma "Switch Plan Modal": confirms replacing the user's current plan with another one.
function SwitchPlanModal({ plan, currentPlan, week, busy, error, onConfirm, onCancel }) {
  const confirmRef = useRef(null)

  useEffect(() => {
    confirmRef.current?.focus()
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onCancel])

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div
        className="switch-plan-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="switch-plan-title"
        aria-describedby="switch-plan-warning"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="switch-plan-title" className="switch-plan-modal__title">
          Switch to {plan.name}?
        </h2>
        <p id="switch-plan-warning" className="switch-plan-modal__warning">
          You&apos;re partway through Week {week} of {currentPlan.name}. Switching plans now will
          reset this week&apos;s progress.
        </p>
        <p className="switch-plan-modal__note">Your finished workouts stay in your history.</p>
        {error && (
          <p className="switch-plan-modal__error" role="alert">
            {error}
          </p>
        )}
        <button
          ref={confirmRef}
          type="button"
          className="button-primary"
          onClick={onConfirm}
          disabled={busy}
        >
          {busy ? 'Switching...' : 'Switch plan'}
        </button>
        <button type="button" className="button-subtle" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
      </div>
    </div>
  )
}

export default SwitchPlanModal
