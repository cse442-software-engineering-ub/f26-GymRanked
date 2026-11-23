// Who the two Rankings boards compare you with (story #131, card 139): Everyone, or the members of your own workout
// buddies group (Mansur's ?scope=buddies on api/leaderboard.php and api/weekly_standings.php, card 138). The choice
// lives in the address (#/leaderboard?board=bench&scope=buddies, #/leaderboard/weekly?scope=buddies), so a refresh,
// Back and a link from another page all keep it. Everyone is the default and leaves no scope in the address, so the
// public boards keep the addresses they had before.

export const SCOPES = [
  { key: 'everyone', label: 'Everyone' },
  { key: 'buddies', label: 'Buddies' },
]

// Anything but "buddies" (missing, misspelled, an old link) is Everyone.
export const scopeFrom = (value) => (value === 'buddies' ? 'buddies' : 'everyone')

// The search params for a board address: board first (when given), then scope=buddies (never scope=everyone).
export function rankingParams({ board, scope } = {}) {
  const params = {}
  if (board) params.board = board
  if (scopeFrom(scope) === 'buddies') params.scope = 'buddies'
  return params
}

// "/leaderboard?board=bench&scope=buddies", "/leaderboard/weekly?scope=buddies", "/leaderboard"
export function rankingHref(path, options) {
  const query = new URLSearchParams(rankingParams(options)).toString()
  return query ? `${path}?${query}` : path
}

// "13 members", "1 member"
export const membersText = (count) => `${count} ${count === 1 ? 'member' : 'members'}`

// "13 members · Group ranks for Bench press"
export const strengthGroupLine = (memberCount, boardLabel) => `${membersText(memberCount)} · Group ranks for ${boardLabel}`

// "13 members · Group ranks by weekly goal"
export const weeklyGroupLine = (memberCount) => `${membersText(memberCount)} · Group ranks by weekly goal`

// "3-day goal"
export const goalLabel = (targetDays) => `${targetDays}-day goal`

// The weekly goal tables with your own goal first, then the others from the smallest goal up.
export function orderGoals(goals, myTarget) {
  return [...goals].sort((a, b) => (b.target_days === myTarget) - (a.target_days === myTarget) || a.target_days - b.target_days)
}

// "Nobody in Northside Crew is ranked on Bench press yet."
export const emptyGroupBoardText = (groupName, boardLabel) => `Nobody in ${groupName} is ranked on ${boardLabel} yet.`

// "Nobody in Northside Crew is ranked this week yet."
export const emptyGroupWeekText = (groupName) => `Nobody in ${groupName} is ranked this week yet.`
