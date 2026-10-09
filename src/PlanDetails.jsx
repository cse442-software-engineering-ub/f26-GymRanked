import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Breadcrumb from './Breadcrumb.jsx'
import NavBar from './NavBar.jsx'
import PlanEquipmentNote from './PlanEquipmentNote.jsx'
import { EQUIPMENT_LABELS, missingEquipment } from './planEquipment.js'
import { planMeta } from './planFormat.js'
import PlanSelectionStatus from './PlanSelectionStatus.jsx'
import { fetchPlan } from './plansApi.js'
import usePlanSelection from './usePlanSelection.jsx'
import useUserSetup from './useUserSetup.js'

function PlanDetails() {
  const { id } = useParams()
  const [plan, setPlan] = useState(null)
  const [error, setError] = useState(null)
  const selection = usePlanSelection()
  const { setup } = useUserSetup()

  useEffect(() => {
    setPlan(null)
    setError(null)
    fetchPlan(id)
      .then(setPlan)
      .catch((err) => setError(err.message))
  }, [id])

  const crumbs = [{ label: 'Weekly plan', to: '/weekly-plan' }, { label: 'Plans', to: '/plans' }]
  if (plan) crumbs.push({ label: plan.name })

  return (
    <div className="plan-library">
      <NavBar current="Plans" />
      <main className="plan-details">
        <Breadcrumb crumbs={crumbs} />
        <PlanSelectionStatus loggedOut={selection.loggedOut} notice={selection.notice} />
        {error && <p className="status">Error loading plan: {error}</p>}
        {!error && plan === null && <p className="status">Loading plan...</p>}
        {plan && (
          <>
            <div className="plan-details__title">
              <h1>{plan.name}</h1>
              <p className="plan-details__frequency">{plan.days_per_week} days/wk</p>
            </div>
            <p className="plan-details__meta">{planMeta(plan)}</p>
            {plan.description && <p className="plan-details__description">{plan.description}</p>}
            <p className="plan-details__equipment">
              Equipment:{' '}
              {plan.required_equipment.length === 0
                ? 'none needed'
                : plan.required_equipment.map((item) => EQUIPMENT_LABELS[item]).join(', ')}
            </p>
            <PlanEquipmentNote missing={setup ? missingEquipment(plan, setup.equipment) : null} />
            <h2 className="plan-details__subheading">Weekly split</h2>
            {plan.days.length === 0 ? (
              <p className="status">No weekly split yet</p>
            ) : (
              <ul className="plan-split">
                {plan.days.map((day) => (
                  <li key={day.name} className="plan-split__day">
                    <span className="plan-split__name">{day.name}</span>
                    <span className="plan-split__detail">
                      <span className="plan-split__focus">{day.focus}</span>
                      <span className="plan-split__duration">~{day.duration_minutes} min</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              className="button-primary"
              onClick={() => selection.requestSelect(plan)}
              disabled={!selection.canSelect || selection.currentPlanId === plan.id}
            >
              {selection.currentPlanId === plan.id ? 'This is your current plan' : 'Start this plan'}
            </button>
          </>
        )}
      </main>
      {selection.switchModal}
    </div>
  )
}

export default PlanDetails
