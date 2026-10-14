// Small fetch wrapper for the onboarding API calls.
// Always resolves (never throws) to { ok, status, data } so components can handle every case the same way.

const API_BASE = `${import.meta.env.BASE_URL}api/`;

export async function apiRequest(path, options = {}) {
  let response;
  try {
    response = await fetch(API_BASE + path, {
      credentials: 'same-origin',
      headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
      ...options,
    });
  } catch {
    return { ok: false, status: 0, data: null };
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    // Not JSON (for example a PHP error page); treated as a failed request below.
  }
  return { ok: response.ok && data !== null, status: response.status, data };
}

// Turns an API result into a message a user can act on.
const INPUT_ERRORS = {
  'Invalid training_goal': 'Choose a training goal.',
  'Invalid experience': 'Choose an experience level.',
  'Invalid equipment': 'Choose at least one piece of equipment.',
};

export function errorMessage(result, fallback) {
  if (result.status === 0) return "Can't reach the server. Check your connection and try again.";
  if (result.status === 401) return 'Your session has ended. Log in again to continue.';
  if (result.status === 400 && INPUT_ERRORS[result.data?.error]) return INPUT_ERRORS[result.data.error];
  return fallback;
}
