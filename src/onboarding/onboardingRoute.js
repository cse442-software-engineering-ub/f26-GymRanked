// Saved preferences, rather than browser state, determine where an account resumes.
export function requiredOnboardingRoute(goal, setup) {
  if (!goal) return '/goal'
  if (!setup?.experience || !Array.isArray(setup.equipment) || setup.equipment.length === 0) return '/setup'
  return null
}
