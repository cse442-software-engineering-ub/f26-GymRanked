import { apiRequest } from '../onboarding/api.js'

// api/weekly_goal.php (Surya's #89). Both resolve to { ok, status, data } and never throw; data is the full goal
// (the same body for GET and a successful POST), so the page can show the saved result without asking again.

export function getWeeklyGoal() {
  return apiRequest('weekly_goal.php')
}

// week is "current" or "next"; target_days is a whole number from 1 to 7.
export function saveWeeklyGoal(week, targetDays) {
  return apiRequest('weekly_goal.php', {
    method: 'POST',
    body: JSON.stringify({ week, target_days: targetDays }),
  })
}
