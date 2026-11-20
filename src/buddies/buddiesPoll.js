// Pure helpers for the encouragement poller (useBuddyGroupPoll.js). No React, no fetch, so tests/buddiesPoll.test.js
// can check them with plain node.

// How often an open Dashboard or Buddies page asks Mansur's api/buddy_group.php (card #71) for news.
export const POLL_MS = 10000
// After failed requests the wait doubles (20s, 40s), never more than a minute, until one works again.
export const MAX_BACKOFF_MS = 60000

export function nextDelay(failures, interval = POLL_MS) {
  if (failures <= 0) return interval
  return Math.min(interval * 2 ** failures, MAX_BACKOFF_MS)
}

// The parts of the group view that change what the page shows, as one string.
function groupSignature(view) {
  return JSON.stringify([view?.group ?? null, view?.me ?? null])
}

function accountOf(view) {
  return view?.me?.member_id ?? null
}

// Combines the view on screen with a fresh answer from the server.
// - The server's list is the truth (newest first, its 20 newest), with any repeated id kept once.
// - When nothing changed, the same object comes back (changed: false), so React redraws nothing and whatever the
//   lifter is typing is left alone.
// - fresh lists the ids that arrived since the last answer, for the "New" mark and the screen reader announcement.
//   Nothing is fresh on the first answer, or when the answer is for another account or another group: that view
//   replaces the old one completely, so nothing from the previous account stays on screen.
export function mergeGroupView(previous, next) {
  const seen = new Set()
  const encouragements = (next?.encouragements ?? []).filter((item) => {
    if (seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
  const view = { ...next, encouragements }

  const sameAccount = previous != null && accountOf(previous) === accountOf(next) && accountOf(next) !== null
    && previous.group?.name === next?.group?.name
  if (!sameAccount) return { view, changed: true, fresh: [] }

  const before = previous.encouragements ?? []
  const sameList = before.length === encouragements.length && before.every((item, index) => item.id === encouragements[index].id)
  if (sameList && groupSignature(previous) === groupSignature(view)) return { view: previous, changed: false, fresh: [] }

  const known = new Set(before.map((item) => item.id))
  const newestKnown = before.length ? Math.max(...before.map((item) => item.id)) : -Infinity
  const fresh = encouragements.filter((item) => !known.has(item.id) && item.id > newestKnown).map((item) => item.id)
  return { view, changed: true, fresh }
}

// What a screen reader hears when new encouragement arrives.
export function announceFresh(view, fresh) {
  if (!fresh.length) return ''
  const items = view.encouragements.filter((item) => fresh.includes(item.id))
  if (items.length === 1) return `New encouragement from ${items[0].from}: ${items[0].message}`
  return `${items.length} new encouragements`
}
