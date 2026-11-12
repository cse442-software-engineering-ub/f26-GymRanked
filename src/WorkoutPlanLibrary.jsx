import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

  const currentPlan = (plans ?? []).find((plan) => plan.id === selection.currentPlanId)
  // The current plan has its own section, so it is left out of the two groups below it.
  const { recommended, others } = orderByRecommendation((plans ?? []).filter((plan) => plan !== currentPlan), setup)
  const hasPlansAbove = Boolean(currentPlan) || recommended.length > 0

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
            {currentPlan && (
              <section aria-labelledby="plans-current">
                <h2 id="plans-current" className="plan-library__group">Your current plan</h2>
                <PlanCarousel plans={[currentPlan]} label="Your current plan" renderPlan={renderPlan} />
              </section>
            )}
            {recommended.length > 0 && (
              <section aria-labelledby="plans-recommended">
                <h2 id="plans-recommended" className="plan-library__group">Recommended plans</h2>
                <p className="plan-library__reason">Matches your goal, level and equipment.</p>
                <PlanCarousel plans={recommended} label="Recommended plans" renderPlan={renderPlan} />
              </section>
            )}
            {others.length > 0 && hasPlansAbove && (
              // A native <details>: closed on every visit, opens and closes with a click, Enter or Space.
              <details className="plan-more">
                <summary className="plan-more__toggle">
                  <span>More plans ({others.length})</span>
                  <svg className="plan-more__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </summary>
                <PlanCarousel plans={others} label="More plans" renderPlan={renderPlan} />
              </details>
            )}
            {others.length > 0 && !hasPlansAbove && (
              <section aria-labelledby="plans-all">
                <h2 id="plans-all" className="plan-library__group">All plans</h2>
                <PlanCarousel plans={others} label="All plans" renderPlan={renderPlan} />
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
