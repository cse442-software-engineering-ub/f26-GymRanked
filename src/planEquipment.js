// Matching plans to what a user has: which equipment a plan still needs, and the onboarding recommendations.
// Equipment values match api/setup.php and database/migrations/008_plan_requirements.sql.

export const EQUIPMENT_LABELS = {
  bodyweight: 'Bodyweight only',
  dumbbells: 'Dumbbells',
  barbell: 'Barbell',
  kettlebells: 'Kettlebells',
  resistance_bands: 'Resistance bands',
  cable_machine: 'Cable machine',
  pullup_bar: 'Pull-up bar',
  full_gym: 'Full gym access',
}

const LEVEL_RANK = { beginner: 0, intermediate: 1, advanced: 2 }

// Equipment a plan needs that the user doesn't have. Full gym access covers everything.
export function missingEquipment(plan, owned) {
  if (owned.includes('full_gym')) return []
  return (plan.required_equipment ?? []).filter((item) => !owned.includes(item))
}

export function equipmentList(items) {
  const names = items.map((item) => EQUIPMENT_LABELS[item] ?? item)
  if (names.length <= 1) return names.join('')
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}

// Plans for the user's goal at or below their experience level. Plans they can do with what they have
// come first, then plans closest to their level; plans needing more equipment stay in the list (marked).
export function recommendPlans(plans, { goal, experience, equipment }) {
  const userRank = LEVEL_RANK[experience] ?? 0
  return plans
    .filter((plan) => (!goal || plan.goals.includes(goal)) && LEVEL_RANK[plan.level] <= userRank)
    .map((plan) => ({ ...plan, missing_equipment: missingEquipment(plan, equipment) }))
    .sort(
      (a, b) =>
        a.missing_equipment.length - b.missing_equipment.length ||
        LEVEL_RANK[b.level] - LEVEL_RANK[a.level] ||
        a.id - b.id,
    )
}
