const RUN_KEY = 'gymrank-weekly123-run'
const CLIENT_KEY = 'gymrank-weekly123-client'

export function getWeekly123Run(storage = sessionStorage) {
  try {
    const run = JSON.parse(storage.getItem(RUN_KEY) || 'null')
    return run && Number.isInteger(run.test) && run.client_id && run.run_id ? run : null
  } catch { return null }
}

export function startWeekly123Run(test, storage = sessionStorage, uuid = () => crypto.randomUUID()) {
  let client = storage.getItem(CLIENT_KEY)
  if (!client) {
    client = uuid()
    storage.setItem(CLIENT_KEY, client)
  }
  const run = { test, client_id: client, run_id: uuid() }
  storage.setItem(RUN_KEY, JSON.stringify(run))
  return run
}

export function finishWeekly123Run(storage = sessionStorage) {
  storage.removeItem(RUN_KEY)
}

export function weekly123LoginPayload(values, run) {
  return run && /^weekly123-[a-z]+@example\.com$/i.test(values.email.trim())
    ? { ...values, weekly123_run: run }
    : values
}
