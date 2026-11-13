// Text, limits and checks for the Workout buddies page (story #78, card #79). The limits and wordings are the ones
// Mansur's backend (card #71, api/buddy_common.php) uses, so the page refuses the same input before any request.
// Unit tested in tests/buddiesFormat.test.js.

export const CODE_LENGTH = 8
export const NAME_MAX = 40
export const MESSAGE_MAX = 140

// 8 capital letters or digits, without I, O, 0 and 1 (easy to read aloud). Same rule as #71.
const CODE_PATTERN = /^[A-HJ-NP-Z2-9]{8}$/

export const MESSAGES = {
  code: 'Enter the 8-character invite code.',
  already: 'You are already in a workout buddies group.',
  name: 'Name your group in 1 to 40 characters.',
  message: 'Write a message of 1 to 140 characters.',
  load: "Couldn't load your workout buddies. Check your connection and try again.",
  join: "Couldn't join the group. Check your connection and try again.",
  create: "Couldn't create the group. Check your connection and try again.",
  send: "Couldn't send your encouragement. Check your connection and try again.",
}

// What the invite code box shows for what was typed or pasted: capitals, no spaces, at most 8 characters.
export function cleanInviteCode(value) {
  return String(value).toUpperCase().replace(/\s+/g, '').slice(0, CODE_LENGTH)
}

export function isInviteCode(value) {
  return CODE_PATTERN.test(value)
}

// Characters as a person counts them: an emoji is one, the same count PHP's mb_strlen gives #71.
export function countChars(value) {
  return [...String(value)].length
}

// The first `max` characters, never cutting an emoji in half.
export function clipChars(value, max) {
  const chars = [...String(value)]
  return chars.length > max ? chars.slice(0, max).join('') : String(value)
}

// True when the trimmed text has between 1 and `max` characters.
export function fitsLimit(value, max) {
  const count = countChars(String(value).trim())
  return count >= 1 && count <= max
}

export function memberCountLabel(count) {
  return `${count} ${count === 1 ? 'member' : 'members'}`
}

// "Olivia G." -> "OG" for the circle beside a name.
export function initialsOf(name) {
  return String(name).split(/\s+/).filter(Boolean).map((part) => part[0].toUpperCase()).join('').slice(0, 2)
}

const NEW_YORK = 'America/New_York'

// "Nov 13, 10:04 AM": when a message was sent, in New York time like the rest of the app.
export function formatSentAt(iso) {
  return new Date(iso).toLocaleString('en-US', {
    timeZone: NEW_YORK, month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

// "Nov 18, 2026, 10:00 AM": when an invite code stops working.
export function formatExpiry(iso) {
  return new Date(iso).toLocaleString('en-US', {
    timeZone: NEW_YORK, month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

export function isExpired(iso, now = Date.now()) {
  return new Date(iso).getTime() <= now
}
