import { Link } from 'react-router-dom'
import { EQUIPMENT_LABELS } from './planEquipment.js'
import { LEVELS } from './onboarding/setupOptions.js'

const GOAL_LABELS = { strength: 'Strength', fat_loss: 'Fat loss', aerobic: 'Aerobic fitness' }

// The saved setup as a compact summary above the plans: goal, experience, schedule and equipment, with
// "Edit preferences" to the goal page. setup is { goal, experience, equipment } from usePlanSelection and
// is null while setup is unfinished, so nothing shows. currentPlan is the plan the user follows (or
// undefined); setup has no schedule of its own, so the schedule is that plan's days per week.
function PlanPreferences({ setup, currentPlan }) {
  if (!setup) return null
  const equipment = setup.equipment.map((item) => EQUIPMENT_LABELS[item] ?? item)
  const items = [
    ['Goal', GOAL_LABELS[setup.goal]],
    ['Experience', LEVELS.find((level) => level.value === setup.experience)?.label],
    ['Schedule', currentPlan ? `${currentPlan.days_per_week} days/wk` : 'No plan yet'],
    ['Equipment', equipment],
  ].filter(([, value]) => value && value.length > 0)
  return (
    <section className="plan-prefs" aria-label="Your preferences">
      <dl className="plan-prefs__list">
        {items.map(([label, value]) => (
          <div key={label} className={`plan-prefs__item${label === 'Equipment' ? ' plan-prefs__item--wide' : ''}`}>
            <dt>{label}</dt>
            <dd>
              {Array.isArray(value) ? (
                <ul className="plan-prefs__chips">
                  {value.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                value
              )}
            </dd>
          </div>
        ))}
      </dl>
      <Link className="plan-prefs__edit" to="/goal">
        Edit preferences
      </Link>
    </section>
  )
}

export default PlanPreferences
