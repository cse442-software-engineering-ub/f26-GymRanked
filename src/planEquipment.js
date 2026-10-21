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

// Plans that fit everything the user saved: their goal, at or below their experience level, and only
// equipment they have. The closest level to theirs comes first. Plans needing other equipment are left
// out here; the library still lists them after the recommended ones, marked with what they need.
export function recommendPlans(plans, { goal, experience, equipment }) {
  const userRank = LEVEL_RANK[experience] ?? 0
  return plans
    .filter((plan) => (!goal || plan.goals.includes(goal)) && LEVEL_RANK[plan.level] <= userRank)
    .map((plan) => ({ ...plan, missing_equipment: missingEquipment(plan, equipment) }))
    .filter((plan) => plan.missing_equipment.length === 0)
    .sort((a, b) => LEVEL_RANK[b.level] - LEVEL_RANK[a.level] || a.id - b.id)
}

// The plan library's order: recommended plans first, then every other plan once in the API's order.
// Without a saved setup nothing is recommended, so the library keeps its normal order.
export function orderByRecommendation(plans, setup) {
  const recommended = setup ? recommendPlans(plans, setup) : []
  const picked = new Set(recommended.map((plan) => plan.id))
  return { recommended, others: plans.filter((plan) => !picked.has(plan.id)) }
}
