// Checks the weight and reps a user typed for one set before anything is sent to the server.
// Inputs are the raw strings from the form fields. Story #7 (daily workout logging).
//
// Rules (agreed with the backend so both sides reject the same values):
//   weight: 0–1500 lb with at most 2 decimal places (e.g. 137.25); 0 means a bodyweight set.
//   reps:   a whole number from 1 to 100.

export const WEIGHT_MAX_LB = 1500
export const REPS_MIN = 1
export const REPS_MAX = 100

export const MESSAGES = {
  weightEmpty: 'Enter a weight (0 for bodyweight).',
  weightNotNumber: 'Enter a weight as a number.',
  weightRange: `Weight must be between 0 and ${WEIGHT_MAX_LB} lb.`,
  weightDecimals: 'Use at most 2 decimal places, like 137.25.',
  repsEmpty: 'Enter your reps.',
  repsNotNumber: 'Enter reps as a number.',
  repsWhole: 'Reps must be a whole number.',
  repsRange: `Reps must be between ${REPS_MIN} and ${REPS_MAX}.`,
}

// Plain decimal numbers only, so "1e3", "0x10" and "12abc" are refused rather than quietly converted.
const NUMBER = /^-?(\d+\.?\d*|\.\d+)$/

// How many digits come after the decimal point, ignoring trailing zeros ("135.50" counts as 1).
function decimalPlaces(text) {
  const fraction = text.split('.')[1] ?? ''
  return fraction.replace(/0+$/, '').length
}

function checkWeight(raw) {
  const text = String(raw ?? '').trim()
  if (text === '') return { error: MESSAGES.weightEmpty }
  if (!NUMBER.test(text)) return { error: MESSAGES.weightNotNumber }
  const weight = Number(text)
  if (weight < 0 || weight > WEIGHT_MAX_LB) return { error: MESSAGES.weightRange }
  if (decimalPlaces(text) > 2) return { error: MESSAGES.weightDecimals }
  return { value: weight }
}

function checkReps(raw) {
  const text = String(raw ?? '').trim()
  if (text === '') return { error: MESSAGES.repsEmpty }
  if (!NUMBER.test(text)) return { error: MESSAGES.repsNotNumber }
  const reps = Number(text)
  if (!Number.isInteger(reps)) return { error: MESSAGES.repsWhole }
  if (reps < REPS_MIN || reps > REPS_MAX) return { error: MESSAGES.repsRange }
  return { value: reps }
}

// Returns { ok: true, values: { weight_lb, reps } } or { ok: false, errors: { weight?, reps? } }.
// Both fields are always checked, so the user sees every problem at once.
export function validateSet({ weight, reps }) {
  const w = checkWeight(weight)
  const r = checkReps(reps)
  const errors = {}
  if (w.error) errors.weight = w.error
  if (r.error) errors.reps = r.error
  if (Object.keys(errors).length > 0) return { ok: false, errors }
  return { ok: true, values: { weight_lb: w.value, reps: r.value } }
}
