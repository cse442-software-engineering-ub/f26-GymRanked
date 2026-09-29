const API_BASE = `${import.meta.env.BASE_URL}api`

// Rejects on a network failure, a non-JSON body, or a non-2xx status so pages can show their error state.
// The rejected Error carries the HTTP `status` (e.g. 401 when the user isn't logged in).
async function getJson(url, options) {
  const res = await fetch(url, { credentials: 'same-origin', ...options })
  const body = await res.json().catch(() => null)
  if (!res.ok || body === null) {
    const error = new Error(body?.error || `HTTP ${res.status}`)
    error.status = res.status
    throw error
  }
  return body
}

export function fetchPlans() {
  return getJson(`${API_BASE}/plans.php`)
}

export function fetchPlan(id) {
  return getJson(`${API_BASE}/plan.php?id=${encodeURIComponent(id)}`)
}

// Resolves to {plan, week}; plan is null when the user hasn't picked one yet.
export function fetchCurrentPlan() {
  return getJson(`${API_BASE}/current_plan.php`)
}

export function selectPlan(planId) {
  return getJson(`${API_BASE}/current_plan.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan_id: planId }),
  })
}
