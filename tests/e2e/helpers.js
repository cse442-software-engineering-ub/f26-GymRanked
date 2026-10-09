import { expect } from '@playwright/test'

export const TEST_PASSWORD = 'E2eTestPass12!'

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
  await page.locator('.nav-bar, .ob-page').or(page.getByRole('alert')).first().waitFor()
  if (await page.getByText('Too many attempts.').isVisible()) throw new Error(RATE_LIMITED)
  await expect(page).toHaveURL(/#\/(dashboard|goal|experience|equipment|recommended)$/)
}

// A finished account logs out from the Dashboard's account menu. One that hasn't finished onboarding is sent
// back to its next step, which has its own "Log out" in the top-right corner of the photo band.
export async function logOut(page) {
  await page.goto('#/dashboard')
  const accountMenu = page.getByRole('button', { name: 'Open account menu' })
  const onboardingLogOut = page.locator('.ob-page').getByRole('button', { name: 'Log out' })
  await accountMenu.or(onboardingLogOut).first().waitFor()
  if (await onboardingLogOut.isVisible()) {
    await onboardingLogOut.click()
  } else {
    await accountMenu.click()
    await page.getByRole('menuitem', { name: 'Log out' }).click()
  }
  await expect(page.getByText('You are logged out.')).toBeVisible()
}

export async function createAccountAndLogIn(page, fullName) {
  const account = await createAccount(page, fullName)
  await logIn(page, account)
  return account
}
