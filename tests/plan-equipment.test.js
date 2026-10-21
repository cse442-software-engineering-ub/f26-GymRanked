import test from 'node:test'
import assert from 'node:assert/strict'
import { missingEquipment, orderByRecommendation, recommendPlans } from '../src/planEquipment.js'

const plans = [
  { id: 1, name: 'PPL', level: 'intermediate', goals: ['strength'], required_equipment: ['barbell', 'cable_machine'] },
  { id: 2, name: 'Basics', level: 'beginner', goals: ['strength', 'fat_loss'], required_equipment: [] },
  { id: 3, name: 'Peak', level: 'advanced', goals: ['strength'], required_equipment: ['barbell'] },
  { id: 4, name: 'Barbell basics', level: 'beginner', goals: ['strength'], required_equipment: ['barbell'] },
]

test('missingEquipment lists only what the user lacks', () => {
  assert.deepEqual(missingEquipment(plans[0], ['barbell']), ['cable_machine'])
  assert.deepEqual(missingEquipment(plans[1], ['bodyweight']), [])
})

test('full gym access covers every requirement', () => {
  assert.deepEqual(missingEquipment(plans[0], ['full_gym']), [])
})

test('recommendations match goal, level and equipment', () => {
  const result = recommendPlans(plans, { goal: 'strength', experience: 'intermediate', equipment: ['barbell'] })
  assert.deepEqual(result.map((p) => p.id), [2, 4]) // 3 is advanced; 1 needs a cable machine so it is left out
  assert.deepEqual(result.map((p) => p.missing_equipment), [[], []])
})

test('the closest level to the user comes first', () => {
  const result = recommendPlans(plans, { goal: 'strength', experience: 'intermediate', equipment: ['full_gym'] })
  assert.deepEqual(result.map((p) => p.id), [1, 2, 4])
})

test('a different goal filters plans out', () => {
  const result = recommendPlans(plans, { goal: 'fat_loss', experience: 'beginner', equipment: ['bodyweight'] })
  assert.deepEqual(result.map((p) => p.id), [2])
})

test('the library lists recommended plans first, then the rest once, in API order', () => {
  const { recommended, others } = orderByRecommendation(plans, { goal: 'strength', experience: 'intermediate', equipment: ['barbell'] })
  assert.deepEqual(recommended.map((p) => p.id), [2, 4])
  assert.deepEqual(others.map((p) => p.id), [1, 3]) // plans needing other equipment follow, still marked
})

test('changed settings change the library order', () => {
  const { recommended, others } = orderByRecommendation(plans, { goal: 'fat_loss', experience: 'beginner', equipment: ['bodyweight'] })
  assert.deepEqual(recommended.map((p) => p.id), [2])
  assert.deepEqual(others.map((p) => p.id), [1, 3, 4])
})

test('without a saved setup the library keeps its normal order', () => {
  const { recommended, others } = orderByRecommendation(plans, null)
  assert.deepEqual(recommended, [])
  assert.deepEqual(others.map((p) => p.id), [1, 2, 3, 4])
})

test('no matching plans (or no matching equipment) leaves every plan in the normal order', () => {
  const { recommended, others } = orderByRecommendation(plans, { goal: 'aerobic', experience: 'beginner', equipment: ['bodyweight'] })
  assert.deepEqual(recommended, [])
  assert.deepEqual(others.map((p) => p.id), [1, 2, 3, 4])
})

test('plans needing equipment the user lacks are not recommended', () => {
  const { recommended, others } = orderByRecommendation(plans, { goal: 'strength', experience: 'beginner', equipment: ['bodyweight'] })
  assert.deepEqual(recommended.map((p) => p.id), [2])
  assert.deepEqual(others.map((p) => p.id), [1, 3, 4])
})
