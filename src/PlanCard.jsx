import { Link } from 'react-router-dom'
import PlanIcons from './PlanIcons.jsx'
import PlanMeta from './PlanMeta.jsx'
import { equipmentList } from './planEquipment.js'

const INTENSITY_LABEL = { low: 'Low', moderate: 'Moderate', high: 'High' }

// One plan in the library, in the order people compare plans: name and focus, summary, level and
// length, the numbers (days, session, intensity), equipment and whether you have it, then the button.
// missing: equipment the user lacks (null when unknown, which hides the equipment line). isCurrent: this is the plan the user follows. The whole card opens
// the details (WorkoutPlanLibrary), while the name link and the button keep their own actions.
function PlanCard({ plan, missing = null, isCurrent, busy, canSelect, onSelect, onOpen }) {
  const headingId = `plan-card-${plan.id}`
  return (
    <article
      className={`plan-list__item${isCurrent ? ' plan-list__item--current' : ''}`}
      aria-labelledby={headingId}
      onClick={onOpen}
    >
      <header className="plan-card__header">
        {plan.focus && <p className="plan-card__focus">{plan.focus}</p>}
        <h3 id={headingId} className="plan-row__name">
          <Link to={`/plans/${plan.id}`}>{plan.name}</Link>
        </h3>
      </header>
      {plan.summary && <p className="plan-card__summary">{plan.summary}</p>}
      <p className="plan-row__meta">
        <PlanMeta plan={plan} />
      </p>
      <dl className="plan-card__stats">
        <div>
          <dt>Schedule</dt>
          <dd className="plan-row__frequency">{plan.days_per_week} days/wk</dd>
        </div>
        {plan.session_minutes != null && (
          <div>
            <dt>Session</dt>
            <dd>{plan.session_minutes} min</dd>
          </div>
        )}
        {INTENSITY_LABEL[plan.intensity] && (
          <div>
            <dt>Intensity</dt>
            <dd>{INTENSITY_LABEL[plan.intensity]}</dd>
          </div>
        )}
      </dl>
      <PlanIcons plan={plan} />
      {missing !== null && (
        <p className={`plan-card__fit plan-card__fit--${missing.length === 0 ? 'ok' : 'short'}`}>
          {missing.length === 0 ? '✓ Equipment ready' : `⚠ Needs ${equipmentList(missing)}`}
        </p>
      )}
      <button
        type="button"
        className="plan-list__select"
        aria-pressed={isCurrent}
        onClick={onSelect}
        disabled={!canSelect || isCurrent}
      >
        {isCurrent ? (
          <>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
            Current plan
          </>
        ) : busy ? (
          'Selecting...'
        ) : (
          'Choose plan'
        )}
      </button>
    </article>
  )
}

export default PlanCard
