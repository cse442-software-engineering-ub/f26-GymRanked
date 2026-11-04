// Requests for the Leaderboard page (story #10, card 120), against Mansur's api/leaderboard.php (card 121):
//   GET    api/leaderboard.php?board=overall|bench|squat|deadlift -> {board, ranked_count, workouts_needed, rows, me}
//   POST   api/leaderboard.php {"join": true, "scoring_table"?: "men"|"women"} -> join, or change the scoring table
//   DELETE api/leaderboard.php -> leave (workouts, body weight and the scoring table are kept)
// rows: [{rank, name ("Ana C."), score (DOTS, 2 decimals), lift, is_me, gap_before}], the top 10 plus anyone tied
// with 10th, then you and one person either side. me: {ranked, rank, score, joined, bodyweight_lb, gender,
// scoring_table, lifts {bench, squat, deadlift} (e1RM lb or null), workouts_done, reason (null when ranked)}.
// Every function resolves to apiRequest's {ok, status, data}; it never throws.
import { apiRequest } from '../onboarding/api.js'

export function getLeaderboard(board) {
  return apiRequest(`leaderboard.php?board=${encodeURIComponent(board)}`)
}

export function joinLeaderboard(scoringTable) {
  const body = scoringTable ? { join: true, scoring_table: scoringTable } : { join: true }
  return apiRequest('leaderboard.php', { method: 'POST', body: JSON.stringify(body) })
}

export function leaveLeaderboard() {
  return apiRequest('leaderboard.php', { method: 'DELETE' })
}
