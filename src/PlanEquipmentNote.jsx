import { equipmentList } from './planEquipment.js'

// Says whether the user has the gear a plan needs. missing: equipment they lack, or null when we don't
// know what they own (logged out / setup not finished), in which case nothing is shown.
function PlanEquipmentNote({ missing }) {
  if (missing === null) return null
  if (missing.length === 0) {
    return <p className="plan-equipment plan-equipment--ok">You have the equipment for this plan</p>
  }
  return (
    <p className="plan-equipment plan-equipment--needs">
      <strong>Needs more equipment:</strong> {equipmentList(missing)}
    </p>
  )
}

export default PlanEquipmentNote
