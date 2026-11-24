import { useEffect, useRef, useState } from 'react'
import { useLocation, useParams, useSearchParams } from 'react-router-dom'
import BackLink from './BackLink.jsx'
import BodyFigure from './BodyFigure.jsx'
import PlanEquipmentDot from './PlanEquipmentDot.jsx'
import { MUSCLE_LABELS, musclesFor } from './exerciseMuscles.js'
import { EQUIPMENT_LABELS, missingEquipment } from './planEquipment.js'
import PlanMeta from './PlanMeta.jsx'
import PlanSelectionStatus from './PlanSelectionStatus.jsx'
import { fetchPlan } from './plansApi.js'
import usePlanSelection from './usePlanSelection.jsx'

// ?day=N (1 = the plan's first day, in the order api/plan.php returns them) opens the page at that day: the Dashboard's
// "Next up" links here (#136). The day is highlighted, labelled "Next up" and scrolled into view; any other value is
// ignored and the page opens at the top as usual.
function dayFromQuery(value, dayCount) {
  if (!/^[1-9]\d?$/.test(value ?? '')) return null
  const day = Number(value)
  return day <= dayCount ? day : null
}

function PlanDetails() {
  const { id } = useParams()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const highlighted = useRef(null)
  const returnPages = {
    '/plans': 'plan library',
    '/weekly-plan': 'workouts',
    '/dashboard': 'dashboard',
    '/recommended': 'recommended plans',
  }
  const returnPath = Object.hasOwn(returnPages, location.state?.from) ? location.state.from : '/plans'
  const [plan, setPlan] = useState(null)
  const [error, setError] = useState(null)
  const selection = usePlanSelection()
  const { setup } = selection

  useEffect(() => {
    setPlan(null)
    setError(null)
    fetchPlan(id)
      .then(setPlan)
      .catch((err) => setError(err.message))
  }, [id])

  const nextDay = plan ? dayFromQuery(searchParams.get('day'), plan.days.length) : null

  // Bring the day into view once the plan has loaded.
  useEffect(() => {
    highlighted.current?.scrollIntoView?.({ block: 'center' })
  }, [nextDay])

  return (
    <div className="plan-library">
      <main className="plan-details">
        <BackLink to={returnPath} state={returnPath === '/recommended' ? { inOnboarding: true } : undefined}>Back to {returnPages[returnPath]}</BackLink>
        <PlanSelectionStatus loggedOut={selection.loggedOut} notice={selection.notice} />
        {error && <p className="status">Error loading plan: {error}</p>}
        {!error && plan === null && <p className="status">Loading plan...</p>}
        {plan && (
          <>
            <div className="plan-details__title">
              <h1>{plan.name}</h1>
              <p className="plan-details__frequency">{plan.days_per_week} days/wk</p>
            </div>
            <p className="plan-details__meta"><PlanMeta plan={plan} /></p>
            {plan.description && <p className="plan-details__description">{plan.description}</p>}
            <p className="plan-details__equipment">
              Equipment:{' '}
              {plan.required_equipment.length === 0
                ? 'none needed'
                : plan.required_equipment.map((item) => EQUIPMENT_LABELS[item]).join(', ')}
              <PlanEquipmentDot missing={setup ? missingEquipment(plan, setup.equipment) : null} />
            </p>
            <h2 className="plan-details__subheading">Weekly split</h2>
            {plan.days.length === 0 ? (
              <p className="status">No weekly split yet</p>
            ) : (
              <ul className="plan-split">
                {plan.days.map((day, index) => (
                  <li key={day.name} ref={index + 1 === nextDay ? highlighted : undefined}
                    className={index + 1 === nextDay ? 'plan-split__item plan-split__item--next' : 'plan-split__item'}
                    aria-current={index + 1 === nextDay ? 'step' : undefined}>
                    <div className="plan-split__day">
                      <span className="plan-split__name">
                        {day.name}
                        {index + 1 === nextDay && <span className="plan-split__badge">Next up</span>}
                      </span>
                      <span className="plan-split__detail">
                        <span className="plan-split__focus">{day.focus}</span>
                        <span className="plan-split__duration">~{day.duration_minutes} min</span>
                      </span>
                    </div>
                    {day.exercises.length > 0 && (
                      <ul className="plan-exercises" aria-label={`${day.name} exercises`}>
                        {day.exercises.map((exercise) => {
                          const muscles = musclesFor(exercise)
                          return (
                            <li key={exercise} className="plan-exercise">
                              <BodyFigure muscles={muscles} />
                              <span className="plan-exercise__text">
                                <span className="plan-exercise__name">{exercise}</span>
                                {muscles.length > 0 && (
                                  <span className="plan-exercise__muscles">
                                    {muscles.map((muscle) => MUSCLE_LABELS[muscle]).join(', ')}
                                  </span>
                                )}
                              </span>
                            </li>
                          )
                        })}
                      </ul>
                    )}
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
              {selection.currentPlanId === plan.id
                ? 'This is your current plan'
                : selection.busyPlanId === plan.id
                  ? 'Starting...'
                  : 'Start this plan'}
            </button>
          </>
        )}
      </main>
      {selection.switchModal}
    </div>
  )
}

export default PlanDetails
