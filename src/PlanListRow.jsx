import { Link } from 'react-router-dom'
import PlanIcons from './PlanIcons.jsx'
import PlanEquipmentNote from './PlanEquipmentNote.jsx'
import { planMeta } from './planFormat.js'

// missing: see PlanEquipmentNote. Omit it to show the row without equipment info.
function PlanListRow({ plan, missing = null }) {
  return (
    <Link to={`/plans/${plan.id}`} className="plan-row">
      <div className="plan-row__info">
        <p className="plan-row__name">{plan.name}</p>
        <p className="plan-row__meta">{planMeta(plan)}</p>
        <PlanIcons plan={plan} />
        <PlanEquipmentNote missing={missing} />
      </div>
      <p className="plan-row__frequency">{plan.days_per_week} days/wk</p>
    </Link>
  )
}

export default PlanListRow
