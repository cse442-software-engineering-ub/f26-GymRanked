import { expect } from '@playwright/test'
import { step } from './banner.js'
import { createAccountAndLogIn, logIn, logOut } from './helpers.js'
import { acceptanceTests } from './stories.js'

const LEVELS = ['Beginner', 'Intermediate', 'Advanced']
const EQUIPMENT = [
  'Bodyweight only',
  'Dumbbells',
  'Barbell',
  'Kettlebells',
  'Resistance bands',
  'Cable machine',
  'Pull-up bar',
  'Full gym access',
]
const NOTHING_CHOSEN = 'Pick your experience and at least one equipment option to see how your plan will be built.'

const levelCard = (page, label) =>
  page.locator('.ob-card').filter({ has: page.locator('.ob-card-label', { hasText: new RegExp(`^${label}$`) }) })
const chip = (page, label) => page.locator('.ob-chip').filter({ hasText: new RegExp(`^${label}$`) })
const saveSetup = (page) => page.getByRole('button', { name: 'Save setup' })
const planImpact = (page) => page.locator('.ob-impact-text')
const currentStep = (page) => page.getByRole('navigation', { name: 'Setup progress' }).locator('[aria-current="step"]')

// Opens the setup page and waits until the saved setup (if any) has loaded.
async function openSetupPage(page) {
  await page.goto('#/setup')
  await expect(page.getByRole('heading', { name: 'Tell us about your training setup' })).toBeVisible()
  await expect(page.locator('.ob-step')).toHaveAttribute('aria-busy', 'false')
}

async function expectLevel(page, label) {
  for (const name of LEVELS) {
    await expect(levelCard(page, name)).toHaveAttribute('aria-pressed', String(name === label))
  }
}

async function expectEquipment(page, labels) {
  for (const name of EQUIPMENT) {
    await expect(chip(page, name)).toHaveAttribute('aria-pressed', String(labels.includes(name)))
  }
}

async function turnOffAllEquipment(page) {
  for (const name of EQUIPMENT) {
    if ((await chip(page, name).getAttribute('aria-pressed')) === 'true') await chip(page, name).click()
  }
}

acceptanceTests(
  '14-experience-and-equipment.md',
  {
    1: async ({ page }) => {
      await step('Setup: create an account and log in', async () => {
        await createAccountAndLogIn(page, 'Sam Setup')
      })

      await step('Step 1: the setup page shows the experience levels, equipment and a greyed-out "Save setup"', async () => {
        await openSetupPage(page)
        const progress = page.getByRole('navigation', { name: 'Setup progress' })
        await expect(progress.getByRole('listitem')).toHaveText(['Training goal', 'Experience', 'Choose plan'])
        await expect(currentStep(page)).toHaveText('Experience')
        await expect(
          page.getByText('This helps tailor your workout plan to your experience and available equipment.'),
        ).toBeVisible()
        await expect(page.getByRole('heading', { name: 'Training experience' })).toBeVisible()
        await expect(page.locator('.ob-card .ob-card-label')).toHaveText(LEVELS)
        await expect(page.getByRole('heading', { name: 'Available equipment' })).toBeVisible()
        await expect(page.locator('.ob-chip')).toHaveText(EQUIPMENT)
        await expectLevel(page, null)
        await expectEquipment(page, [])
        await expect(planImpact(page)).toHaveText(NOTHING_CHOSEN)
        await expect(saveSetup(page)).toBeDisabled()
      })

      await step('Step 2: an experience level alone is not enough to save', async () => {
        await levelCard(page, 'Intermediate').click()
        await expectLevel(page, 'Intermediate')
        await expect(levelCard(page, 'Intermediate').locator('.ob-card-state')).toHaveText('Selected')
        await expect(saveSetup(page)).toBeDisabled()
      })

      await step('Step 3: adding dumbbells and a barbell updates the plan impact', async () => {
        await chip(page, 'Dumbbells').click()
        await chip(page, 'Barbell').click()
        await expectEquipment(page, ['Dumbbells', 'Barbell'])
        await expect(planImpact(page)).toHaveText('Intermediate programming using dumbbells and barbell.')
        await expect(saveSetup(page)).toBeEnabled()
      })

      await step('Step 4: "Save setup" opens the workout plan library', async () => {
        await saveSetup(page).click()
        await expect(page).toHaveURL(/#\/plans$/)
        await expect(page.getByRole('heading', { name: 'Workout plan library' })).toBeVisible()
      })
    },

    2: async ({ page }) => {
      await step('Setup: log in and open the setup page', async () => {
        await createAccountAndLogIn(page, 'Sam Setup')
        await openSetupPage(page)
      })

      await step('Step 1: "Beginner" with no equipment cannot be saved', async () => {
        await levelCard(page, 'Beginner').click()
        await turnOffAllEquipment(page)
        await expect(saveSetup(page)).toBeDisabled()
        await expect(planImpact(page)).toHaveText(NOTHING_CHOSEN)
      })

      await step('Step 2: "Bodyweight only" turns dumbbells off', async () => {
        await chip(page, 'Dumbbells').click()
        await chip(page, 'Bodyweight only').click()
        await expectEquipment(page, ['Bodyweight only'])
        await expect(planImpact(page)).toHaveText('Beginner programming using bodyweight only.')
      })

      await step('Step 3: "Kettlebells" turns "Bodyweight only" off', async () => {
        await chip(page, 'Kettlebells').click()
        await expectEquipment(page, ['Kettlebells'])
        await expect(planImpact(page)).toHaveText('Beginner programming using kettlebells.')
      })

      await step('Step 4: with no equipment left, "Save setup" is greyed out again', async () => {
        await chip(page, 'Kettlebells').click()
        await expectEquipment(page, [])
        await expect(saveSetup(page)).toBeDisabled()
      })
    },

    3: async ({ page }) => {
      let account

      await step('Setup: log in and open the setup page', async () => {
        account = await createAccountAndLogIn(page, 'Sam Setup')
        await openSetupPage(page)
      })

      await step('Step 1: save "Advanced" with a pull-up bar and full gym access', async () => {
        await levelCard(page, 'Advanced').click()
        await turnOffAllEquipment(page)
        await chip(page, 'Pull-up bar').click()
        await chip(page, 'Full gym access').click()
        await saveSetup(page).click()
        await expect(page).toHaveURL(/#\/plans$/)
      })

      await step('Step 2: the setup page opens with those choices already selected', async () => {
        await openSetupPage(page)
        await expectLevel(page, 'Advanced')
        await expectEquipment(page, ['Pull-up bar', 'Full gym access'])
        await expect(planImpact(page)).toHaveText('Advanced programming using pull-up bar and full gym access.')
      })

      await step('Step 3: after logging out and back in, the choices are still there', async () => {
        await logOut(page)
        await logIn(page, account)
        await openSetupPage(page)
        await expectLevel(page, 'Advanced')
        await expectEquipment(page, ['Pull-up bar', 'Full gym access'])
      })

      await step('Step 4: a second account starts with nothing selected', async () => {
        await logOut(page)
        await createAccountAndLogIn(page, 'Sam Second')
        await openSetupPage(page)
        await expectLevel(page, null)
        await expectEquipment(page, [])
        await expect(saveSetup(page)).toBeDisabled()
      })
    },

    4: async ({ page }) => {
      await step('Step 1: logged out, the setup page sends you to log in', async () => {
        await page.goto('#/setup')
        await expect(page).toHaveURL(/#\/login$/)
        await expect(page.getByRole('heading', { name: 'Log in to GymRank' })).toBeVisible()
      })
    },
  },
  { mobile: [1] },
)
