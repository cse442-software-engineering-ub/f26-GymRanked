import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Breadcrumb from './Breadcrumb.jsx'
import NavBar from './NavBar.jsx'
import PlanListRow from './PlanListRow.jsx'
import PlanSelectionStatus from './PlanSelectionStatus.jsx'
import { fetchPlans } from './plansApi.js'
import { missingEquipment } from './planEquipment.js'
import usePlanSelection from './usePlanSelection.jsx'
import YourSetup from './YourSetup.jsx'

function WorkoutPlanLibrary() {
  const [plans, setPlans] = useState(null)
  const [error, setError] = useState(null)
  const selection = usePlanSelection()
  const { setup } = selection
  const navigate = useNavigate()

  // The whole card opens the plan's details; its button, link and equipment dot keep their own actions.
  function openDetails(event, plan) {
    if (event.target.closest('button, a, .equipment-dot')) return
    navigate(`/plans/${plan.id}`)
  }

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
        <YourSetup setup={setup} />
        <PlanSelectionStatus loggedOut={selection.loggedOut} notice={selection.notice} />
        {error && (
          <p className="status status--error" role="alert">
            Error loading plans: {error}
          </p>
        )}
        {!error && plans === null && <p className="status">Loading plans...</p>}
        {!error && plans !== null && plans.length === 0 && (
          <p className="status">No plans found</p>
        )}
        {!error && plans !== null && plans.length > 0 && (
          <ul className="plan-list">
            {plans.map((plan) => {
              const isCurrent = selection.currentPlanId === plan.id
              return (
                <li
                  key={plan.id}
                  className={`plan-list__item${isCurrent ? ' plan-list__item--current' : ''}`}
                  onClick={(event) => openDetails(event, plan)}
                >
                  <PlanListRow plan={plan} missing={setup ? missingEquipment(plan, setup.equipment) : null} />
                  <button
                    type="button"
                    className="plan-list__select"
                    onClick={() => selection.requestSelect(plan)}
                    disabled={!selection.canSelect || isCurrent}
                  >
                    {isCurrent ? (
                      <>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M5 12.5l4.5 4.5L19 7.5" />
                        </svg>
                        Current plan
                      </>
                    ) : selection.busyPlanId === plan.id ? (
                      'Selecting...'
                    ) : (
                      'Select'
                    )}
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
