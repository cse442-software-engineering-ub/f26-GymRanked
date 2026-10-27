// Display text for the Leaderboard page (story #10, card 120), kept apart from the components so it can be unit tested.
// The numbers come from api/leaderboard.php (Mansur's backend, card 121), which already rounds them; this file only
// formats them and decides which kind of "your standing" card to show.

export const BOARDS = [
  { key: 'overall', label: 'Overall', lift: null },
  { key: 'bench', label: 'Bench press', lift: 'bench press' },
  { key: 'squat', label: 'Back squat', lift: 'back squat' },
  { key: 'deadlift', label: 'Deadlift', lift: 'deadlift' },
]

const LIFTS = BOARDS.slice(1)

// An unknown or missing board opens Overall.
export const boardByKey = (key) => BOARDS.find((board) => board.key === key) ?? BOARDS[0]

export const NO_VALUE = '—'

const pounds = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 })

// 243.6 -> "243.60": scores always show two decimals, so equal-looking scores are equal (they share a rank).
export const formatScore = (score) => Number(score).toFixed(2)

// 202 -> "202 lb"; 180.5 -> "180.5 lb"
export const formatPounds = (lb) => (lb == null ? NO_VALUE : `${pounds.format(lb)} lb`)

// "#15 of 38 on Overall"
export function rankLine(rank, rankedCount, board) {
  return `#${rank} of ${rankedCount} on ${boardByKey(board).label}`
}

// "38 people ranked on Overall"
export function rankedCountLine(count, board) {
  return `${count} ${count === 1 ? 'person' : 'people'} ranked on ${boardByKey(board).label}`
}

export function emptyBoardText(board) {
  return `Nobody is ranked on ${boardByKey(board).label} yet.`
}

// DOTS only has a men's and a women's table, so these accounts choose which one scores them.
export const choosesTable = (gender) => gender === 'nonbinary' || gender === 'prefer_not_to_say'

// "Scored with the women's table"
export function tableLine(table) {
  return `Scored with the ${table === 'men' ? "men's" : "women's"} table`
}

// "Bench press 202 lb · Back squat 284 lb · Deadlift —"
export function liftsLine(lifts) {
  return LIFTS.map(({ key, label }) => `${label} ${formatPounds(lifts?.[key])}`).join(' · ')
}

// "1 of 3 workouts finished"; more than the 3 needed still reads "3 of 3".
export function workoutsText(done, needed) {
  return `${Math.min(done, needed)} of ${needed} workouts finished`
}

function listWithAnd(items) {
  return items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}

// The four "How to get ranked" steps, in order, with whether each is done.
export function rankSteps(me) {
  const needsTable = choosesTable(me.gender) && !me.scoring_table
  return [
    { key: 'join', done: Boolean(me.joined) && !needsTable },
    { key: 'details', done: me.bodyweight_lb != null && me.gender != null },
    { key: 'workouts', done: me.workouts_done >= me.workouts_needed },
    { key: 'lift', done: LIFTS.some(({ key }) => me.lifts?.[key] != null) },
  ]
}

// Which card to show: a test account, ranked on this board, every step done but not on this board, or the steps.
export function standingKind(me) {
  if (me.reason === 'test_account') return 'test'
  if (me.ranked) return 'ranked'
  return rankSteps(me).every((step) => step.done) ? 'not-on-board' : 'steps'
}

// What someone who has done every step still needs for this board.
export function notOnBoardText(me, board) {
  const { key, label, lift } = boardByKey(board)
  if (key !== 'overall') return `Log a ${lift} to get on the ${label} board.`
  const missing = LIFTS.filter(({ key: liftKey }) => me.lifts?.[liftKey] == null).map((item) => `a ${item.lift}`)
  return `Overall needs all three lifts. Log ${listWithAnd(missing)} to get on it.`
}
