// Requests for the Weekly consistency view, against Mansur's api/weekly_standings.php:
//   GET    api/weekly_standings.php -> {time_zone, week_start, week_end, resets_at, now, target_days, member_count, rows, me}
//   POST   api/weekly_standings.php {"join": true} -> the same body, after joining
//   DELETE api/weekly_standings.php -> the same body, after leaving (workouts are kept)
// rows: [{rank, name ("Maya R."), progress_days (capped at the goal), progress_percent, is_me, gap_before}], the people
// with the same goal this week. me: {joined, ranked, reason (null, "not_joined", "practice_week" or "test_account"),
// ranked_from (the Monday your ranked weeks start, during the practice week), rank, completed_count, progress_days,
// progress_percent, goal_reached}.
// Every function resolves to apiRequest's {ok, status, data}; it never throws.
import { apiRequest } from '../onboarding/api.js'

// scope 'buddies' ranks only your workout buddies group; the default is everyone.
// The only way the app requests weekly_standings.php's GET: the Dashboard and the Rankings page both call this, so they get identical URLs.
export function getWeeklyStandings(scope = 'everyone') {
  return apiRequest(scope === 'buddies' ? 'weekly_standings.php?scope=buddies' : 'weekly_standings.php')
}

export function joinWeeklyCompetition() {
  return apiRequest('weekly_standings.php', { method: 'POST', body: JSON.stringify({ join: true }) })
}

export function leaveWeeklyCompetition() {
  return apiRequest('weekly_standings.php', { method: 'DELETE' })
}
