import { planMeta } from './planFormat.js'

const LEVEL_LABEL = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' }

// "Intermediate · 6-8 weeks" with the level as a colour-coded badge: green beginner, yellow
// intermediate, red advanced. The level is always written out, so colour is never the only cue.
function PlanMeta({ plan }) {
  const label = LEVEL_LABEL[plan.level]
  if (!label) return planMeta(plan)
  return (
    <>
      <span className={`level-badge level-badge--${plan.level}`}>{label}</span>
      {planMeta(plan).slice(label.length)}
    </>
  )
}

export default PlanMeta
