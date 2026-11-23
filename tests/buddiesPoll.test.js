import test from 'node:test'
import assert from 'node:assert/strict'
import { MAX_BACKOFF_MS, POLL_MS, announceFresh, mergeGroupView, nextDelay } from '../src/buddies/buddiesPoll.js'

const message = (id, from = 'Ben C.', text = `Message ${id}`) => ({ id, from, message: text, sent_at: '2026-11-19T15:00:00Z' })
const view = (memberId, encouragements, groupName = 'Morning Lifters') => ({
  group: { name: groupName, member_count: 2, invite_code: null, members: [{ member_id: memberId, name: 'Olivia G.', is_me: true, is_owner: false }] },
  me: { member_id: memberId, is_owner: false },
  encouragements,
})

test('waits 10 seconds normally and backs off to at most a minute after failures', () => {
  assert.equal(nextDelay(0), POLL_MS)
  assert.equal(nextDelay(1), 20000)
  assert.equal(nextDelay(2), 40000)
  assert.equal(nextDelay(3), MAX_BACKOFF_MS)
  assert.equal(nextDelay(10), MAX_BACKOFF_MS)
})

test('the first answer is shown as it is, with nothing marked new', () => {
  const result = mergeGroupView(null, view(7, [message(2), message(1)]))
  assert.equal(result.changed, true)
  assert.deepEqual(result.fresh, [])
  assert.deepEqual(result.view.encouragements.map((item) => item.id), [2, 1])
})

test('an answer that changes nothing returns the same object, so nothing is redrawn', () => {
  const first = mergeGroupView(null, view(7, [message(2), message(1)])).view
  const again = mergeGroupView(first, view(7, [message(2), message(1)]))
  assert.equal(again.changed, false)
  assert.equal(again.view, first)
})

test('a new message is added once and marked new', () => {
  const first = mergeGroupView(null, view(7, [message(1)])).view
  const next = mergeGroupView(first, view(7, [message(2), message(1)]))
  assert.equal(next.changed, true)
  assert.deepEqual(next.fresh, [2])
  assert.deepEqual(next.view.encouragements.map((item) => item.id), [2, 1])
})

test('a message repeated in one answer, or in the next answer, shows once', () => {
  const first = mergeGroupView(null, view(7, [message(2), message(2), message(1)])).view
  assert.deepEqual(first.encouragements.map((item) => item.id), [2, 1])
  const next = mergeGroupView(first, view(7, [message(2), message(1)]))
  assert.equal(next.changed, false)
  assert.deepEqual(next.fresh, [])
})

test('an answer for another account replaces everything and marks nothing new', () => {
  const olivia = mergeGroupView(null, view(7, [message(1, 'Ben C.')])).view
  const pete = mergeGroupView(olivia, view(9, [message(5, 'Ana R.')], 'Late Starters'))
  assert.equal(pete.changed, true)
  assert.deepEqual(pete.fresh, [])
  assert.deepEqual(pete.view.encouragements.map((item) => item.id), [5])
  assert.equal(pete.view.group.name, 'Late Starters')
})

test('leaving a group (no group, no member id) is shown at once', () => {
  const inGroup = mergeGroupView(null, view(7, [message(1)])).view
  const left = mergeGroupView(inGroup, { group: null, me: null, encouragements: [] })
  assert.equal(left.changed, true)
  assert.equal(left.view.group, null)
  assert.deepEqual(left.view.encouragements, [])
})

test('a new member changes the view but marks no message new', () => {
  const first = mergeGroupView(null, view(7, [message(1)])).view
  const bigger = view(7, [message(1)])
  bigger.group.member_count = 3
  const next = mergeGroupView(first, bigger)
  assert.equal(next.changed, true)
  assert.deepEqual(next.fresh, [])
})

test('an older message coming back into the newest 20 is not marked new', () => {
  const first = mergeGroupView(null, view(7, [message(30), message(29)])).view
  const next = mergeGroupView(first, view(7, [message(30), message(29), message(10)]))
  assert.deepEqual(next.fresh, [])
})

test('screen readers hear who sent a new message and what it says', () => {
  const next = view(7, [message(3, 'Ben C.', 'Great squats!'), message(2), message(1)])
  assert.equal(announceFresh(next, [3]), 'New encouragement from Ben C.: Great squats!')
  assert.equal(announceFresh(next, [3, 2]), '2 new encouragements')
  assert.equal(announceFresh(next, []), '')
})
