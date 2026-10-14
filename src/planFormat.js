function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1)
}

// "Intermediate · 6-8 weeks", shared by the plan library rows and the plan details page.
export function planMeta(plan) {
  return `${capitalize(plan.level)} · ${plan.duration_weeks} weeks`
}
