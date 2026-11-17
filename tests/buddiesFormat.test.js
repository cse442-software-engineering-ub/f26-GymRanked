import test from 'node:test'
import assert from 'node:assert/strict'
import {
  MESSAGE_MAX,
  NAME_MAX,
  cleanInviteCode,
  countChars,
  fitsLimit,
  formatExpiry,
  formatSentAt,
  initialsOf,
  isExpired,
  isInviteCode,
  memberCountLabel,
} from '../src/buddies/buddiesFormat.js'

test('invite code clean-up: capitals, no spaces, 8 characters at most', () => {
  assert.equal(cleanInviteCode('7kq2mxp9'), '7KQ2MXP9')
  assert.equal(cleanInviteCode(' 7kq2 mxp9 '), '7KQ2MXP9')
  assert.equal(cleanInviteCode('7KQ2MXP9EXTRA'), '7KQ2MXP9')
  assert.equal(cleanInviteCode(''), '')
})

test('invite code check uses the same rule as the backend', () => {
  assert.equal(isInviteCode('7KQ2MXP9'), true)
  assert.equal(isInviteCode('ZZZZZZZZ'), true)
  assert.equal(isInviteCode('7KQ2'), false)
  assert.equal(isInviteCode(''), false)
  assert.equal(isInviteCode('7kq2mxp9'), false)
  assert.equal(isInviteCode('7KQ2MXPO'), false) // the letter O is not used
  assert.equal(isInviteCode('7KQ2MXP1'), false) // the digit 1 is not used
})

test('the 140-character count treats an emoji as one character', () => {
  assert.equal(countChars('Great session today, keep it up!'), 32)
  assert.equal(countChars('💪'), 1)
  assert.equal(countChars('a'.repeat(139) + '💪'), 140)
  assert.equal(countChars('1234567890'.repeat(14) + 'A'), 141)
  assert.equal(countChars('a'.repeat(139) + '💪💪'), 141)
})

test('empty, blank and too long text is refused', () => {
  assert.equal(fitsLimit('', MESSAGE_MAX), false)
  assert.equal(fitsLimit('   ', MESSAGE_MAX), false)
  assert.equal(fitsLimit('Keep going!', MESSAGE_MAX), true)
  assert.equal(fitsLimit('a'.repeat(140), MESSAGE_MAX), true)
  assert.equal(fitsLimit('a'.repeat(141), MESSAGE_MAX), false)
  assert.equal(fitsLimit('a'.repeat(139) + '💪', MESSAGE_MAX), true)
  assert.equal(fitsLimit('a'.repeat(139) + '💪💪', MESSAGE_MAX), false)
  // Spaces around the text are not counted, the same as the backend's trim.
  assert.equal(fitsLimit('  ' + 'a'.repeat(140) + '  ', MESSAGE_MAX), true)
  assert.equal(fitsLimit("Cal's Crew", NAME_MAX), true)
  assert.equal(fitsLimit('a'.repeat(41), NAME_MAX), false)
})

test('member count wording and initials', () => {
  assert.equal(memberCountLabel(1), '1 member')
  assert.equal(memberCountLabel(3), '3 members')
  assert.equal(initialsOf('Olivia G.'), 'OG')
  assert.equal(initialsOf('Ben C.'), 'BC')
})

test('times are shown in New York time', () => {
  assert.equal(formatSentAt('2026-11-13T15:04:05Z'), 'Nov 13, 10:04 AM')
  assert.equal(formatExpiry('2026-11-18T15:00:00Z'), 'Nov 18, 2026, 10:00 AM')
  // Summer time: New York is 4 hours behind UTC.
  assert.equal(formatSentAt('2026-07-01T16:30:00Z'), 'Jul 1, 12:30 PM')
})

test('an invite code is expired from its expiry time on', () => {
  const now = Date.parse('2026-11-13T15:00:00Z')
  assert.equal(isExpired('2026-11-12T15:00:00Z', now), true)
  assert.equal(isExpired('2026-11-13T15:00:00Z', now), true)
  assert.equal(isExpired('2026-11-20T15:00:00Z', now), false)
})
