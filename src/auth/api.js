export async function authRequest(endpoint, data) {
  let response
  try {
    response = await fetch(`${import.meta.env.BASE_URL}api/${endpoint}.php`, {
      method: data === undefined ? 'GET' : 'POST', credentials: 'same-origin',
      headers: data === undefined ? {} : { 'Content-Type': 'application/json' },
      body: data === undefined ? undefined : JSON.stringify(data),
    })
  } catch { throw new Error('Unable to connect. Check your connection and try again.') }
  const body = await response.json().catch(() => ({ error: 'Authentication is temporarily unavailable. Please try again.' }))
  if (!response.ok) {
    const error = new Error(body.error || 'Please try again.')
    error.fields = body.errors || {}
    error.status = response.status
    throw error
  }
  return body
}

export function validate(values, registration = false) {
  const errors = {}
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = 'Enter a valid email address.'
  if (!values.password) errors.password = 'Enter your password.'
  if (registration) {
    if (!values.full_name.trim()) errors.full_name = 'Enter your full name.'
    if (values.password.length < 12 || !/[a-zA-Z]/.test(values.password) || !/[0-9]/.test(values.password) || !/[^a-zA-Z0-9]/.test(values.password)) errors.password = 'Use 12+ characters with letters, numbers & symbols.'
    if (values.confirm_password !== values.password) errors.confirm_password = 'Passwords must match.'
  }
  return errors
}
