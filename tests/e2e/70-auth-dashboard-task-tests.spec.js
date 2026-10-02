import { expect, test } from '@playwright/test'
import { step } from './banner.js'

const PASSWORD = 'TaskTestPass12!'
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec']
const email = () => `e2e-task-${Date.now()}-${Math.random().toString(36).slice(2, 9)}@example.com`
const field = (page, name) => page.getByLabel(name, { exact: true })
const avatar = (page) => page.getByRole('button', { name: 'Open account menu' })

async function register(page, fullName, address = email()) {
  await page.goto('#/register')
  await field(page, 'Full name').fill(fullName)
  await field(page, 'Email').fill(address)
  await field(page, 'Password').fill(PASSWORD)
  await field(page, 'Confirm password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page).toHaveURL(/#\/(goal|login)$/)
  if (page.url().endsWith('#/login')) {
    throw new Error('The account was created, but automatic login did not complete. Check the Aptitude login rate limit before treating this as a feature failure.')
  }
  return { fullName, email: address }
}

async function completeSetup(page) {
  await page.getByRole('button', { name: /Strength/ }).click()
  await page.getByRole('button', { name: 'Save goal' }).click()
  await expect(page).toHaveURL(/#\/setup$/)
  await page.getByRole('button', { name: /Intermediate/ }).click()
  await page.getByRole('button', { name: 'Dumbbells' }).click()
  await page.getByRole('button', { name: 'Save setup' }).click()
  await expect(page).toHaveURL(/#\/login$/)
  await expect(page.getByText('Account setup saved. Log in to continue.')).toBeVisible()
}

async function login(page, account, remember = false) {
  await field(page, 'Email').fill(account.email)
  await field(page, 'Password').fill(PASSWORD)
  if (remember) await page.getByRole('checkbox', { name: 'Keep me logged in' }).check()
  await page.getByRole('button', { name: 'Log in' }).click()
  await expect(page).toHaveURL(/#\/dashboard$/)
}

async function preparedAccount(page, name, remember = false) {
  const account = await register(page, name)
  await completeSetup(page)
  await login(page, account, remember)
  return account
}

async function expectIdentity(page, firstName, initials) {
  await expect(page.getByRole('heading', { name: `Let's move weight, ${firstName}.` })).toBeVisible()
  await expect(avatar(page)).toContainText(initials)
}

async function logout(page) {
  await avatar(page).click()
  await expect(page.getByRole('menuitem', { name: 'Profile' })).toBeVisible()
  await expect(page.getByRole('menuitem', { name: 'Account Settings' })).toBeVisible()
  const button = page.getByRole('menuitem', { name: 'Log out' })
  await expect(button).toHaveCSS('color', 'rgb(255, 92, 92)')
  await button.click()
  await expect(page).toHaveURL(/#\/login$/)
  await expect(page.getByText('You are logged out.')).toBeVisible()
}

test.describe('Task #70: Home Dashboard', () => {
  test('Test 1: displays the signed-in user and dashboard content', async ({ page }) => {
    await step('Setup: register Dashboard Tester, complete onboarding, and log in', () => preparedAccount(page, 'Dashboard Tester'))
    await step('Step 1: the Dashboard route and greeting appear', async () => {
      await expect(page).toHaveURL(/#\/dashboard$/)
      await expect(page.getByRole('heading', { name: "Let's move weight, Dashboard." })).toBeVisible()
    })
    await step('Step 2: the profile icon displays DT', () => expect(avatar(page)).toContainText('DT'))
    await step('Step 3: the three summary cards have their initial values', async () => {
      const cards = page.locator('.dashboard-metric')
      await expect(cards).toHaveCount(3)
      await expect(cards.nth(0)).toContainText('RANK')
      await expect(cards.nth(0)).toContainText('Unranked')
      await expect(cards.nth(1)).toContainText('VOLUME THIS WEEK')
      await expect(cards.nth(1)).toContainText('0 lb')
      await expect(cards.nth(2)).toContainText('NEW PRS')
      await expect(cards.nth(2)).toContainText('0')
    })
    await step('Step 4: Today’s lifts has the empty message', () => expect(page.getByText('No lifts logged today — add your first to get placed.')).toBeVisible())
    await step('Step 5: the greeting shows this Monday through Sunday and Volume by day has no duplicate date', async () => {
      const monday = new Date()
      monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6)
      const end = sunday.getMonth() === monday.getMonth()
        ? sunday.getDate()
        : `${MONTHS[sunday.getMonth()]} ${sunday.getDate()}`
      await expect(page.locator('.dashboard-header p')).toHaveText(
        `Week of ${MONTHS[monday.getMonth()]} ${monday.getDate()} – ${end} · 0 sessions logged`,
      )
      await expect(page.locator('.dashboard-volume')).not.toContainText('Week of')
    })
    await step('Step 6: the chart labels Monday through Sunday', () => expect(page.locator('.dashboard-chart__day')).toHaveText(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']))
    await step('Step 7: the navigation shows every section and marks Dashboard current', async () => {
      await expect(page.locator('.nav-bar__links')).toContainText('DashboardWorkoutsPlansProgressLeaderboardToday')
      await expect(page.getByRole('link', { name: 'Dashboard', exact: true })).toHaveClass(/nav-bar__link--current/)
    })
  })

  test('Test 2: preserves the session and supports navigation and logout', async ({ page }) => {
    await step('Setup: register Dashboard Session Tester, complete onboarding, and log in with Keep me logged in', () => preparedAccount(page, 'Dashboard Session Tester', true))
    await step('Step 1: the Dashboard greets the signed-in user', () => expectIdentity(page, 'Dashboard', 'DT'))
    await step('Step 2: refreshing retains the signed-in user', async () => { await page.reload(); await expectIdentity(page, 'Dashboard', 'DT') })
    await step('Step 3: Plans retains the profile initials', async () => {
      await page.getByRole('link', { name: 'Plans', exact: true }).click()
      await expect(page).toHaveURL(/#\/plans$/)
      await expect(avatar(page)).toContainText('DT')
    })
    await step('Step 4: returning to Dashboard retains the user', async () => {
      await page.getByRole('link', { name: 'Dashboard', exact: true }).click()
      await expectIdentity(page, 'Dashboard', 'DT')
    })
    await step('Steps 5–6: account menu shows its items and Log out opens Login', () => logout(page))
    await step('Steps 7–8: the direct Dashboard URL returns to Login', async () => {
      await page.goto('#/dashboard')
      await expect(page).toHaveURL(/#\/login$/)
    })
  })
})

test.describe('Task #66: Login page', () => {
  test('Test 1: handles incorrect and correct sign-in attempts', async ({ page }) => {
    const account = await step('Setup: register Login Page Tester and complete onboarding', async () => {
      const created = await register(page, 'Login Page Tester')
      await completeSetup(page)
      return created
    })
    await step('Step 1: empty fields show both validation messages', async () => {
      await field(page, 'Email').fill('')
      await field(page, 'Password').fill('')
      await page.getByRole('button', { name: 'Log in' }).click()
      await expect(page.locator('#email-error')).toHaveText('Enter a valid email address.')
      await expect(page.locator('#password-error')).toHaveText('Enter your password.')
    })
    await step('Step 2: wrong password stays on Login', async () => {
      await field(page, 'Email').fill(account.email)
      await field(page, 'Password').fill('WrongPassword12!')
      await page.getByRole('button', { name: 'Log in' }).click()
      await expect(page.getByText('Invalid email or password.')).toBeVisible()
      await expect(page).toHaveURL(/#\/login$/)
    })
    await step('Step 3: correct login opens Dashboard and its summary cards', async () => {
      await field(page, 'Password').fill(PASSWORD)
      await page.getByRole('checkbox', { name: 'Keep me logged in' }).check()
      await page.getByRole('button', { name: 'Log in' }).click()
      await expect(page).toHaveURL(/#\/dashboard$/)
      await expect(page.getByRole('heading', { name: "Let's move weight, Login." })).toBeVisible()
      await expect(page.locator('.dashboard-metric__label')).toHaveText(['RANK', 'VOLUME THIS WEEK', 'NEW PRS'])
    })
    await step('Step 4: refresh keeps the Dashboard and name', async () => {
      await page.reload()
      await expect(page).toHaveURL(/#\/dashboard$/)
      await expect(page.getByRole('heading', { name: "Let's move weight, Login." })).toBeVisible()
    })
    await step('Step 5: Login URL redirects an active session to Dashboard', async () => {
      await page.goto('#/login')
      await expect(page).toHaveURL(/#\/dashboard$/)
    })
  })

  test('Test 2: profile initials remain correct across pages', async ({ page }) => {
    await step('Setup: register Test User, complete onboarding, and log in', () => preparedAccount(page, 'Test User'))
    await step('Step 1: Dashboard displays Test and TU', () => expectIdentity(page, 'Test', 'TU'))
    await step('Step 2: Plans displays TU', async () => { await page.getByRole('link', { name: 'Plans', exact: true }).click(); await expect(page).toHaveURL(/#\/plans$/); await expect(avatar(page)).toContainText('TU') })
    await step('Step 3: Workouts displays TU', async () => { await page.getByRole('link', { name: 'Workouts', exact: true }).click(); await expect(page).toHaveURL(/#\/weekly-plan$/); await expect(avatar(page)).toContainText('TU') })
    await step('Step 4: Dashboard still displays Test and TU', async () => { await page.getByRole('link', { name: 'Dashboard', exact: true }).click(); await expectIdentity(page, 'Test', 'TU') })
    await step('Step 5: refresh retains Test and TU', async () => { await page.reload(); await expectIdentity(page, 'Test', 'TU') })
  })

  test('Test 3: logging out ends the frontend session', async ({ page }) => {
    const account = await step('Setup: register Logout Tester, complete onboarding, and log in', () => preparedAccount(page, 'Logout Tester'))
    await step('Step 1: Dashboard displays Logout and LT', () => expectIdentity(page, 'Logout', 'LT'))
    await step('Steps 2–3: Log out opens Login with a confirmation', () => logout(page))
    await step('Steps 4–5: direct Dashboard access returns to Login', async () => { await page.goto('#/dashboard'); await expect(page).toHaveURL(/#\/login$/) })
    await step('Step 6: logging in again restores the same user', async () => { await login(page, account); await expectIdentity(page, 'Logout', 'LT') })
  })
})

test.describe('Task #65: Registration page', () => {
  test('Test 1: shows clear validation and creates an account', async ({ page }) => {
    await step('Setup: open Registration with a fresh test email', () => page.goto('#/register'))
    await step('Step 1: empty submission shows required-field errors', async () => {
      await page.getByRole('button', { name: 'Create account' }).click()
      for (const name of ['full_name', 'email', 'password', 'confirm_password']) await expect(page.locator(`#${name}-error`)).toBeVisible()
    })
    await step('Step 2: invalid details show the exact validation text', async () => {
      await field(page, 'Full name').fill('Registration Tester')
      await field(page, 'Email').fill('not-an-email')
      await field(page, 'Password').fill('short')
      await field(page, 'Confirm password').fill('different')
      await page.getByRole('button', { name: 'Create account' }).click()
      await expect(page.locator('#email-error')).toHaveText('Enter a valid email address.')
      await expect(page.locator('#password-error')).toHaveText('Use 12+ characters with letters, numbers & symbols.')
      await expect(page.locator('#confirm_password-error')).toHaveText('Passwords must match.')
    })
    await step('Step 3: valid details display Strong', async () => {
      await field(page, 'Email').fill(email())
      await field(page, 'Password').fill(PASSWORD)
      await field(page, 'Confirm password').fill(PASSWORD)
      await expect(page.locator('.password-strength')).toContainText('Password strength: Strong')
    })
    await step('Step 4: Show reveals the password and Hide conceals it', async () => {
      await page.getByRole('button', { name: 'Show password' }).click()
      await expect(field(page, 'Password')).toHaveAttribute('type', 'text')
      await page.getByRole('button', { name: 'Hide password' }).click()
      await expect(field(page, 'Password')).toHaveAttribute('type', 'password')
    })
    await step('Step 5: Create account opens Training Goal', async () => {
      await page.getByRole('button', { name: 'Create account' }).click()
      await expect(page).toHaveURL(/#\/goal$/)
    })
    await step('Step 6: Training Goal shows its title and three choices', async () => {
      await expect(page.getByRole('heading', { name: 'Choose your training goal' })).toBeVisible()
      for (const name of ['Strength', 'Fat loss', 'Aerobic fitness']) await expect(page.getByRole('button', { name: new RegExp(name) })).toBeVisible()
    })
  })

  test('Test 2: new account completes onboarding and reaches Login', async ({ page }) => {
    const account = await step('Setup: register Onboarding Tester', () => register(page, 'Onboarding Tester'))
    await step('Step 1: Strength is selected and appears in the profile preview', async () => {
      const choice = page.getByRole('button', { name: /Strength/ })
      await choice.click()
      await expect(choice).toHaveAttribute('aria-pressed', 'true')
      await expect(page.locator('.ob-profile')).toContainText('Strength')
    })
    await step('Step 2: Save goal opens Experience/Training Setup', async () => { await page.getByRole('button', { name: 'Save goal' }).click(); await expect(page).toHaveURL(/#\/setup$/) })
    await step('Step 3: Intermediate and Dumbbells are visibly selected', async () => {
      for (const name of [/Intermediate/, 'Dumbbells']) {
        const choice = page.getByRole('button', { name })
        await choice.click()
        await expect(choice).toHaveAttribute('aria-pressed', 'true')
      }
    })
    await step('Step 4: Save setup opens Login with confirmation', async () => {
      await page.getByRole('button', { name: 'Save setup' }).click()
      await expect(page).toHaveURL(/#\/login$/)
      await expect(page.getByText('Account setup saved. Log in to continue.')).toBeVisible()
    })
    await step('Step 5: Email is prefilled', () => expect(field(page, 'Email')).toHaveValue(account.email))
    await step('Step 6: login opens Dashboard with Onboarding and OT', async () => { await login(page, account); await expectIdentity(page, 'Onboarding', 'OT') })
    await step('Step 7: Dashboard shows its initial values and no lifts', async () => {
      await expect(page.locator('.dashboard-metric__value')).toHaveText(['Unranked', '0 lb', '0'])
      await expect(page.getByText('No lifts logged today — add your first to get placed.')).toBeVisible()
    })
  })

  test('Test 3: registration rejects an existing email', async ({ page }) => {
    const account = await step('Setup: register Duplicate Registration Tester and finish onboarding', async () => {
      const created = await register(page, 'Duplicate Registration Tester')
      await completeSetup(page)
      return created
    })
    await step('Steps 1–2: return to Registration and enter the existing details', async () => {
      await page.goto('#/register')
      await field(page, 'Full name').fill(account.fullName)
      await field(page, 'Email').fill(account.email)
      await field(page, 'Password').fill(PASSWORD)
      await field(page, 'Confirm password').fill(PASSWORD)
    })
    await step('Step 3: duplicate submission stays on Registration with an error', async () => {
      await page.getByRole('button', { name: 'Create account' }).click()
      await expect(page).toHaveURL(/#\/register$/)
      await expect(page.getByText('This email is already registered.', { exact: true })).toBeVisible()
    })
    await step('Step 4: Log in link opens Login', async () => { await page.getByRole('link', { name: 'Log in' }).click(); await expect(page).toHaveURL(/#\/login$/) })
    await step('Steps 5–6: original account logs in and displays Duplicate and DT', async () => { await login(page, account); await expectIdentity(page, 'Duplicate', 'DT') })
  })
})
