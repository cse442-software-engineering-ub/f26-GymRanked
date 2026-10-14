import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { MUSCLE_LABELS, musclesFor } from '../src/exerciseMuscles.js'

const seed = readFileSync(new URL('../database/migrations/007_plan_day_exercises.sql', import.meta.url), 'utf8')
const seeded = [...new Set([...seed.matchAll(/JSON_ARRAY\(([^)]*)\)/g)].flatMap((m) => [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1])))]

test('every seeded exercise has muscles to highlight', () => {
  assert.ok(seeded.length > 40)
  assert.deepEqual(seeded.filter((name) => musclesFor(name).length === 0), [])
})

test('every muscle used has a label', () => {
  for (const name of seeded) for (const muscle of musclesFor(name)) assert.ok(MUSCLE_LABELS[muscle], `${name}: ${muscle}`)
})

test('lookup ignores case and unknown exercises highlight nothing', () => {
  assert.deepEqual(musclesFor('Bench press'), ['chest', 'shoulders', 'triceps'])
  assert.deepEqual(musclesFor('Made-up move'), [])
})
