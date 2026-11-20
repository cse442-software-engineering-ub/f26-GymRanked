import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import PlanSelectionStatus from './PlanSelectionStatus.jsx'
import { fetchPlans } from './plansApi.js'
import { orderByRecommendation } from './planEquipment.js'
import usePlanSelection from './usePlanSelection.jsx'

const LEVEL = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' }

// "Beginner · 3 days/week · 6 weeks": the one line of facts under a plan's name.
function facts(plan) {
  return `${LEVEL[plan.level] ?? plan.level} · ${plan.days_per_week} days/week · ${plan.duration_weeks} weeks`
}

// The phone layout's big numbers ("5 days/week", "10 weeks"). Hidden from screen readers and on wider screens, where
// the facts line says the same thing.
function Stats({ plan, className }) {
  return (
    <div className={className} aria-hidden="true">
      <span><b>{plan.days_per_week}</b> days/wk</span>
      <span><b>{plan.duration_weeks}</b> weeks</span>
    </div>
  )
}

// The level with its coloured dot, at the top of a phone card.
function Level({ level }) {
  return (
    <span className="plan-lib__level" data-level={level} aria-hidden="true">
      {LEVEL[level] ?? level}
    </span>
  )
}

// A plan in "Recommended for you" and "More plans": the whole card opens the plan's details, where it can be chosen.
function PlanLink({ plan, arrow = true, current }) {
  return (
    // data-current: the card in the middle of a phone carousel; the others are dimmed (index.css).
    <li data-current={current}>
      <Link className="plan-lib__card" to={`/plans/${plan.id}`} state={{ from: '/plans' }}>
        <Level level={plan.level} />
        <span className="plan-lib__card-title">
          {plan.name}
          {arrow && <span aria-hidden="true">↗</span>}
        </span>
        {plan.summary && <p>{plan.summary}</p>}
        <small data-level={plan.level}>{facts(plan)}</small>
        <Stats plan={plan} className="plan-lib__stats" />
      </Link>
    </li>
  )
}

// A list of plan cards ("Recommended for you", "More plans"). On a phone (index.css) the list is a swipeable row that snaps card by card
// to the middle, and a dot under it marks each card: the one in the middle is current (the others are dimmed), and a dot scrolls to its card. On wider screens it is
// the plan grid and the dots are hidden.
function PlanCarousel({ plans, label, arrow = true }) {
  const [active, setActive] = useState(0)
  const listRef = useRef(null)

  // The current card is the one whose middle is nearest the middle of the row.
  function onScroll() {
    const list = listRef.current
    if (!list) return
    const middle = list.scrollLeft + list.clientWidth / 2
    let nearest = 0
    let best = Infinity
    Array.from(list.children).forEach((card, index) => {
      const distance = Math.abs(card.offsetLeft + card.offsetWidth / 2 - middle)
      if (distance < best) {
        best = distance
        nearest = index
      }
    })
    setActive(nearest)
  }

  function showCard(index) {
    const list = listRef.current
    const card = list?.children[index]
    if (!card) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    list.scrollTo({
      left: card.offsetLeft + card.offsetWidth / 2 - list.clientWidth / 2,
      behavior: reduceMotion ? 'auto' : 'smooth',
    })
  }

  return (
    <>
      <ul className="plan-lib__grid" ref={listRef} onScroll={onScroll}>
        {plans.map((plan, index) => (
          <PlanLink key={plan.id} plan={plan} arrow={arrow} current={index === active} />
        ))}
      </ul>
      {plans.length > 1 && (
        <div className="plan-lib__dots" role="group" aria-label={`${label} pages`}>
          {plans.map((plan, index) => (
            <button
              key={plan.id}
              type="button"
              className="plan-lib__dot"
              aria-label={`Show plan ${index + 1} of ${plans.length}: ${plan.name}`}
              aria-current={index === active ? 'true' : undefined}
              onClick={() => showCard(index)}
            />
          ))}
        </div>
      )}
    </>
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
                  <small data-level={currentPlan.level}>{facts(currentPlan)}</small>
                  <div className="plan-lib__current-stats" aria-hidden="true">
                    <span><b>{currentPlan.days_per_week}</b> days/week</span>
                    <span><b>{currentPlan.duration_weeks}</b> weeks</span>
                    <span><b>{LEVEL[currentPlan.level] ?? currentPlan.level}</b> level</span>
                  </div>
                </div>
                <Link className="plan-lib__button" to={`/plans/${currentPlan.id}`} state={{ from: '/plans' }}>
                  View plan <span aria-hidden="true">→</span>
                </Link>
              </article>
            )}
            {recommended.length > 0 && (
              <section className="plan-lib__group" aria-labelledby="plan-lib-recommended">
                <h2 id="plan-lib-recommended">Recommended for you</h2>
                <PlanCarousel plans={recommended} label="Recommended plans" />
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
                <PlanCarousel plans={others} label="More plans" arrow={false} />
              </details>
            )}
            {others.length > 0 && !hasPlansAbove && (
              <section className="plan-lib__group plan-lib__group--all" aria-labelledby="plan-lib-all">
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
