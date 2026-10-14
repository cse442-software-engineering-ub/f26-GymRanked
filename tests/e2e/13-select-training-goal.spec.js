import { expect } from '@playwright/test'
import { step } from './banner.js'
import { createAccountAndLogIn, logIn, logOut } from './helpers.js'
import { acceptanceTests } from './stories.js'

const GOALS = {
  Strength: 'Heavier sets, longer rests, focus on the big lifts.',
  'Fat loss': 'Shorter rests, more volume, calorie burn per session.',
  'Aerobic fitness': 'Higher reps, shorter rests, steady cardio blocks.',
}

const card = (page, label) =>
  page.locator('.ob-card').filter({ has: page.locator('.ob-card-label', { hasText: new RegExp(`^${label}$`) }) })
const saveGoal = (page) => page.getByRole('button', { name: 'Save goal' })
const preview = (page) => page.locator('.ob-profile')
const planImpact = (page) => page.locator('.ob-panel-text')
const currentStep = (page) => page.getByRole('navigation', { name: 'Setup progress' }).locator('[aria-current="step"]')

// Opens the goal page and waits until the saved goal (if any) has loaded.
async function openGoalPage(page) {
  await page.goto('#/goal')
  await expect(page.getByRole('heading', { name: 'Choose your training goal' })).toBeVisible()
  await expect(page.locator('.ob-step')).toHaveAttribute('aria-busy', 'false')
}

async function expectSelected(page, label) {
  for (const name of Object.keys(GOALS)) {
    const selected = name === label
    await expect(card(page, name)).toHaveAttribute('aria-pressed', String(selected))
    await expect(card(page, name).locator('.ob-card-state')).toHaveText(selected ? 'Selected' : 'Select')
  }
}

async function chooseAndSave(page, label) {
  await card(page, label).click()
  await saveGoal(page).click()
  await expect(page).toHaveURL(/#\/experience$/)
}

acceptanceTests(
  '13-select-training-goal.md',
  {
    1: async ({ page }) => {
      await step('Setup: create an account and log in', async () => {
        await createAccountAndLogIn(page, 'Goldie Tester')
      })

      await step('Step 1: the goal page shows three goals, an empty preview and a greyed-out "Save goal"', async () => {
        await openGoalPage(page)
        const progress = page.getByRole('navigation', { name: 'Setup progress' })
        await expect(progress.getByRole('listitem')).toHaveText(['Training goal', 'Experience', 'Equipment', 'Choose plan'])
        await expect(currentStep(page)).toHaveText('Training goal')
        await expect(page.getByText('This appears on your profile and shapes your training plan.')).toBeVisible()
        for (const [label, description] of Object.entries(GOALS)) {
          await expect(card(page, label).locator('.ob-card-description')).toHaveText(description)
        }
        await expectSelected(page, null)
        await expect(preview(page)).toContainText('GT')
        await expect(preview(page)).toContainText('Goldie Tester')
        await expect(preview(page)).toContainText('No goal yet')
        await expect(planImpact(page)).toHaveText('Pick a goal to see how it shapes your plan.')
        await expect(saveGoal(page)).toBeDisabled()
      })

      await step('Step 2: choosing "Fat loss" updates the preview and plan impact', async () => {
        await card(page, 'Fat loss').click()
        await expectSelected(page, 'Fat loss')
        await expect(preview(page).locator('.ob-tag')).toHaveText('Fat loss')
        await expect(planImpact(page)).toHaveText(GOALS['Fat loss'])
        await expect(saveGoal(page)).toBeEnabled()
      })

      await step('Step 3: choosing "Strength" replaces it', async () => {
        await card(page, 'Strength').click()
        await expectSelected(page, 'Strength')
        await expect(preview(page).locator('.ob-tag')).toHaveText('Strength')
        await expect(planImpact(page)).toHaveText(GOALS.Strength)
      })

      await step('Step 4: "Save goal" opens the experience step', async () => {
        await saveGoal(page).click()
        await expect(page).toHaveURL(/#\/experience$/)
        await expect(page.getByRole('heading', { name: 'How experienced are you?' })).toBeVisible()
        await expect(currentStep(page)).toHaveText('Experience')
      })
    },

    2: async ({ page }) => {
      let account

      await step('Setup: log in with "Strength" saved (where Acceptance Test 1 ends)', async () => {
        account = await createAccountAndLogIn(page, 'Goldie Tester')
        await openGoalPage(page)
        await chooseAndSave(page, 'Strength')
      })

      await step('Step 1: the goal page opens with "Strength" already selected', async () => {
        await openGoalPage(page)
        await expectSelected(page, 'Strength')
        await expect(preview(page).locator('.ob-tag')).toHaveText('Strength')
      })

      await step('Step 2: change it to "Aerobic fitness" and save', async () => {
        await chooseAndSave(page, 'Aerobic fitness')
      })

      await step('Step 3: after logging out and back in, "Aerobic fitness" is still selected', async () => {
        await logOut(page)
        await logIn(page, account)
        await openGoalPage(page)
        await expectSelected(page, 'Aerobic fitness')
      })

      await step('Step 4: a second account starts with no goal', async () => {
        await logOut(page)
        await createAccountAndLogIn(page, 'Goldie Second')
        await openGoalPage(page)
        await expectSelected(page, null)
        await expect(preview(page)).toContainText('No goal yet')
        await expect(saveGoal(page)).toBeDisabled()
      })
    },

    3: async ({ page }) => {
      await step('Step 1: logged out, the goal page sends you to log in', async () => {
        await page.goto('#/goal')
        await expect(page).toHaveURL(/#\/login$/)
        await expect(page.getByRole('heading', { name: 'Log in to GymRank' })).toBeVisible()
      })
    },
  },
  { mobile: [1] },
)
