import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SwitchPlanModal from './SwitchPlanModal.jsx'
import { equipmentList, missingEquipment } from './planEquipment.js'
import { fetchCurrentPlan, selectPlan } from './plansApi.js'
import useUserSetup from './useUserSetup.js'

// What to tell the user when saving a plan fails.
function failureMessage(plan, err) {
  if (err.status === 404) return `${plan.name} is no longer available. Pick another plan.`
  if (err.status >= 500 || !err.status) return `Couldn't select ${plan.name} right now. Check your connection and try again.`
  return `Couldn't select ${plan.name}: ${err.message}`
}

// Shared by the plan library's Select buttons, the plan details page's "Start this plan" and the
// onboarding recommendations: loads the user's current plan, asks for confirmation when switching
// plans or when the plan needs equipment the user lacks, saves the choice, and then goes to the
// dashboard with a message saying what changed.
function usePlanSelection() {
  const navigate = useNavigate()
  const { setup, loaded: setupLoaded } = useUserSetup()
  // {plan, week} once loaded; plan is null when the user hasn't picked one yet.
  const [current, setCurrent] = useState(null)
  const [loggedOut, setLoggedOut] = useState(false)
  const [notice, setNotice] = useState(null)
  // {plan, missing} while the confirmation dialog is open.
  const [pending, setPending] = useState(null)
  const [busyPlanId, setBusyPlanId] = useState(null)
  const [selectError, setSelectError] = useState(null)

  useEffect(() => {
    fetchCurrentPlan()
      .then(setCurrent)
      .catch((err) => {
        if (err.status === 401) setLoggedOut(true)
        else setNotice(`Couldn't load your current plan: ${err.message}. Reload the page to try again.`)
      })
  }, [])

  async function choose(plan, missing, fromModal) {
    setBusyPlanId(plan.id)
    setSelectError(null)
    try {
      await selectPlan(plan.id)
      const start = current?.plan
        ? `Switched to ${plan.name}. Your week starts over today.`
        : `${plan.name} is now your plan. Week 1 starts today.`
      const gear = missing.length > 0 ? ` You'll still need: ${equipmentList(missing)}.` : ''
      navigate('/dashboard', { state: { planNotice: start + gear } })
    } catch (err) {
      setBusyPlanId(null)
      if (err.status === 401) {
        setPending(null)
        setLoggedOut(true)
      } else if (fromModal) {
        setSelectError(failureMessage(plan, err))
      } else {
        setNotice(failureMessage(plan, err))
      }
    }
  }

  function requestSelect(plan) {
    setNotice(null)
    const missing = setup ? missingEquipment(plan, setup.equipment) : []
    if (current?.plan || missing.length > 0) {
      setSelectError(null)
      setPending({ plan, missing })
    } else {
      choose(plan, missing, false)
    }
  }

  const cancelSwitch = useCallback(() => {
    if (busyPlanId === null) setPending(null)
  }, [busyPlanId])

  const switchModal = pending ? (
    <SwitchPlanModal
      plan={pending.plan}
      currentPlan={current?.plan ?? null}
      week={current?.week}
      missing={pending.missing}
      busy={busyPlanId !== null}
      error={selectError}
      onConfirm={() => choose(pending.plan, pending.missing, true)}
      onCancel={cancelSwitch}
    />
  ) : null

  return {
    currentPlanId: current?.plan?.id ?? null,
    // Buttons stay disabled until the current plan has loaded, while saving, and when logged out.
    canSelect: current !== null && !loggedOut && busyPlanId === null,
    // Id of the plan being saved right now, so its button can say "Selecting...".
    busyPlanId,
    loggedOut,
    notice,
    setup,
    setupLoaded,
    requestSelect,
    switchModal,
  }
}

export default usePlanSelection
