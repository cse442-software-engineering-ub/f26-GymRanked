// The text of the exercise alternatives dialog (task #82, story #80), worked out from api/exercise_alternatives.php's
// answer and the user's setup. The exact wording is in task-tests/82-exercise-alternatives-frontend.md, "Exact text".
// Levels and equipment values match database/migrations/016_exercise_alternatives.sql.
import { MUSCLE_LABELS, musclesFor } from '../exerciseMuscles.js'
import { EQUIPMENT_LABELS } from '../planEquipment.js'

const LEVEL_LABELS = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' }
const LEVEL_RANK = { beginner: 0, intermediate: 1, advanced: 2 }

const MOVEMENT_WORDS = {
  horizontal_push: 'pressing',
  squat: 'squatting',
  horizontal_pull: 'rowing',
  vertical_pull: 'pulling-down',
}

// How the equipment reads inside a reason ("Uses a barbell, which you have.").
const EQUIPMENT_ITEMS = {
  barbell: 'a barbell',
  dumbbells: 'dumbbells',
  kettlebells: 'kettlebells',
  resistance_bands: 'resistance bands',
  cable_machine: 'a cable machine',
  pullup_bar: 'a pull-up bar',
  full_gym: 'gym machines',
}

const LEVEL_STEPS = ['', 'One level', 'Two levels']

export function levelTag(level) {
  return LEVEL_LABELS[level] ?? level
}

export function equipmentTag(equipment) {
  if (equipment === 'bodyweight') return 'No equipment'
  if (equipment === 'full_gym') return 'Gym machine'
  return EQUIPMENT_LABELS[equipment] ?? equipment
}

// "Intermediate · Barbell" for the exercise being done.
export function exerciseLine(level, equipment) {
  return `${levelTag(level)} · ${equipmentTag(equipment)}`
}

export function muscleText(exercise) {
  return musclesFor(exercise).map((muscle) => MUSCLE_LABELS[muscle]).join(' · ')
}

export function movementWord(movement) {
  return MOVEMENT_WORDS[movement] ?? movement.replace(/_/g, ' ')
}

function experienceLabel(experience) {
  return LEVEL_LABELS[experience] ?? 'Not saved'
}

function equipmentLabels(equipment) {
  if (equipment.length === 0) return 'No equipment saved'
  return equipment.map((item) => EQUIPMENT_LABELS[item] ?? item).join(', ')
}

// you = { experience, equipment }, from the response's "you" or from api/setup.php.
export function setupLine(you) {
  return `Your setup: ${experienceLabel(you.experience)} · ${equipmentLabels(you.equipment)}`
}

export function countText(count) {
  return count === 1 ? '1 alternative' : `${count} alternatives`
}

export function introText(movement) {
  return `These work the same ${movementWord(movement)} movement with equipment you have, at your level or easier. Closest in difficulty first.`
}

// Leave sourceLevel null when #81 doesn't send the exercise's level; the reason is then only the equipment part.
export function reasonText({ source, sourceLevel, alternative, you }) {
  const parts = []
  if (sourceLevel) {
    const difference = LEVEL_RANK[alternative.level] - LEVEL_RANK[sourceLevel]
    if (difference === 0) parts.push(`Same difficulty as ${source}.`)
    else if (difference < 0) parts.push(`${LEVEL_STEPS[-difference]} easier than ${source}.`)
    else parts.push(`${LEVEL_STEPS[difference]} harder than ${source}, within your level.`)
  }
  const item = EQUIPMENT_ITEMS[alternative.equipment] ?? alternative.equipment
  if (alternative.equipment === 'bodyweight') parts.push('Needs no equipment.')
  else if (you.equipment.includes(alternative.equipment)) parts.push(`Uses ${item}, which you have.`)
  else parts.push(`Uses ${item}, which your full gym access covers.`)
  return parts.join(' ')
}

export const NO_MATCH_TITLE = 'No alternative fits your setup'

export function noMatchText({ exercise, movement, you }) {
  return `None of the other ${movementWord(movement)} exercises we list fit your equipment (${equipmentLabels(you.equipment)}) and experience (${experienceLabel(you.experience)}). Keep doing ${exercise}, or add equipment you have in your training preferences.`
}

export function notCoveredTitle(exercise) {
  return `No alternatives listed for ${exercise} yet`
}

export function notCoveredText(exercise) {
  return `Alternatives cover pressing, squatting, rowing and pulling-down exercises so far. Keep doing ${exercise} as planned.`
}
