import { expect } from '@playwright/test'
import { step } from './banner.js'
import { acceptanceTests } from './stories.js'

// The card uses the seeded marcus.malone@example.com. Each run creates its own "Marcus Malone" with a new
// address and the card's password, so it works on any database and never hits the 10-attempt limit.
const PASSWORD = 'Marcus-Bench225!'
const INVALID = 'Invalid email or password.'

async function typeText(field, text) {
  if (process.env.E2E_WATCH) await field.pressSequentially(text, { delay: 60 })
  else await field.fill(text)
}

const field = (page, label) => page.getByLabel(label, { exact: true })
const fieldError = (page, name) => page.locator(`#${name}-error`)
const loginButton = (page) => page.getByRole('button', { name: 'Log in', exact: true })
const loginCard = (page) => page.getByRole('heading', { name: 'Log in to GymRank' })

async function marcus(page) {
  const email = `e2e-marcus-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`
  const response = await page.request.post('api/register.php', {
    data: { full_name: 'Marcus Malone', email, password: PASSWORD, confirm_password: PASSWORD },
  })
  expect(response.status(), `creating ${email}: ${await response.text()}`).toBe(201)
  return { email, password: PASSWORD }
}

// Clicks "Log in" and waits for the server's answer, so the message checked afterwards is the new one.
async function submitLogin(page) {
  await Promise.all([page.waitForResponse((response) => response.url().includes('login.php')), loginButton(page).click()])
}

async function logInAs(page, account, { remember = false } = {}) {
  await typeText(field(page, 'Email'), account.email)
  await typeText(field(page, 'Password'), account.password)
  if (remember) await page.getByRole('checkbox', { name: 'Keep me logged in' }).check()
  await loginButton(page).click()
}

