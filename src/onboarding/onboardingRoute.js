// Saved preferences, rather than browser state, determine where an account resumes.
export function requiredOnboardingRoute(goal, setup, details) {
  // Completed training setup predates this feature for existing accounts.
  // They can add details voluntarily without losing access to their plan.
  const trainingComplete = goal && setup?.experience && Array.isArray(setup.equipment) && setup.equipment.length > 0
  if (!trainingComplete && !details?.complete) return '/personal-details'
  if (!goal) return '/goal'
  if (!setup?.experience) return '/experience'
  if (!Array.isArray(setup.equipment) || setup.equipment.length === 0) return '/equipment'
  return null
}

// While onboarding is unfinished, the steps up to and including the required one stay open.
const STEP_ORDER = ['/personal-details', '/goal', '/experience', '/equipment']

export function allowedOnboardingPaths(required) {
  return STEP_ORDER.slice(0, STEP_ORDER.indexOf(required) + 1)
}

const AUTH_PATHS = ['/login', '/register']
const ONBOARDING_PATHS = [...STEP_ORDER, '/setup', '/recommended']

export function isAuthPath(path) {
  return AUTH_PATHS.includes(path)
}

export function signedInRedirect(path, required, equipmentJustSaved = false) {
  if (isAuthPath(path)) return required ?? '/dashboard'
  if (required) return allowedOnboardingPaths(required).includes(path) ? null : required
  if (path === '/personal-details') return null
  if (ONBOARDING_PATHS.includes(path) && !(path === '/recommended' && equipmentJustSaved)) {
    return '/dashboard'
  }
  return null
}
