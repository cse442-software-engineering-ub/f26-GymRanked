import { expect } from '@playwright/test'
import { step } from './banner.js'
import { createAccount, logIn } from './helpers.js'
import { acceptanceTests } from './stories.js'

// The card uses Jamie Lee / jamie.test1@example.com. Each run uses a new address so it can be repeated.
const NAME = 'Jamie Lee'
const PASSWORD = 'Lift!ng2Gether99'
const newEmail = () => `e2e-jamie-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`

// In watch mode, type one key at a time like a person (so the strength meter visibly updates).
async function typeText(field, text) {
  if (process.env.E2E_WATCH) await field.pressSequentially(text, { delay: 60 })
  else await field.fill(text)
}

const field = (page, label) => page.getByLabel(label, { exact: true })
const fieldError = (page, name) => page.locator(`#${name}-error`)
const strength = (page) => page.locator('.password-strength .accent')
const createButton = (page) => page.getByRole('button', { name: 'Create account' })
const loginCard = (page) => page.getByRole('heading', { name: 'Log in to GymRank' })
const onRegistration = async (page) => {
  await expect(page).toHaveURL(/#\/register$/)
  await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible()
}

// Test 1, steps 1–9: from the login screen to pressing "Create account" with the given details.
async function registerThroughForm(page, email) {
  await page.goto('#/login')
  await page.getByRole('link', { name: 'Create an account' }).click()
  await typeText(field(page, 'Full name'), NAME)
  await typeText(field(page, 'Email'), email)
  await typeText(field(page, 'Password'), PASSWORD)
  await typeText(field(page, 'Confirm password'), PASSWORD)
  await createButton(page).click()
}

acceptanceTests(
  '17-create-account.md',
  {
    1: async ({ page }) => {
      const email = newEmail()

      await step('Before you start: open the login screen', async () => {
        await page.goto('#/login')
        await expect(page.getByRole('heading', { name: 'Every rep gets a rank.' })).toBeVisible()
      })

      await step('Step 1: the login screen shows "Every rep gets a rank." and "Log in to GymRank"', async () => {
        await expect(page.locator('.hero h1')).toHaveText('Every rep gets a rank.')
        await expect(page.locator('.hero .accent')).toHaveText('rank.')
        await expect(loginCard(page)).toBeVisible()
      })

      await step('Step 2: press "Create an account"', async () => {
        // On phones the "New to GymRank?" words are hidden by design and the link becomes a full-width button.
        await expect(page.locator('.login-panel .account-link')).toContainText('New to GymRank? Create an account')
        await page.getByRole('link', { name: 'Create an account' }).click()
      })

      await step('Step 3: the form shows its title, four boxes, the strength line and "Create account"', async () => {
        await onRegistration(page)
        await expect(page.getByText("Let's set up your training profile.")).toBeVisible()
        await expect(page.locator('.form-field label')).toHaveText(['Full name', 'Email', 'Password', 'Confirm password'])
        await expect(strength(page)).toHaveText('Password strength: Not entered')
        await expect(page.getByRole('meter', { name: 'Password strength' })).toBeVisible()
        await expect(page.getByText('Use 12+ characters with letters, numbers & symbols.')).toBeVisible()
        await expect(createButton(page)).toBeVisible()
        await expect(page.locator('.account-link')).toHaveText('Already have an account? Log in')
      })

      await step('Step 4: type the full name', async () => {
        await typeText(field(page, 'Full name'), NAME)
      })

      await step('Step 5: type the email', async () => {
        await typeText(field(page, 'Email'), email)
      })

      await step('Step 6: type the password', async () => {
        await typeText(field(page, 'Password'), PASSWORD)
      })

      await step('Step 7: the strength line says "Password strength: Strong"', async () => {
        await expect(strength(page)).toHaveText('Password strength: Strong')
      })

      await step('Step 8: type the password again to confirm it', async () => {
        await typeText(field(page, 'Confirm password'), PASSWORD)
      })

      await step('Step 9: press "Create account"', async () => {
        await createButton(page).click()
      })

      await step('Step 10: the Dashboard greets "Let\'s move weight, Jamie."', async () => {
        await expect(page).toHaveURL(/#\/dashboard$/)
        await expect(page.getByRole('heading', { level: 1 })).toHaveText("Let's move weight, Jamie.")
      })
    },

    2: async ({ page }) => {
      const email = newEmail()

      await step('Before you start: do Test 1 so the account exists', async () => {
        await registerThroughForm(page, email)
      })

      await step('Step 1: on the Dashboard, press "Log out"', async () => {
        await expect(page).toHaveURL(/#\/dashboard$/)
        await page.getByRole('button', { name: 'Open account menu' }).click()
        await page.getByRole('menuitem', { name: 'Log out' }).click()
      })

      await step('Step 2: the "Log in to GymRank" card shows again', async () => {
        await expect(loginCard(page)).toBeVisible()
      })

      await step('Steps 3–5: log in with the new account', async () => {
        await typeText(field(page, 'Email'), email)
        await typeText(field(page, 'Password'), PASSWORD)
        await page.getByRole('button', { name: 'Log in', exact: true }).click()
      })

      await step('Step 6: the Dashboard greets "Let\'s move weight, Jamie."', async () => {
        await expect(page).toHaveURL(/#\/dashboard$/)
        await expect(page.getByRole('heading', { level: 1 })).toHaveText("Let's move weight, Jamie.")
      })
    },

    3: async ({ page }) => {
      await step('Before you start: open the login screen', async () => {
        await page.goto('#/login')
      })

      await step('Step 1: "Create an account" opens "Create your account"', async () => {
        await page.getByRole('link', { name: 'Create an account' }).click()
        await onRegistration(page)
      })

      await step('Step 2: press "Create account" with every box empty', async () => {
        await createButton(page).click()
      })

      await step('Step 3: three red messages appear and those boxes are outlined in red', async () => {
        await onRegistration(page)
        await expect(fieldError(page, 'full_name')).toHaveText('Enter your full name.')
        await expect(fieldError(page, 'email')).toHaveText('Enter a valid email address.')
        await expect(fieldError(page, 'password')).toHaveText('Use 12+ characters with letters, numbers & symbols.')
        for (const label of ['Full name', 'Email', 'Password']) {
          await expect(field(page, label)).toHaveAttribute('aria-invalid', 'true')
          await expect(field(page, label).locator('..')).toHaveClass(/invalid/)
        }
      })

      await step('Step 4: type "Jamie Lee" in Full name', async () => {
        await typeText(field(page, 'Full name'), NAME)
      })

      await step('Step 5: the Full name message disappears and the others stay', async () => {
        await expect(fieldError(page, 'full_name')).toHaveCount(0)
        await expect(fieldError(page, 'email')).toBeVisible()
        await expect(fieldError(page, 'password')).toBeVisible()
      })

      await step('Steps 6–8: type an email with no @, "short1" and "different1!"', async () => {
        await typeText(field(page, 'Email'), 'jamie.test3')
        await typeText(field(page, 'Password'), 'short1')
        await typeText(field(page, 'Confirm password'), 'different1!')
      })

      await step('Step 9: press "Create account"', async () => {
        await createButton(page).click()
      })

      await step('Step 10: the email, password and confirmation messages appear', async () => {
        await onRegistration(page)
        await expect(fieldError(page, 'email')).toHaveText('Enter a valid email address.')
        await expect(fieldError(page, 'password')).toHaveText('Use 12+ characters with letters, numbers & symbols.')
        await expect(fieldError(page, 'confirm_password')).toHaveText('Passwords must match.')
      })

      await step('Step 11: the strength line says Weak or Moderate, not Strong', async () => {
        await expect(strength(page)).toHaveText(/^Password strength: (Weak|Moderate)$/)
      })
    },

    4: async ({ page }) => {
      let existing

      await step('Before you start: the email is already registered (Test 1)', async () => {
        existing = await createAccount(page, NAME)
        await page.goto('#/login')
      })

      await step('Step 1: press "Create an account"', async () => {
        await page.getByRole('link', { name: 'Create an account' }).click()
      })

      await step('Step 2: enter the same details again', async () => {
        await typeText(field(page, 'Full name'), NAME)
        await typeText(field(page, 'Email'), existing.email)
        await typeText(field(page, 'Password'), PASSWORD)
        await typeText(field(page, 'Confirm password'), PASSWORD)
      })

      await step('Step 3: press "Create account"', async () => {
        await createButton(page).click()
      })

      await step('Step 4: both "already registered" messages appear', async () => {
        await onRegistration(page)
        await expect(page.getByRole('alert')).toHaveText('This email is already registered.')
        await expect(fieldError(page, 'email')).toHaveText('This email is already registered. Log in instead.')
      })

      await step('Step 5: press "Log in" at the bottom of the card', async () => {
        await page.locator('.account-link').getByRole('link', { name: 'Log in' }).click()
      })

      await step('Step 6: the "Log in to GymRank" card shows', async () => {
        await expect(page).toHaveURL(/#\/login$/)
        await expect(loginCard(page)).toBeVisible()
      })
    },

    5: async ({ page }) => {
      await step('Before you start: open the login screen', async () => {
        await page.goto('#/login')
      })

      await step('Step 1: press "Create an account"', async () => {
        await page.getByRole('link', { name: 'Create an account' }).click()
        await onRegistration(page)
      })

      await step('Step 2: press the "×" in the top-right corner', async () => {
        await expect(page.getByRole('link', { name: 'Close registration' })).toHaveText('×')
        await page.getByRole('link', { name: 'Close registration' }).click()
      })

      await step('Step 3: the "Log in to GymRank" card shows again', async () => {
        await expect(page).toHaveURL(/#\/login$/)
        await expect(loginCard(page)).toBeVisible()
      })
    },
  },
  // Test 5's "×" exists only at phone and tablet widths (under 850px), so it also runs on mobile.
  { mobile: [1, 5] },
)
