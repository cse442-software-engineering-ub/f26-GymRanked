import { useEffect, useState } from 'react'
import Breadcrumb from './Breadcrumb.jsx'
import NavBar from './NavBar.jsx'
import PlanListRow from './PlanListRow.jsx'
import PlanSelectionStatus from './PlanSelectionStatus.jsx'
import { fetchPlans } from './plansApi.js'
import { missingEquipment } from './planEquipment.js'
import usePlanSelection from './usePlanSelection.jsx'
import useUserSetup from './useUserSetup.js'

function WorkoutPlanLibrary() {
  const [plans, setPlans] = useState(null)
  const [error, setError] = useState(null)
  const selection = usePlanSelection()
  const { setup } = useUserSetup()

  useEffect(() => {
    fetchPlans()
      .then(setPlans)
      .catch((err) => setError(err.message))
  }, [])

  return (
    <div className="plan-library">
      <NavBar current="Plans" />
      <main className="plan-library__content">
        <Breadcrumb crumbs={[{ label: 'Weekly plan', to: '/weekly-plan' }, { label: 'Plans' }]} />
        <div className="plan-library__heading">
          <h1>Workout plan library</h1>
          <p>Browse all training programs.</p>
        </div>
        <PlanSelectionStatus loggedOut={selection.loggedOut} notice={selection.notice} />
        {error && <p className="status">Error loading plans: {error}</p>}
        {!error && plans === null && <p className="status">Loading plans...</p>}
        {!error && plans !== null && plans.length === 0 && (
          <p className="status">No plans found</p>
        )}
        {!error && plans !== null && plans.length > 0 && (
          <ul className="plan-list">
            {plans.map((plan) => {
              const isCurrent = selection.currentPlanId === plan.id
              return (
                <li key={plan.id} className="plan-list__item">
                  <PlanListRow plan={plan} missing={setup ? missingEquipment(plan, setup.equipment) : null} />
                  <button
                    type="button"
                    className="plan-list__select"
                    onClick={() => selection.requestSelect(plan)}
                    disabled={!selection.canSelect || isCurrent}
                  >
                    {isCurrent ? 'Current plan' : 'Select'}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </main>
      {selection.switchModal}
    </div>
  )
}

export default WorkoutPlanLibrary
