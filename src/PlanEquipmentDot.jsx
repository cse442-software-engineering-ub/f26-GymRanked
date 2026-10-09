import { equipmentList } from './planEquipment.js'

// A green or red dot saying whether the user has the equipment a plan needs; hovering or focusing
// it shows "Sufficient equipment" / "Insufficient equipment" (plus what's missing). missing:
// equipment they lack, or null when we don't know what they own (logged out / setup not
// finished), in which case nothing is shown.
function PlanEquipmentDot({ missing }) {
  if (missing === null) return null
  const enough = missing.length === 0
  const label = enough ? 'Sufficient equipment' : 'Insufficient equipment'
  return (
    <span
      className={`equipment-dot equipment-dot--${enough ? 'ok' : 'short'}`}
      tabIndex={0}
      role="img"
      aria-label={enough ? label : `${label}: you need ${equipmentList(missing)}`}
    >
      <span className="equipment-dot__mark" aria-hidden="true" />
      <span className="equipment-dot__tip" aria-hidden="true">
        {label}
        {!enough && <span className="equipment-dot__need">Needs {equipmentList(missing)}</span>}
      </span>
    </span>
  )
}

export default PlanEquipmentDot
