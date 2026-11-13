// The menu map (story 131): the groups, their rows in order, where each row goes, and which section every signed-in
// page belongs to. The sidebar and the phone menu are both built from this file, so they can never disagree.
// Unit tested in tests/menuMap.test.js.

export const MENU_GROUPS = [
  {
    name: 'Training',
    links: [
      { section: 'dashboard', label: 'Dashboard', to: '/dashboard', icon: 'home' },
      { section: 'workouts', label: 'Workouts', to: '/weekly-plan', icon: 'dumbbell' },
      { section: 'plans', label: 'Plans', to: '/plans', icon: 'plans' },
      { section: 'progress', label: 'Progress', to: '/progress', icon: 'progress' },
    ],
  },
  {
    name: 'Community',
    links: [
      { section: 'rankings', label: 'Rankings', to: '/leaderboard/weekly', icon: 'trophy' },
      { section: 'buddies', label: 'Buddies', to: '/buddies', icon: 'buddies' },
    ],
  },
]

export const PROFILE_PATH = '/profile'

// The first matching rule wins. A page inside a section keeps that section: plan details stay under Plans, a workout
// being logged (and its summary) under Workouts, workout history under Progress, the weekly goal under Dashboard.
const SECTION_RULES = [
  ['dashboard', ['/dashboard', '/weekly-goal']],
  ['workouts', ['/weekly-plan', '/workouts', '/workout', '/dev/workout-log', '/dev/workout-summary']],
  ['plans', ['/plans']],
  ['progress', ['/progress']],
  ['rankings', ['/leaderboard']],
  ['buddies', ['/buddies']],
  ['profile', ['/profile']],
]

const startsAt = (pathname, base) => pathname === base || pathname.startsWith(`${base}/`)

// The section a signed-in page belongs to, or null for pages that have no menu (login, create account, onboarding).
export function sectionFor(pathname) {
  const rule = SECTION_RULES.find(([, bases]) => bases.some((base) => startsAt(pathname, base)))
  return rule ? rule[0] : null
}

export function hasMenu(pathname) {
  return sectionFor(pathname) !== null
}

// What a row's aria-current should be on this page: "page" when the row's own page is open, "location" when a page
// inside its section is open, undefined otherwise. Both are highlighted the same way.
export function currentFor(pathname, section, to) {
  if (sectionFor(pathname) !== section) return undefined
  return pathname === to ? 'page' : 'location'
}

// "Casey Lin" -> "CL", "Casey" -> "C", nothing -> "?".
export function initialsOf(fullName) {
  const parts = String(fullName ?? '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}
