export const GENDERS = [
  { value: 'woman', label: 'Woman' },
  { value: 'man', label: 'Man' },
  { value: 'nonbinary', label: 'Nonbinary' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
]

export function validatePersonalDetails(weight, gender) {
  const errors = {}
  const value = Number(weight)
  if (!String(weight).trim()) errors.bodyweight_lb = 'Enter your body weight.'
  else if (Number.isFinite(value) && value <= 0) errors.bodyweight_lb = 'Enter a body weight greater than 0 lb.'
  else if (!Number.isFinite(value) || value < 50 || value > 700) errors.bodyweight_lb = 'Enter a body weight from 50 to 700 lb.'
  else if (!/^\d+(\.\d)?$/.test(String(weight).trim())) errors.bodyweight_lb = 'Use at most one decimal place.'
  if (!GENDERS.some((option) => option.value === gender)) errors.gender = 'Choose a gender.'
  return errors
}
