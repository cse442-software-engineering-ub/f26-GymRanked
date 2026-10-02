import { expect } from '@playwright/test'
import { step } from './banner.js'
import { createAccount } from './helpers.js'
import { acceptanceTests } from './stories.js'

// The card uses Jamie Lee / jamie-a-1001@example.com. Each run uses a new address so it can be repeated.
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

const goalHeading = (page) => page.getByRole('heading', { name: 'Choose your training goal' })
const profilePreview = (page) =>
  page.locator('.ob-panel').filter({ has: page.getByRole('heading', { name: 'Profile preview' }) })

// Counts sign-up requests, so a test can check that no account was created.
function watchSignUps(page) {
  const requests = []
  page.on('request', (request) => {
    if (request.url().includes('api/register.php')) requests.push(request)
  })
  return requests
}

// Test 1: from the login screen to pressing "Create account" with the given details.
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

      await step('Setup: start logged out', async () => {
        // Every Playwright test starts in a fresh browser with no login.
        await page.goto('#/login')
        await expect(loginCard(page)).toBeVisible()
      })

      await step('Step 1: the login screen shows "Every rep gets a rank." and "Log in to GymRank"', async () => {
        await expect(page.locator('.hero h1')).toHaveText('Every rep gets a rank.')
        await expect(page.locator('.hero .accent')).toHaveText('rank.')
        await expect(loginCard(page)).toBeVisible()
      })

      await step('Step 2: "Create an account" opens the form with four boxes, the strength line and "Create account"', async () => {
        // On phones the "New to GymRank?" words are hidden by design and the link becomes a full-width button.
        await expect(page.locator('.login-panel .account-link')).toContainText('New to GymRank? Create an account')
        await page.getByRole('link', { name: 'Create an account' }).click()
        await onRegistration(page)
        await expect(page.getByText("Let's set up your training profile.")).toBeVisible()
        await expect(page.locator('.form-field label')).toHaveText(['Full name', 'Email', 'Password', 'Confirm password'])
        await expect(strength(page)).toHaveText('Password strength: Not entered')
        await expect(page.getByRole('meter', { name: 'Password strength' })).toBeVisible()
        await expect(page.getByText('Use 12+ characters with letters, numbers & symbols.')).toBeVisible()
        await expect(createButton(page)).toBeVisible()
        await expect(page.locator('.account-link')).toHaveText('Already have an account? Log in')
      })

      await step('Step 3: type "Jamie Lee" and the email', async () => {
        await typeText(field(page, 'Full name'), NAME)
        await typeText(field(page, 'Email'), email)
      })

      await step('Step 4: type the password; the strength line says "Password strength: Strong"', async () => {
        await typeText(field(page, 'Password'), PASSWORD)
        await expect(strength(page)).toHaveText('Password strength: Strong')
      })

      await step('Step 5: confirm the password and press "Create account"; "Choose your training goal" opens', async () => {
        await typeText(field(page, 'Confirm password'), PASSWORD)
        await createButton(page).click()
        await expect(page).toHaveURL(/#\/goal$/)
        await expect(goalHeading(page)).toBeVisible()
        const progress = page.getByRole('navigation', { name: 'Setup progress' })
        await expect(progress.getByRole('listitem')).toHaveText(['Training goal', 'Experience', 'Choose plan'])
        await expect(progress.locator('[aria-current="step"]')).toHaveText('Training goal')
        await expect(profilePreview(page).locator('.ob-avatar')).toHaveText('JL')
        await expect(profilePreview(page).locator('.ob-profile-name')).toHaveText(NAME)
        await expect(profilePreview(page).locator('.ob-tag')).toHaveText('No goal yet')
      })
    },

    2: async ({ page }) => {
      const email = newEmail()

      await step('Setup: do Test 1, so you are on "Choose your training goal" as Jamie Lee', async () => {
        await registerThroughForm(page, email)
        await expect(goalHeading(page)).toBeVisible()
        await expect(profilePreview(page).locator('.ob-profile-name')).toHaveText(NAME)
      })

      await step('Step 1: the "GymRank" logo opens the Dashboard', async () => {
        await page.getByRole('link', { name: 'GymRank dashboard' }).click()
        await expect(page).toHaveURL(/#\/dashboard$/)
        await expect(page.getByRole('heading', { level: 1 })).toContainText("Let's move weight,")
      })

      await step('Step 2: "Log out" in the account menu shows the "Log in to GymRank" card', async () => {
        await page.getByRole('button', { name: 'Open account menu' }).click()
        await page.getByRole('menuitem', { name: 'Log out' }).click()
        await expect(loginCard(page)).toBeVisible()
      })

      await step('Step 3: log in again; the Dashboard greets "Let\'s move weight, Jamie."', async () => {
        await typeText(field(page, 'Email'), email)
        await typeText(field(page, 'Password'), PASSWORD)
        await page.getByRole('button', { name: 'Log in', exact: true }).click()
        await expect(page).toHaveURL(/#\/dashboard$/)
        await expect(page.getByRole('heading', { level: 1 })).toHaveText("Let's move weight, Jamie.")
        await expect(page.getByText('Invalid email or password.')).toHaveCount(0)
      })
    },

    3: async ({ page }) => {
      const signUps = watchSignUps(page)

      await step('Setup: start logged out', async () => {
        await page.goto('#/login')
      })

      await step('Step 1: "Create an account" opens "Create your account"', async () => {
        await page.getByRole('link', { name: 'Create an account' }).click()
        await onRegistration(page)
      })

      await step('Step 2: with every box empty, "Create account" shows three red messages and outlines', async () => {
        await createButton(page).click()
        await onRegistration(page)
        await expect(fieldError(page, 'full_name')).toHaveText('Enter your full name.')
        await expect(fieldError(page, 'email')).toHaveText('Enter a valid email address.')
        await expect(fieldError(page, 'password')).toHaveText('Use 12+ characters with letters, numbers & symbols.')
        for (const label of ['Full name', 'Email', 'Password']) {
          await expect(field(page, label)).toHaveAttribute('aria-invalid', 'true')
          await expect(field(page, label).locator('..')).toHaveClass(/invalid/)
        }
      })

      await step('Step 3: typing "Jamie Lee" clears only the Full name message', async () => {
        await typeText(field(page, 'Full name'), NAME)
        await expect(fieldError(page, 'full_name')).toHaveCount(0)
        await expect(fieldError(page, 'email')).toBeVisible()
        await expect(fieldError(page, 'password')).toBeVisible()
      })

      await step('Step 4: type an email with no @, "short1" and "different1!"; strength is Weak or Moderate', async () => {
        await typeText(field(page, 'Email'), 'jamie.test3')
        await typeText(field(page, 'Password'), 'short1')
        await typeText(field(page, 'Confirm password'), 'different1!')
        await expect(strength(page)).toHaveText(/^Password strength: (Weak|Moderate)$/)
      })

      await step('Step 5: "Create account" shows the email, password and confirmation messages', async () => {
        await createButton(page).click()
        await onRegistration(page)
        await expect(fieldError(page, 'email')).toHaveText('Enter a valid email address.')
        await expect(fieldError(page, 'password')).toHaveText('Use 12+ characters with letters, numbers & symbols.')
        await expect(fieldError(page, 'confirm_password')).toHaveText('Passwords must match.')
      })

      await step('Step 6: "Choose your training goal" never opened and no account was created', async () => {
        await onRegistration(page)
        await expect(goalHeading(page)).toHaveCount(0)
        expect(signUps, 'the form sent a sign-up request').toHaveLength(0)
      })
    },

    4: async ({ page }) => {
      let existing

      await step('Setup: the email is already registered (Test 1) and you are logged out', async () => {
        // Creating the account through the API doesn't log in, so the browser stays logged out.
        existing = await createAccount(page, NAME)
      })

      await step('Step 1: open the login screen and press "Create an account"', async () => {
        await page.goto('#/login')
        await page.getByRole('link', { name: 'Create an account' }).click()
        await onRegistration(page)
      })

      await step('Step 2: enter the same details again', async () => {
        await typeText(field(page, 'Full name'), NAME)
        await typeText(field(page, 'Email'), existing.email)
        await typeText(field(page, 'Password'), PASSWORD)
        await typeText(field(page, 'Confirm password'), PASSWORD)
      })

      await step('Step 3: "Create account" shows both "already registered" messages', async () => {
        await createButton(page).click()
        await onRegistration(page)
        await expect(page.getByRole('alert')).toHaveText('This email is already registered.')
        await expect(fieldError(page, 'email')).toHaveText('This email is already registered. Log in instead.')
      })

      await step('Step 4: "Log in" at the bottom of the card shows the "Log in to GymRank" card', async () => {
        await page.locator('.account-link').getByRole('link', { name: 'Log in' }).click()
        await expect(page).toHaveURL(/#\/login$/)
        await expect(loginCard(page)).toBeVisible()
      })
    },

    5: async ({ page }, testInfo) => {
      const signUps = watchSignUps(page)
      const close = page.getByRole('link', { name: 'Close registration' })

      await step('Setup: start logged out', async () => {
        await page.goto('#/login')
      })

      await step('Step 1: open the login screen and press "Create an account"', async () => {
        await page.getByRole('link', { name: 'Create an account' }).click()
        await onRegistration(page)
      })

      // Step 2 is for computers and step 3 for phones, so each screen size runs one of them.
      if (testInfo.project.name === 'desktop') {
        await step('Step 2: on a computer, "Log in" at the bottom of the card returns to "Log in to GymRank"', async () => {
          await expect(close).toBeHidden()
          await page.locator('.account-link').getByRole('link', { name: 'Log in' }).click()
          await expect(page).toHaveURL(/#\/login$/)
          await expect(loginCard(page)).toBeVisible()
          expect(signUps, 'a sign-up request was sent').toHaveLength(0)
        })
      } else {
        await step('Step 3: on a phone, the "×" in the top-right corner returns to "Log in to GymRank"', async () => {
          await expect(close).toHaveText('×')
          await close.click()
          await expect(page).toHaveURL(/#\/login$/)
          await expect(loginCard(page)).toBeVisible()
          expect(signUps, 'a sign-up request was sent').toHaveLength(0)
        })
      }
    },
  },
  // Test 5's "×" exists only at 850px wide or narrower, so Test 5 also runs on mobile (its step 3).
  { mobile: [1, 5] },
)
