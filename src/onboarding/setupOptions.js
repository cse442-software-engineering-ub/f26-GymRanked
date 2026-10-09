// Experience levels and equipment for the onboarding experience (#/experience) and equipment (#/equipment) pages.

export const LEVELS = [
  { value: 'beginner', label: 'Beginner', description: 'New to structured training, or under 6 months in.' },
  { value: 'intermediate', label: 'Intermediate', description: 'Consistent training for 6 months to 3 years.' },
  { value: 'advanced', label: 'Advanced', description: '3+ years training, comfortable pushing intensity.' },
];

// Same values and order as api/setup.php and database/migrations/002_user_setup.sql.
export const EQUIPMENT = [
  { value: 'bodyweight', label: 'Bodyweight only' },
  { value: 'dumbbells', label: 'Dumbbells' },
  { value: 'barbell', label: 'Barbell' },
  { value: 'kettlebells', label: 'Kettlebells' },
  { value: 'resistance_bands', label: 'Resistance bands' },
  { value: 'cable_machine', label: 'Cable machine' },
  { value: 'pullup_bar', label: 'Pull-up bar' },
  { value: 'full_gym', label: 'Full gym access' },
];

// "Bodyweight only" can't be combined with equipment, so picking one clears the other.
export function toggleEquipment(current, value) {
  if (current.includes(value)) return current.filter((item) => item !== value);
  if (value === 'bodyweight') return ['bodyweight'];
  return [...current.filter((item) => item !== 'bodyweight'), value];
}

function joinWithAnd(items) {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

export function planImpact(experience, equipment) {
  const level = LEVELS.find((option) => option.value === experience);
  if (!level || equipment.length === 0) {
    return 'Pick your experience and at least one equipment option to see how your plan will be built.';
  }
  const items = EQUIPMENT.filter((option) => equipment.includes(option.value)).map((option) =>
    option.label.toLowerCase(),
  );
  return `${level.label} programming using ${joinWithAnd(items)}.`;
}
