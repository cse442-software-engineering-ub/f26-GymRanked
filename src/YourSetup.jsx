import { Link } from 'react-router-dom'
import { EQUIPMENT_LABELS } from './planEquipment.js'
import { LEVELS } from './onboarding/setupOptions.js'

const GOAL_LABELS = { strength: 'Strength', fat_loss: 'Fat loss', aerobic: 'Aerobic fitness' }

// "Your setup: Strength · Intermediate · Full gym access — Edit", from usePlanSelection's setup
// ({ goal, experience, equipment }). Nothing shows while setup is unfinished (setup is null).
function YourSetup({ setup }) {
  if (!setup) return null
  const parts = [
    GOAL_LABELS[setup.goal],
    LEVELS.find((level) => level.value === setup.experience)?.label,
    setup.equipment.map((item) => EQUIPMENT_LABELS[item] ?? item).join(', '),
  ].filter(Boolean)
  return (
    <p className="your-setup">
      <span className="your-setup__label">Your setup</span>
      <span className="your-setup__value">{parts.join(' · ')}</span>
      <Link className="your-setup__edit" to="/goal">
        Edit
      </Link>
    </p>
  )
}

export default YourSetup
