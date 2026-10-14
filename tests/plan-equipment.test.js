import test from 'node:test'
import assert from 'node:assert/strict'
import { missingEquipment, recommendPlans } from '../src/planEquipment.js'

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

test('recommendations match goal, cap the level, and put fully equipped plans first', () => {
  const result = recommendPlans(plans, { goal: 'strength', experience: 'intermediate', equipment: ['barbell'] })
  assert.deepEqual(result.map((p) => p.id), [2, 4, 1]) // 3 is advanced; 1 needs a cable machine so it is last
  assert.deepEqual(result[2].missing_equipment, ['cable_machine'])
})

test('a different goal filters plans out', () => {
  const result = recommendPlans(plans, { goal: 'fat_loss', experience: 'beginner', equipment: ['bodyweight'] })
  assert.deepEqual(result.map((p) => p.id), [2])
})
