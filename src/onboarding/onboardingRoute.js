// Saved preferences, rather than browser state, determine where an account resumes.
export function requiredOnboardingRoute(goal, setup) {
  if (!goal) return '/goal'
  if (!setup?.experience) return '/experience'
  if (!Array.isArray(setup.equipment) || setup.equipment.length === 0) return '/equipment'
  return null
}

// While onboarding is unfinished, the steps up to and including the required one stay open.
const STEP_ORDER = ['/goal', '/experience', '/equipment']

export function allowedOnboardingPaths(required) {
  return STEP_ORDER.slice(0, STEP_ORDER.indexOf(required) + 1)
}
