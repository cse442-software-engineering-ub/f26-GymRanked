import { mkdirSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect } from '@playwright/test'

export const TEST_PASSWORD = 'E2eTestPass12!'

// Stories 124 and 131 both reload the weekly seed before each test and use the same accounts (Casey). In a quick
// parallel run their tests would reset each other's accounts, so a test that uses those accounts holds this lock from
// before its seed load until it ends. (The watch run uses one worker, so there it never waits.) A lock older than two
// minutes is from a run that was stopped and is taken over.
export async function acquireLock(name) {
  const dir = join(tmpdir(), `gymrank-e2e-${name}.lock`)
  for (;;) {
    try {
      mkdirSync(dir)
      return () => rmSync(dir, { recursive: true, force: true })
    } catch {
      try { if (Date.now() - statSync(dir).mtimeMs > 120000) rmSync(dir, { recursive: true, force: true }) } catch { /* gone */ }
      await new Promise((resolve) => setTimeout(resolve, 200))
    }
  }
}

const RATE_LIMITED =
  'The API allows 50 logins and 50 sign-ups per IP address every 15 minutes, and this run went over. ' +
  'Wait 15 minutes, or clear the counter on a local database (see database/seeds/README.md).'

// Every run uses new accounts, so the tests can be repeated without "This email is already registered."
function uniqueEmail() {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`
}

// Creates an account through the API. Story #17's tests cover the registration form itself.
export async function createAccount(page, fullName = 'E2E Tester') {
  const account = { fullName, email: uniqueEmail(), password: TEST_PASSWORD }
  const response = await page.request.post('api/register.php', {
    data: {
      full_name: fullName,
      email: account.email,
      password: TEST_PASSWORD,
      confirm_password: TEST_PASSWORD,
    },
  })
  if (response.status() === 429) throw new Error(RATE_LIMITED)
  expect(response.status(), `creating ${account.email}: ${await response.text()}`).toBe(201)
  return account
}

// In `npm run test:e2e:watch`, type one key at a time like a person; otherwise fill the field at once.
async function type(field, text) {
  if (process.env.E2E_WATCH) await field.pressSequentially(text, { delay: 60 })
  else await field.fill(text)
}

export async function logIn(page, account) {
  await page.goto('#/login')
  await type(page.getByLabel('Email'), account.email)
  await type(page.getByLabel('Password', { exact: true }), account.password)
  await page.getByRole('button', { name: 'Log in' }).click()
  // Wait for a signed-in page or a login error, then name the rate limit if that's what it was.
  // A finished account opens the Dashboard; one that hasn't finished onboarding opens its next step.
  await page.locator('.app-shell, .ob-page').or(page.getByRole('alert')).first().waitFor()
  if (await page.getByText('Too many attempts.').isVisible()) throw new Error(RATE_LIMITED)
  await expect(page).toHaveURL(/#\/(dashboard|personal-details|goal|experience|equipment|recommended)$/)
}

// The first onboarding step for a new account (since 2026-10-27, "Require personal details before training setup"): body weight and gender, then
// "Save and continue" opens "Choose your training goal". The stories' setups use 180 lb and "Man".
export const ONBOARDING_STEPS = ['Personal details', 'Training goal', 'Experience', 'Equipment', 'Choose plan']

export async function addPersonalDetails(page, { weight = '180', gender = 'Man' } = {}) {
  await expect(page).toHaveURL(/#\/personal-details$/)
  await type(page.getByLabel('Body weight (lb)'), weight)
  await page.getByRole('button', { name: gender, exact: true }).click()
  await page.getByRole('button', { name: 'Save and continue' }).click()
  await expect(page).toHaveURL(/#\/goal$/)
}

// "Log out" at the bottom of the menu: in the sidebar on a computer, behind "Menu" on a phone.
export async function menuLogOut(page) {
  const sidebarLogOut = page.getByRole('navigation', { name: 'Primary' }).getByRole('button', { name: 'Log out' })
  if (await sidebarLogOut.isVisible()) {
    await sidebarLogOut.click()
  } else {
    await page.getByRole('button', { name: 'Open navigation menu' }).click()
    await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('button', { name: 'Log out' }).click()
  }
}

// A finished account logs out from the menu on the Dashboard. One that hasn't finished onboarding is sent
// back to its next step, which has its own "Log out" in the top-right corner of the photo band.
export async function logOut(page) {
  await page.goto('#/dashboard')
  const onboardingLogOut = page.locator('.ob-page').getByRole('button', { name: 'Log out' })
  await page.locator('.app-shell').or(onboardingLogOut).first().waitFor()
  if (await onboardingLogOut.isVisible()) {
    await onboardingLogOut.click()
  } else {
    await menuLogOut(page)
  }
  await expect(page.getByText('You are logged out.')).toBeVisible()
}

// A new account, logged in, with Personal details saved, so it opens "Choose your training goal".
export async function createAccountAndLogIn(page, fullName) {
  const account = await createAccount(page, fullName)
  await logIn(page, account)
  await addPersonalDetails(page)
  return account
}
