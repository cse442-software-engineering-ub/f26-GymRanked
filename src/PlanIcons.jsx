import { EQUIPMENT_LABELS } from './planEquipment.js'

// 24x24 stroke drawings (DESIGN.md, "Icons"), one per kind of equipment a plan uses.
const ICON_PATHS = {
  barbell: ['M1.5 12h21', 'M4 7v10', 'M7 9v6', 'M17 9v6', 'M20 7v10'],
  dumbbells: ['M8.5 12h7', 'M5.5 8.5v7', 'M8.5 7v10', 'M15.5 7v10', 'M18.5 8.5v7'],
  kettlebells: ['M6.5 14.5a5.5 5.5 0 0 0 11 0c0-2-1-3.5-2-4.5h-7c-1 1-2 2.5-2 4.5z', 'M9 10c0-4 6-4 6 0'],
  resistance_bands: ['M2 9v6', 'M22 9v6', 'M2 12c4 5 16 5 20 0'],
  cable_machine: ['M5 3v18', 'M5 5h10', 'M15 5v7', 'M12 12h6v4h-6z', 'M3 21h6'],
  pullup_bar: ['M3 4h18', 'M8 4l2 6', 'M16 4l-2 6', 'M12 11v6', 'M10 21l2-4 2 4'],
  bodyweight: ['M12 5.5a1.7 1.7 0 1 0 0 .01', 'M12 9v6', 'M7 11l5-2 5 2', 'M9 21l3-6 3 6'],
}

function PlanIcon({ kind }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICON_PATHS[kind].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}

// A quick look at what a plan is trained with: an icon and a label for each piece of equipment it
// needs, or a bodyweight figure when it needs none.
function PlanIcons({ plan }) {
  const kinds = plan.required_equipment?.length > 0 ? plan.required_equipment : ['bodyweight']
  return (
    <ul className="plan-icons" aria-label="Trained with">
      {kinds.filter((kind) => ICON_PATHS[kind]).map((kind) => (
        <li key={kind} className="plan-icons__item">
          <span className="plan-icons__tile">
            <PlanIcon kind={kind} />
          </span>
          <span className="plan-icons__label">{kind === 'bodyweight' ? 'Bodyweight' : EQUIPMENT_LABELS[kind]}</span>
        </li>
      ))}
    </ul>
  )
}

export default PlanIcons
