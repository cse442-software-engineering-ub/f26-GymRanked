import { Link } from 'react-router-dom'
import { planMeta } from './planFormat.js'

function PlanListRow({ plan }) {
  return (
    <Link to={`/plans/${plan.id}`} className="plan-row">
      <div className="plan-row__info">
        <p className="plan-row__name">{plan.name}</p>
        <p className="plan-row__meta">{planMeta(plan)}</p>
      </div>
      <p className="plan-row__frequency">{plan.days_per_week} days/wk</p>
    </Link>
  )
}

export default PlanListRow
