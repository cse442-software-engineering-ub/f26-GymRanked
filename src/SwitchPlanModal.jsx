import { useEffect, useRef } from 'react'
import { equipmentList } from './planEquipment.js'

// Figma "Switch Plan Modal": confirms replacing the user's current plan with another one.
// Also used before starting a plan that needs equipment the user hasn't listed.
// currentPlan is null when the user has no plan yet; missing is the equipment they'd still need.
function SwitchPlanModal({ plan, currentPlan, week, missing = [], busy, error, onConfirm, onCancel }) {
  const confirmRef = useRef(null)
  const switching = Boolean(currentPlan)

  useEffect(() => {
    confirmRef.current?.focus()
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onCancel])

  let confirmLabel = switching ? 'Switch plan' : 'Start plan'
  if (missing.length > 0) confirmLabel = switching ? 'Switch anyway' : 'Start anyway'
  if (busy) confirmLabel = switching ? 'Switching...' : 'Starting...'

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
          {switching ? 'Switch to' : 'Start'} {plan.name}?
        </h2>
        <div id="switch-plan-warning" className="switch-plan-modal__body">
          {switching && (
            <p className="switch-plan-modal__warning">
              You&apos;re partway through Week {week} of {currentPlan.name}. Switching plans now will
              reset this week&apos;s progress.
            </p>
          )}
          {missing.length > 0 && (
            <p className="switch-plan-modal__warning">
              This plan needs equipment you haven&apos;t added: {equipmentList(missing)}. You can still
              start it, but some exercises will need a substitute.
            </p>
          )}
        </div>
        {switching && <p className="switch-plan-modal__note">Your finished workouts stay in your history.</p>}
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
          {confirmLabel}
        </button>
        <button type="button" className="button-subtle" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
      </div>
    </div>
  )
}

export default SwitchPlanModal
