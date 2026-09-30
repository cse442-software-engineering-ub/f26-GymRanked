import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SwitchPlanModal from './SwitchPlanModal.jsx'
import { fetchCurrentPlan, selectPlan } from './plansApi.js'

// Shared by the plan library's Select buttons and the plan details page's "Start this plan":
// loads the user's current plan, confirms a switch with the Figma switch plan warning, saves
// the choice, and then goes to the weekly workout plan screen.
function usePlanSelection() {
  const navigate = useNavigate()
  // {plan, week} once loaded; plan is null when the user hasn't picked one yet.
  const [current, setCurrent] = useState(null)
  const [loggedOut, setLoggedOut] = useState(false)
  const [notice, setNotice] = useState(null)
  const [pendingPlan, setPendingPlan] = useState(null)
  const [busy, setBusy] = useState(false)
  const [selectError, setSelectError] = useState(null)

  useEffect(() => {
    fetchCurrentPlan()
      .then(setCurrent)
      .catch((err) => {
        if (err.status === 401) setLoggedOut(true)
        else setNotice(`Couldn't load your current plan: ${err.message}`)
      })
  }, [])

  async function choose(plan, fromModal) {
    setBusy(true)
    setSelectError(null)
    try {
      await selectPlan(plan.id)
      navigate('/weekly-plan')
    } catch (err) {
      setBusy(false)
      if (err.status === 401) {
        setPendingPlan(null)
        setLoggedOut(true)
      } else if (fromModal) {
        setSelectError(err.message)
      } else {
        setNotice(`Couldn't select ${plan.name}: ${err.message}`)
      }
    }
  }

  function requestSelect(plan) {
    setNotice(null)
    if (current?.plan) {
      setSelectError(null)
      setPendingPlan(plan)
    } else {
      choose(plan, false)
    }
  }

  const cancelSwitch = useCallback(() => {
    if (!busy) setPendingPlan(null)
  }, [busy])

  const switchModal =
    pendingPlan && current?.plan ? (
      <SwitchPlanModal
        plan={pendingPlan}
        currentPlan={current.plan}
        week={current.week}
        busy={busy}
        error={selectError}
        onConfirm={() => choose(pendingPlan, true)}
        onCancel={cancelSwitch}
      />
    ) : null

  return {
    currentPlanId: current?.plan?.id ?? null,
    // Buttons stay disabled until the current plan has loaded, while saving, and when logged out.
    canSelect: current !== null && !loggedOut && !busy,
    loggedOut,
    notice,
    requestSelect,
    switchModal,
  }
}

export default usePlanSelection
