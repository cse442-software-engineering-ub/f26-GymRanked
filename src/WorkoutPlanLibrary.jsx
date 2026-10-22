import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Breadcrumb from './Breadcrumb.jsx'
import NavBar from './NavBar.jsx'
import PlanCard from './PlanCard.jsx'
import PlanCarousel from './PlanCarousel.jsx'
import PlanPreferences from './PlanPreferences.jsx'
import PlanSelectionStatus from './PlanSelectionStatus.jsx'
import { fetchPlans } from './plansApi.js'
import { missingEquipment, orderByRecommendation } from './planEquipment.js'
import usePlanSelection from './usePlanSelection.jsx'

function WorkoutPlanLibrary() {
  const [plans, setPlans] = useState(null)
  const [error, setError] = useState(null)
  const selection = usePlanSelection()
  const { setup } = selection
  const navigate = useNavigate()

  // The whole card opens the plan's details; its button and link keep their own actions.
  function openDetails(event, plan) {
    if (event.target.closest('button, a')) return
    navigate(`/plans/${plan.id}`)
  }

  const { recommended, others } = orderByRecommendation(plans ?? [], setup)
  const currentPlan = (plans ?? []).find((plan) => plan.id === selection.currentPlanId)

  function renderPlan(plan) {
    return (
      <li key={plan.id}>
        <PlanCard
          plan={plan}
          missing={setup ? missingEquipment(plan, setup.equipment) : null}
          isCurrent={selection.currentPlanId === plan.id}
          busy={selection.busyPlanId === plan.id}
          canSelect={selection.canSelect}
          onSelect={() => selection.requestSelect(plan)}
          onOpen={(event) => openDetails(event, plan)}
        />
      </li>
    )
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
        <header className="plan-library__heading">
          <p className="plan-library__eyebrow">Training library</p>
          <h1>Find your next workout plan</h1>
          <p>Browse all training programs and pick the one that fits your goal, schedule and equipment.</p>
        </header>
        <PlanPreferences setup={setup} currentPlan={currentPlan} />
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
          <>
            {recommended.length > 0 && (
              <section aria-labelledby="plans-recommended">
                <h2 id="plans-recommended" className="plan-library__group">Recommended plans</h2>
                <p className="plan-library__reason">Matches your goal, level and equipment.</p>
                <PlanCarousel plans={recommended} label="Recommended plans" renderPlan={renderPlan} />
              </section>
            )}
            {others.length > 0 && (
              <section aria-labelledby="plans-all">
                <h2 id="plans-all" className="plan-library__group">{recommended.length > 0 ? 'More plans' : 'All plans'}</h2>
                <PlanCarousel plans={others} label={recommended.length > 0 ? 'More plans' : 'All plans'} renderPlan={renderPlan} />
              </section>
            )}
          </>
        )}
      </main>
      {selection.switchModal}
    </div>
  )
}

export default WorkoutPlanLibrary
