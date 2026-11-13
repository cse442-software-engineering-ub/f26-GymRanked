import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import NavBar from './NavBar.jsx'
import PlanSelectionStatus from './PlanSelectionStatus.jsx'
import { fetchPlans } from './plansApi.js'
import { orderByRecommendation } from './planEquipment.js'
import usePlanSelection from './usePlanSelection.jsx'

const LEVEL = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' }

// "Beginner · 3 days/week · 6 weeks": the one line of facts under a plan's name.
function facts(plan) {
  return `${LEVEL[plan.level] ?? plan.level} · ${plan.days_per_week} days/week · ${plan.duration_weeks} weeks`
}

// A plan in "Recommended for you" and "More plans": the whole card opens the plan's details, where it can be chosen.
function PlanLink({ plan }) {
  return (
    <li>
      <Link className="plan-lib__card" to={`/plans/${plan.id}`}>
        <span className="plan-lib__card-title">
          {plan.name}
          <span aria-hidden="true">↗</span>
        </span>
        {plan.summary && <p>{plan.summary}</p>}
        <small>{facts(plan)}</small>
      </Link>
    </li>
  )
}

// The plan library: the plan you follow, the plans that match your setup, then everything else behind one row
// that starts closed. Choosing or switching a plan happens on the plan's details page.
function WorkoutPlanLibrary() {
  const [plans, setPlans] = useState(null)
  const [error, setError] = useState(null)
  const selection = usePlanSelection()
  const { setup } = selection

  useEffect(() => {
    fetchPlans()
      .then(setPlans)
      .catch((err) => setError(err.message))
  }, [])

  const currentPlan = (plans ?? []).find((plan) => plan.id === selection.currentPlanId)
  // The current plan has its own card, so it is left out of the groups below it.
  const { recommended, others } = orderByRecommendation((plans ?? []).filter((plan) => plan !== currentPlan), setup)
  const hasPlansAbove = Boolean(currentPlan) || recommended.length > 0

  return (
    <div className="plan-library">
      <NavBar current="Plans" />
      <main className="plan-library__content plan-lib">
        <h1 className="plan-lib__title">Plan library</h1>
        <PlanSelectionStatus loggedOut={selection.loggedOut} notice={selection.notice} />
        {error && (
          <p className="status status--error" role="alert">
            Error loading plans: {error}
          </p>
        )}
        {!error && plans === null && <p className="status">Loading plans...</p>}
        {!error && plans !== null && plans.length === 0 && <p className="status">No plans found</p>}
        {!error && plans !== null && plans.length > 0 && (
          <>
            {currentPlan && (
              <article className="plan-lib__current" aria-labelledby="plan-lib-current">
                <div>
                  <p className="plan-lib__kicker">Current plan</p>
                  <h2 id="plan-lib-current">{currentPlan.name}</h2>
                  {currentPlan.summary && <p>{currentPlan.summary}</p>}
                  <small>{facts(currentPlan)}</small>
                </div>
                <Link className="plan-lib__button" to={`/plans/${currentPlan.id}`}>
                  View plan <span aria-hidden="true">→</span>
                </Link>
              </article>
            )}
            {recommended.length > 0 && (
              <section className="plan-lib__group" aria-labelledby="plan-lib-recommended">
                <h2 id="plan-lib-recommended">Recommended for you</h2>
                <ul className="plan-lib__grid">
                  {recommended.map((plan) => (
                    <PlanLink key={plan.id} plan={plan} />
                  ))}
                </ul>
              </section>
            )}
            {others.length > 0 && hasPlansAbove && (
              // A native <details>: closed on every visit, opens and closes with a click, Enter or Space.
              <details className="plan-lib__more">
                <summary>
                  <strong>More plans</strong>
                  <span>{others.length} {others.length === 1 ? 'program' : 'programs'}</span>
                  <span className="plan-lib__chevron" aria-hidden="true">⌄</span>
                </summary>
                <ul className="plan-lib__grid">
                  {others.map((plan) => (
                    <PlanLink key={plan.id} plan={plan} />
                  ))}
                </ul>
              </details>
            )}
            {others.length > 0 && !hasPlansAbove && (
              <section className="plan-lib__group" aria-labelledby="plan-lib-all">
                <h2 id="plan-lib-all">All plans</h2>
                <ul className="plan-lib__grid">
                  {others.map((plan) => (
                    <PlanLink key={plan.id} plan={plan} />
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  )
}

export default WorkoutPlanLibrary