acceptanceTests(
  '18-log-in.md',
  {
    1: async ({ page }) => {
      let account

      await step('Before you start: logged out, open the login screen', async () => {
        account = await marcus(page)
        await page.goto('#/login')
        await expect(page.getByRole('heading', { name: 'Every rep gets a rank.' })).toBeVisible()
      })

      await step('Step 1: the login card shows every box and button', async () => {
        await expect(loginCard(page)).toBeVisible()
        await expect(page.getByText('Welcome back. Your division is waiting.')).toBeVisible()
        await expect(field(page, 'Email')).toBeVisible()
        await expect(field(page, 'Password')).toBeVisible()
        await expect(page.getByRole('checkbox', { name: 'Keep me logged in' })).toBeVisible()
        await expect(page.getByRole('button', { name: 'Forgot password?' })).toBeVisible()
        await expect(loginButton(page)).toBeVisible()
        await expect(page.locator('.divider')).toHaveText('OR')
        await expect(page.getByRole('button', { name: 'Google' })).toBeVisible()
        await expect(page.getByRole('button', { name: 'Apple' })).toBeVisible()
        await expect(page.locator('.account-link')).toHaveText('New to GymRank? Create an account')
      })

      await step('Step 2: type the email', async () => {
        await typeText(field(page, 'Email'), account.email)
      })

      await step('Step 3: type the password, shown as dots', async () => {
        await typeText(field(page, 'Password'), account.password)
        await expect(field(page, 'Password')).toHaveAttribute('type', 'password')
      })

      await step('Step 4: press "Log in"', async () => {
        await loginButton(page).click()
      })

      await step('Step 5: the Dashboard greets "Let\'s move weight, Marcus." under the top navigation', async () => {
        await expect(page).toHaveURL(/#\/dashboard$/)
        await expect(page.getByRole('heading', { level: 1 })).toHaveText("Let's move weight, Marcus.")
        await expect(page.getByRole('navigation', { name: 'Primary' })).toHaveText(
          /Dashboard\s*Workouts\s*Plans\s*Progress\s*Leaderboard\s*Today/,
        )
      })
    },

    2: async ({ page }) => {
      await step('Before you start: open the login screen, both boxes empty', async () => {
        await page.goto('#/login')
      })

      await step('Step 1: press "Log in"', async () => {
        await loginButton(page).click()
      })

      await step('Step 2: both red messages appear and both boxes are outlined in red', async () => {
        await expect(page).toHaveURL(/#\/login$/)
        await expect(fieldError(page, 'email')).toHaveText('Enter a valid email address.')
        await expect(fieldError(page, 'password')).toHaveText('Enter your password.')
        for (const label of ['Email', 'Password']) {
          await expect(field(page, label).locator('..')).toHaveClass(/invalid/)
        }
      })

      await step('Step 3: type the email', async () => {
        await typeText(field(page, 'Email'), 'marcus.malone@example.com')
      })

      await step('Step 4: the red writing under Email disappears', async () => {
        await expect(fieldError(page, 'email')).toHaveCount(0)
      })
    },

    3: async ({ page }) => {
      let account

      await step('Before you start: open the login screen', async () => {
        account = await marcus(page)
        await page.goto('#/login')
      })

      await step('Step 1: type the email and a wrong password', async () => {
        await typeText(field(page, 'Email'), account.email)
        await typeText(field(page, 'Password'), 'wrongpassword123')
      })

      await step('Steps 2–3: press "Log in" once; the page does not reload', async () => {
        // A full reload would wipe this marker from the page.
        await page.evaluate(() => {
          window.__samePage = true
        })
        await submitLogin(page)
        expect(await page.evaluate(() => window.__samePage)).toBe(true)
      })

      await step('Step 4: "Invalid email or password." appears on the login screen', async () => {
        await expect(page).toHaveURL(/#\/login$/)
        await expect(page.getByRole('alert')).toHaveText(INVALID)
      })

      await step('Step 5: the Dashboard did not appear', async () => {
        await expect(page.getByRole('heading', { name: /Let's move weight/ })).toHaveCount(0)
      })
    },

    4: async ({ page }) => {
      await step('Before you start: open the login screen', async () => {
        await page.goto('#/login')
      })

      await step('Step 1: type an email with no account', async () => {
        await typeText(field(page, 'Email'), `nobody.here.${Date.now()}@example.com`)
        await typeText(field(page, 'Password'), PASSWORD)
      })

      await step('Step 2: press "Log in" once', async () => {
        await submitLogin(page)
      })

      await step('Step 3: the same "Invalid email or password." appears on the login screen', async () => {
        await expect(page.getByRole('alert')).toHaveText(INVALID)
        await expect(page).toHaveURL(/#\/login$/)
      })
    },

    5: async ({ page, context }) => {
      let account

      await step('Before you start: log in as in Test 1, so you are on the Dashboard', async () => {
        account = await marcus(page)
        await page.goto('#/login')
        await logInAs(page, account)
        await expect(page).toHaveURL(/#\/dashboard$/)
      })

      await step('Step 1: press "Log out" in the profile menu', async () => {
        await page.getByRole('button', { name: 'Open account menu' }).click()
        await page.getByRole('menuitem', { name: 'Log out' }).click()
      })

      await step('Step 2: the "Log in to GymRank" card shows again', async () => {
        await expect(loginCard(page)).toBeVisible()
      })

      await step("Step 3: press the browser's Back button once", async () => {
        await page.goBack()
      })

      await step('Step 4: you are on the login screen, not the Dashboard', async () => {
        await expect(page).toHaveURL(/#\/login$/)
        await expect(loginCard(page)).toBeVisible()
      })

      await step('Steps 5–6: log in again with "Keep me logged in" ticked', async () => {
        await logInAs(page, account, { remember: true })
      })

      await step('Step 7: the Dashboard shows', async () => {
        await expect(page).toHaveURL(/#\/dashboard$/)
      })

      let reopened
      await step('Step 8: close the tab and open the website again', async () => {
        await page.close()
        reopened = await context.newPage()
        await reopened.goto('#/login')
      })

      await step('Step 9: the Dashboard shows, not the login screen', async () => {
        await expect(reopened).toHaveURL(/#\/dashboard$/)
      })
    },

    6: async ({ page }) => {
      await step('Before you start: open the login screen', async () => {
        await page.goto('#/login')
      })

      await step('Step 1: press "Forgot password?"', async () => {
        await page.getByRole('button', { name: 'Forgot password?' }).click()
      })

      await step('Step 2: the password recovery message appears', async () => {
        await expect(page.getByRole('status')).toHaveText(
          'Password recovery is not available yet. Please contact the GymRank team.',
        )
      })

      await step('Step 3: press "Google"', async () => {
        await page.getByRole('button', { name: 'Google' }).click()
      })

      await step('Step 4: the Google message appears', async () => {
        await expect(page.getByRole('status')).toHaveText(
          'Google sign-in is not available yet. Please use your email and password.',
        )
      })

      await step('Step 5: press "Apple"', async () => {
        await page.getByRole('button', { name: 'Apple' }).click()
      })

      await step('Step 6: the Apple message appears', async () => {
        await expect(page.getByRole('status')).toHaveText(
          'Apple sign-in is not available yet. Please use your email and password.',
        )
      })

      await step('Step 7: still on the login screen', async () => {
        await expect(page).toHaveURL(/#\/login$/)
        await expect(loginCard(page)).toBeVisible()
      })
    },
  },
  { mobile: [1] },
)
