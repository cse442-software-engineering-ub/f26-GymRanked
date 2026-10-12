import { expect, test } from '@playwright/test'
import { weekRangeLabel } from '../../src/weeklySchedule.js'
import { step } from './banner.js'

const PASSWORD = 'TaskTestPass12!'
const email = () => `e2e-task-${Date.now()}-${Math.random().toString(36).slice(2, 9)}@example.com`
const field = (page, name) => page.getByLabel(name, { exact: true })
const avatar = (page) => page.getByRole('button', { name: 'Open account menu' })
const loginButton = (page) => page.getByRole('button', { name: 'Log in', exact: true })

async function register(page, fullName) {
  const account = { fullName, email: email() }
  await page.goto('#/register')
  await field(page, 'Full name').fill(fullName)
  await field(page, 'Email').fill(account.email)
  await field(page, 'Password').fill(PASSWORD)
  await field(page, 'Confirm password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page).toHaveURL(/#\/login$/)
  await expect(page.getByText('Account created. Log in to continue.')).toBeVisible()
  await expect(field(page, 'Email')).toHaveValue(account.email)
  return account
}

async function login(page, account, { remember = false, destination = 'dashboard' } = {}) {
  await field(page, 'Email').fill(account.email)
  await field(page, 'Password').fill(PASSWORD)
  if (remember) await page.getByRole('checkbox', { name: 'Keep me logged in' }).check()
  await loginButton(page).click()
  await expect(page).toHaveURL(new RegExp(`#/${destination}$`))
}

async function completeSetup(page, { level = 'Beginner', equipment = 'Full gym access' } = {}) {
  await expect(page.getByRole('heading', { name: 'Choose your training goal' })).toBeVisible()
  await expect(page.locator('.ob-step')).toHaveAttribute('aria-busy', 'false')
  await page.getByRole('button', { name: /^Strength/ }).click()
  await page.getByRole('button', { name: 'Save goal' }).click()
  await expect(page.getByRole('heading', { name: 'How experienced are you?' })).toBeVisible()
  await expect(page.locator('.ob-step')).toHaveAttribute('aria-busy', 'false')
  const levelChoice = page.getByRole('button', { name: new RegExp(`^${level}`) })
  await levelChoice.click()
  await expect(levelChoice).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Save and continue' }).click()
  await expect(page.getByRole('heading', { name: 'What equipment can you use?' })).toBeVisible()
  await expect(page.locator('.ob-step')).toHaveAttribute('aria-busy', 'false')
  const equipmentChoice = page.getByRole('button', { name: equipment })
  await equipmentChoice.click()
  await expect(equipmentChoice).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Save and continue' }).click()
  await expect(page).toHaveURL(/#\/recommended$/)
  await expect(page.getByRole('heading', { name: 'Choose your workout plan' })).toBeVisible()
}

async function choosePlan(page, name = 'Beginner Fundamentals', needsEquipment = false) {
  const row = page.locator('.ob-plan').filter({ has: page.getByText(name, { exact: true }) })
  await row.getByRole('button', { name: 'Choose plan' }).click()
  if (needsEquipment) await page.getByRole('dialog').getByRole('button', { name: 'Start anyway' }).click()
  await expect(page).toHaveURL(/#\/dashboard$/)
  await expect(page.locator('.dashboard-today')).toContainText(`Current plan: ${name}`)
}

async function preparedAccount(page, name, remember = false) {
  const account = await register(page, name)
  await login(page, account, { remember, destination: 'goal' })
  await completeSetup(page)
  await choosePlan(page)
  return account
}

async function expectIdentity(page, firstName, initials) {
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(`Welcome back, ${firstName}`)
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
    await step('Setup: register Dashboard Tester, sign in, finish onboarding, and choose a plan', () => preparedAccount(page, 'Dashboard Tester'))
    await step('Step 1: the Dashboard route and greeting appear', async () => {
      await expect(page).toHaveURL(/#\/dashboard$/)
      await expectIdentity(page, 'Dashboard', 'DT')
    })
    await step('Step 2: the GymRank brand shows its weight icon', async () => {
      await expect(page.locator('.nav-bar__logo svg')).toBeVisible()
    })
    await step('Step 3: the summary cards show the new account values', async () => {
      const cards = page.locator('.dashboard-metric')
      await expect(cards).toHaveCount(3)
      await expect(cards.nth(0)).toContainText('RANK')
      await expect(cards.nth(0)).toContainText('Getting started')
      await expect(cards.nth(1)).toContainText('WORKOUTS THIS WEEK')
      await expect(cards.nth(1)).toContainText('0 of 3')
      await expect(cards.nth(2)).toContainText('WEEKLY CONSISTENCY')
      await expect(cards.nth(2)).toContainText('0 weeks')
    })
    await step('Step 4: Today’s workout names the saved plan and current week', async () => {
      const today = page.locator('.dashboard-today')
      await expect(today).toContainText('Current plan: Beginner Fundamentals')
      await expect(today.locator('.dashboard-today__heading-label')).toContainText(weekRangeLabel(new Date()))
      await expect(today.locator('.dashboard-card__title')).toHaveText(/Full body [ABC]|Rest day/)
    })
    await step('Step 5: the first-week checklist remembers setup', async () => {
      await expect(page.locator('.dashboard-checklist')).toContainText('Choose your training goal')
      await expect(page.locator('.dashboard-checklist')).toContainText('Select a workout plan')
      await expect(page.locator('.dashboard-checklist')).toContainText('Log your first lift')
      await expect(page.locator('.dashboard-step__marker--done')).toHaveCount(2)
    })
    await step('Step 6: the navigation marks Dashboard current', async () => {
      const nav = page.getByRole('navigation', { name: 'Primary' })
      await expect(nav).toContainText('DashboardWorkoutsPlansProgressLeaderboardToday')
      await expect(nav.getByRole('link', { name: 'Dashboard' })).toHaveClass(/nav-bar__link--current/)
    })
  })

  test('Test 2: preserves the session and supports navigation and logout', async ({ page }) => {
    await step('Setup: register Dashboard Session Tester and choose a plan with Keep me logged in', () => preparedAccount(page, 'Dashboard Session Tester', true))
    await step('Step 1: the Dashboard greets the signed-in user', () => expectIdentity(page, 'Dashboard', 'DT'))
    await step('Step 2: refreshing retains the signed-in user', async () => { await page.reload(); await expectIdentity(page, 'Dashboard', 'DT') })
    await step('Step 3: Plans retains the profile initials', async () => {
      await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Plans' }).click()
      await expect(page).toHaveURL(/#\/plans$/)
      await expect(page.getByRole('heading', { name: 'Workout plan library' })).toBeVisible()
      await expect(avatar(page)).toContainText('DT')
    })
    await step('Step 4: returning to Dashboard retains the user and plan', async () => {
      await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Dashboard' }).click()
      await expectIdentity(page, 'Dashboard', 'DT')
      await expect(page.locator('.dashboard-today')).toContainText('Current plan: Beginner Fundamentals')
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
    const account = await step('Setup: register Login Page Tester and finish onboarding', async () => {
      const created = await preparedAccount(page, 'Login Page Tester')
      await logout(page)
      return created
    })
    await step('Step 1: empty fields show both validation messages', async () => {
      await field(page, 'Email').fill('')
      await field(page, 'Password').fill('')
      await loginButton(page).click()
      await expect(page.locator('#email-error')).toHaveText('Enter a valid email address.')
      await expect(page.locator('#password-error')).toHaveText('Enter your password.')
    })
    await step('Step 2: wrong password stays on Login', async () => {
      await field(page, 'Email').fill(account.email)
      await field(page, 'Password').fill('WrongPassword12!')
      await loginButton(page).click()
      await expect(page.getByText('Invalid email or password.')).toBeVisible()
      await expect(page).toHaveURL(/#\/login$/)
    })
    await step('Step 3: correct login opens Dashboard and its summary cards', async () => {
      await login(page, account, { remember: true })
      await expectIdentity(page, 'Login', 'LT')
      await expect(page.locator('.dashboard-metric__label')).toHaveText(['RANK', 'WORKOUTS THIS WEEK', 'WEEKLY CONSISTENCY'])
    })
    await step('Step 4: refresh keeps the Dashboard and name', async () => {
      await page.reload()
      await expectIdentity(page, 'Login', 'LT')
    })
    await step('Step 5: Login URL redirects an active session to Dashboard', async () => {
      await page.goto('#/login')
      await expect(page).toHaveURL(/#\/dashboard$/)
    })
  })

  test('Test 2: profile initials remain correct across pages', async ({ page }) => {
    await step('Setup: register Test User and choose a plan', () => preparedAccount(page, 'Test User'))
    await step('Step 1: Dashboard displays Test and TU', () => expectIdentity(page, 'Test', 'TU'))
    await step('Step 2: Plans displays TU', async () => { await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Plans' }).click(); await expect(page).toHaveURL(/#\/plans$/); await expect(avatar(page)).toContainText('TU') })
    await step('Step 3: Workouts displays TU', async () => { await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Workouts' }).click(); await expect(page).toHaveURL(/#\/weekly-plan$/); await expect(avatar(page)).toContainText('TU') })
    await step('Step 4: Dashboard still displays Test and TU', async () => { await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Dashboard' }).click(); await expectIdentity(page, 'Test', 'TU') })
    await step('Step 5: refresh retains Test and TU', async () => { await page.reload(); await expectIdentity(page, 'Test', 'TU') })
  })

  test('Test 3: logging out ends the frontend session', async ({ page }) => {
    const account = await step('Setup: register Logout Tester and choose a plan', () => preparedAccount(page, 'Logout Tester'))
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
    await step('Step 5: Create account opens Login with a confirmation', async () => {
      await page.getByRole('button', { name: 'Create account' }).click()
      await expect(page).toHaveURL(/#\/login$/)
      await expect(page.getByText('Account created. Log in to continue.')).toBeVisible()
    })
    await step('Step 6: signing in opens Training Goal with three choices', async () => {
      await field(page, 'Password').fill(PASSWORD)
      await loginButton(page).click()
      await expect(page).toHaveURL(/#\/goal$/)
      await expect(page.getByRole('heading', { name: 'Choose your training goal' })).toBeVisible()
      for (const name of ['Strength', 'Fat loss', 'Aerobic fitness']) await expect(page.getByRole('button', { name: new RegExp(name) })).toBeVisible()
    })
  })

  test('Test 2: new account signs in, completes onboarding, and reaches Dashboard', async ({ page }) => {
    await step('Setup: register Onboarding Tester and sign in', async () => {
      const created = await register(page, 'Onboarding Tester')
      await login(page, created, { destination: 'goal' })
    })
    await step('Step 1: Strength is selected and appears in the profile preview', async () => {
      const choice = page.getByRole('button', { name: /^Strength/ })
      await choice.click()
      await expect(choice).toHaveAttribute('aria-pressed', 'true')
      await expect(page.locator('.ob-profile')).toContainText('Strength')
    })
    await step('Step 2: Save goal opens Experience', async () => {
      await page.getByRole('button', { name: 'Save goal' }).click()
      await expect(page.getByRole('heading', { name: 'How experienced are you?' })).toBeVisible()
    })
    await step('Step 3: Intermediate is saved and Equipment opens', async () => {
      await expect(page.locator('.ob-step')).toHaveAttribute('aria-busy', 'false')
      const choice = page.getByRole('button', { name: /^Intermediate/ })
      await choice.click()
      await expect(choice).toHaveAttribute('aria-pressed', 'true')
      await page.getByRole('button', { name: 'Save and continue' }).click()
      await expect(page.getByRole('heading', { name: 'What equipment can you use?' })).toBeVisible()
    })
    await step('Step 4: Dumbbells are saved and Choose plan opens', async () => {
      await expect(page.locator('.ob-step')).toHaveAttribute('aria-busy', 'false')
      const choice = page.getByRole('button', { name: 'Dumbbells' })
      await choice.click()
      await expect(choice).toHaveAttribute('aria-pressed', 'true')
      await page.getByRole('button', { name: 'Save and continue' }).click()
      await expect(page.getByRole('heading', { name: 'Choose your workout plan' })).toBeVisible()
      await expect(page.getByText('Your setup is saved.')).toBeVisible()
    })
    await step('Step 5: choosing a plan opens Dashboard with Onboarding and OT', async () => {
      await choosePlan(page, 'Beginner Fundamentals', true)
      await expectIdentity(page, 'Onboarding', 'OT')
    })
    await step('Step 6: Dashboard shows its initial summary', async () => {
      await expect(page.locator('.dashboard-metric__value')).toHaveText(['Getting started', '0 of 3', '0 weeks'])
      await expect(page.locator('.dashboard-today')).toContainText('Current plan: Beginner Fundamentals')
    })
  })

  test('Test 3: registration rejects an existing email', async ({ page }) => {
    const account = await step('Setup: register Duplicate Registration Tester and finish onboarding', async () => {
      const created = await preparedAccount(page, 'Duplicate Registration Tester')
      await logout(page)
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
      await expect(page.locator('#email-error')).toHaveText('This email is already registered. Log in instead.')
    })
    await step('Step 4: Log in link opens Login', async () => {
      await page.getByRole('link', { name: 'Log in' }).click()
      await expect(page).toHaveURL(/#\/login$/)
    })
    await step('Steps 5–6: original account logs in and displays Duplicate and DT', async () => {
      await login(page, account)
      await expectIdentity(page, 'Duplicate', 'DT')
    })
  })
})
