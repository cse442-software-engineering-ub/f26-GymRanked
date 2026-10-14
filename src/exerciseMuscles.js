// Which muscles each exercise works, for the body figures on the plan details page.
// Names match the exercises seeded in database/migrations/007_plan_day_exercises.sql
// (tests/exercise-muscles.test.js fails if a seeded exercise is missing here).

export const MUSCLE_LABELS = {
  chest: 'Chest',
  shoulders: 'Shoulders',
  biceps: 'Biceps',
  triceps: 'Triceps',
  abs: 'Core',
  quads: 'Quads',
  back: 'Back',
  lower_back: 'Lower back',
  glutes: 'Glutes',
  hamstrings: 'Hamstrings',
  calves: 'Calves',
}

const SQUAT = ['quads', 'glutes']
const HINGE = ['hamstrings', 'glutes', 'lower_back']
const PRESS = ['chest', 'shoulders', 'triceps']
const PULL = ['back', 'biceps']
const SPRINT = ['quads', 'hamstrings', 'calves']

const EXERCISE_MUSCLES = {
  'bench press': PRESS,
  'competition bench press': PRESS,
  'incline dumbbell press': PRESS,
  'dumbbell press': PRESS,
  'push-up': PRESS,
  'incline push-up': PRESS,
  'close-grip bench press': ['triceps', 'chest'],
  'bench dip': ['triceps', 'shoulders', 'chest'],
  'overhead press': ['shoulders', 'triceps'],
  'pike push-up': ['shoulders', 'triceps'],
  'lateral raise': ['shoulders'],
  'shoulder mobility': ['shoulders'],
  'medicine ball throw': ['shoulders', 'chest', 'abs'],
  'triceps pushdown': ['triceps'],
  'triceps extension': ['triceps'],
  'dumbbell curl': ['biceps'],
  'barbell row': PULL,
  'lat pulldown': PULL,
  'seated cable row': PULL,
  'cable row': PULL,
  'dumbbell row': PULL,
  'inverted row': PULL,
  'pull-up': PULL,
  'back squat': SQUAT,
  'competition squat': SQUAT,
  'paused squat': SQUAT,
  'goblet squat': SQUAT,
  'bodyweight squat': SQUAT,
  'split squat': SQUAT,
  'bulgarian split squat': SQUAT,
  'walking lunge': SQUAT,
  'reverse lunge': SQUAT,
  'step-up': SQUAT,
  'leg press': SQUAT,
  'box jump': ['quads', 'glutes', 'calves'],
  'broad jump': ['quads', 'glutes', 'hamstrings'],
  'romanian deadlift': HINGE,
  'single-leg romanian deadlift': HINGE,
  'hip hinge': HINGE,
  deadlift: [...HINGE, 'back'],
  'competition deadlift': [...HINGE, 'back'],
  'paused deadlift': [...HINGE, 'back'],
  'back extension': ['lower_back', 'glutes'],
  'superman hold': ['lower_back', 'glutes'],
  'bird dog': ['lower_back', 'glutes'],
  'leg curl': ['hamstrings'],
  'glute bridge': ['glutes', 'hamstrings'],
  'barbell hip thrust': ['glutes', 'hamstrings'],
  'cable kickback': ['glutes'],
  'hip mobility': ['glutes'],
  'sprint drill': SPRINT,
  'acceleration sprint': SPRINT,
  'a-skip': ['quads', 'calves'],
  'easy walk': ['quads', 'calves'],
  'calf raise': ['calves'],
  plank: ['abs'],
  'side plank': ['abs'],
  'dead bug': ['abs'],
  'hanging leg raise': ['abs'],
}

// Muscle keys for an exercise name, or [] if we don't have it (the figure then shows no highlight).
export function musclesFor(exercise) {
  return EXERCISE_MUSCLES[exercise.trim().toLowerCase()] ?? []
}
