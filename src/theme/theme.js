// The colour theme, dark (default) or light (Implement Persistent User Theme Preference).
//
// How it works: every colour on the site is a --gr- variable in src/index.css, and the light values are
// switched on by <html data-theme="light">. This file only sets that attribute, remembers it in the browser,
// and loads/saves it for the signed-in account through api/theme.php. A page built with var(--gr-…) colours
// therefore works in both themes with no extra code (DESIGN.md, "Colour").
//
// - index.html applies the remembered theme before the app loads, so a light page never flashes dark.
// - OnboardingGate calls syncAccountTheme() after it confirms the session, so the account's saved theme
//   wins over whatever this browser remembered (a new browser, or another user on the same one).
// - A theme control calls saveTheme(); it switches at once and switches back if the save fails.

export const THEMES = ['dark', 'light']
export const DEFAULT_THEME = 'dark'
export const THEME_KEY = 'gymrank.theme'
export const THEME_EVENT = 'gymrank:themechange'
export const SAVE_ERROR = "Couldn't save your theme. Check your connection and try again."

const API_URL = () => `${import.meta.env?.BASE_URL ?? '/'}api/theme.php`

// Anything that isn't exactly "light" is dark, so a bad cached or server value can never break the page.
export function normalizeTheme(value) {
  return value === 'light' ? 'light' : DEFAULT_THEME
}

export function currentTheme(root = document.documentElement) {
  return normalizeTheme(root.dataset.theme)
}

function remember(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    // Storage blocked (private mode, settings): the theme still applies, it just isn't cached.
  }
}

export function rememberedTheme() {
  try {
    return normalizeTheme(localStorage.getItem(THEME_KEY))
  } catch {
    return DEFAULT_THEME
  }
}

// Shows a theme everywhere at once and tells any theme controls on the page.
export function applyTheme(value, root = document.documentElement) {
  const theme = normalizeTheme(value)
  root.dataset.theme = theme
  remember(theme)
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: { theme } }))
  return theme
}

// Reads the signed-in account's theme and applies it. Never throws: offline, it keeps the remembered theme.
export async function loadTheme(fetchImpl = fetch) {
  try {
    const response = await fetchImpl(API_URL(), { credentials: 'same-origin' })
    const body = await response.json()
    if (!response.ok || !THEMES.includes(body?.theme)) return currentTheme()
    return applyTheme(body.theme)
  } catch {
    return currentTheme()
  }
}

// Loads the account's theme once per signed-in user, so moving between pages doesn't re-request it but a
// different user signing in on the same browser gets their own theme.
let syncedUserId = null
export function syncAccountTheme(userId, fetchImpl = fetch) {
  if (userId == null || userId === syncedUserId) return Promise.resolve(currentTheme())
  syncedUserId = userId
  return loadTheme(fetchImpl)
}

// Switches at once, then saves. If the save fails the previous theme comes back and this rejects with an
// Error whose message is SAVE_ERROR (status on error.status), for the control to show.
export async function saveTheme(value, fetchImpl = fetch) {
  const theme = normalizeTheme(value)
  const previous = currentTheme()
  if (theme === previous) return theme
  applyTheme(theme)
  let response
  try {
    response = await fetchImpl(API_URL(), {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme }),
    })
  } catch {
    applyTheme(previous)
    throw Object.assign(new Error(SAVE_ERROR), { status: 0 })
  }
  if (!response.ok) {
    applyTheme(previous)
    throw Object.assign(new Error(SAVE_ERROR), { status: response.status })
  }
  return theme
}
