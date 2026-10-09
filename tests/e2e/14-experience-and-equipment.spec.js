import { expect } from '@playwright/test'
import { step } from './banner.js'
import { createAccountAndLogIn, logIn } from './helpers.js'
import { acceptanceTests } from './stories.js'

const LEVELS = ['Beginner', 'Intermediate', 'Advanced']
const LEVEL_DESCRIPTIONS = [
  'New to structured training, or under 6 months in.',
  'Consistent training for 6 months to 3 years.',
  '3+ years training, comfortable pushing intensity.',
]
const TILES = ['Dumbbells', 'Barbell', 'Kettlebells', 'Resistance bands', 'Cable machine', 'Pull-up bar', 'Full gym access']
const EQUIPMENT = ['Bodyweight only', ...TILES]
const NOTHING_CHOSEN = 'Pick your experience and at least one equipment option to see how your plan will be built.'

const levelCard = (page, label) =>
  page.locator('.ob-card').filter({ has: page.locator('.ob-card-label', { hasText: new RegExp(`^${label}$`) }) })
// "Bodyweight only" is the wide option above the tiles; the rest are tiles.
const equipment = (page, label) =>
  label === 'Bodyweight only'
    ? page.locator('.ob-option')
    : page.locator('.ob-tile').filter({ has: page.locator('.ob-tile-label', { hasText: new RegExp(`^${label}$`) }) })
const saveAndContinue = (page) => page.getByRole('button', { name: 'Save and continue' })
const planImpact = (page) => page.locator('.ob-panel-text')
const progress = (page) => page.getByRole('navigation', { name: 'Setup progress' })
const currentStep = (page) => progress(page).locator('[aria-current="step"]')

// Waits until a page's heading shows and its saved choices (if any) have loaded.
async function expectStep(page, path, heading) {
  await expect(page).toHaveURL(new RegExp(`#/${path}$`))
  await expect(page.getByRole('heading', { name: heading })).toBeVisible()
  await expect(page.locator('.ob-step')).toHaveAttribute('aria-busy', 'false')
}

const expectExperiencePage = (page) => expectStep(page, 'experience', 'How experienced are you?')
const expectEquipmentPage = (page) => expectStep(page, 'equipment', 'What equipment can you use?')
const expectPlansPage = (page) => expectStep(page, 'recommended', 'Choose your workout plan')

async function expectLevel(page, label) {
  for (const name of LEVELS) {
    await expect(levelCard(page, name)).toHaveAttribute('aria-pressed', String(name === label))
  }
}

async function expectEquipment(page, labels) {
  for (const name of EQUIPMENT) {
    await expect(equipment(page, name)).toHaveAttribute('aria-pressed', String(labels.includes(name)))
  }
}

// The setup steps every test shares: a new account, logged in, with "Strength" saved on the goal page.
// With `level`, also saves that experience, so the test starts on the equipment page.
async function setUpAccount(page, fullName, level) {
  const account = await createAccountAndLogIn(page, fullName)
  await expectStep(page, 'goal', 'Choose your training goal')
  await page.getByRole('button', { name: /^Strength/ }).click()
  await page.getByRole('button', { name: 'Save goal' }).click()
  await expectExperiencePage(page)
  if (level) {
    await levelCard(page, level).click()
    await saveAndContinue(page).click()
    await expectEquipmentPage(page)
  }
  return account
}

acceptanceTests(
  '14-experience-and-equipment.md',
  {
    1: async ({ page }) => {
      await step('Setup: create an account, log in and save "Strength" as the goal', async () => {
        await setUpAccount(page, 'Sam Setup')
      })

      await step('Step 1: the experience page shows three levels and a greyed-out "Save and continue"', async () => {
        await expect(progress(page).getByRole('listitem')).toHaveText(['Training goal', 'Experience', 'Equipment', 'Choose plan'])
        await expect(currentStep(page)).toHaveText('Experience')
        await expect(page.locator('.ob-page').getByRole('button', { name: 'Log out' })).toBeVisible()
        await expect(page.getByRole('link', { name: 'Back to training goal' })).toBeVisible()
        await expect(page.getByText('We use this to set your starting weights and weekly volume.')).toBeVisible()
        await expect(page.locator('.ob-card .ob-card-label')).toHaveText(LEVELS)
        await expect(page.locator('.ob-card .ob-card-description')).toHaveText(LEVEL_DESCRIPTIONS)
        await expectLevel(page, null)
        await expect(page.locator('.ob-card .ob-card-state')).toHaveText(['Select', 'Select', 'Select'])
        await expect(saveAndContinue(page)).toBeDisabled()
        await expect(page.getByText('Pick your experience level to continue.')).toBeVisible()
      })

      await step('Step 2: choosing "Intermediate" selects it and enables "Save and continue"', async () => {
        await levelCard(page, 'Intermediate').click()
        await expectLevel(page, 'Intermediate')
        await expect(levelCard(page, 'Intermediate').locator('.ob-card-state')).toHaveText('Selected')
        await expect(saveAndContinue(page)).toBeEnabled()
        await expect(page.getByText('Pick your experience level to continue.')).toHaveCount(0)
      })

      await step('Step 3: "Save and continue" opens the equipment page with nothing chosen', async () => {
        await saveAndContinue(page).click()
        await expectEquipmentPage(page)
        await expect(currentStep(page)).toHaveText('Equipment')
        await expect(page.getByRole('link', { name: 'Back to experience' })).toBeVisible()
        await expect(page.getByText('Pick everything you can get to. You can change this any time.')).toBeVisible()
        await expect(equipment(page, 'Bodyweight only')).toContainText('No equipment. Picking this turns the others off.')
        await expect(page.getByText('or pick what you have')).toBeVisible()
        await expect(page.locator('.ob-tile .ob-tile-label')).toHaveText(TILES)
        await expect(page.locator('.ob-tile svg').first()).toBeVisible()
        await expectEquipment(page, [])
        await expect(planImpact(page)).toHaveText(NOTHING_CHOSEN)
        await expect(saveAndContinue(page)).toBeDisabled()
        await expect(page.getByText('Pick at least one option, or Bodyweight only.')).toBeVisible()
      })

      await step('Step 4: adding dumbbells and a barbell updates the plan impact', async () => {
        await equipment(page, 'Dumbbells').click()
        await equipment(page, 'Barbell').click()
        await expectEquipment(page, ['Dumbbells', 'Barbell'])
        await expect(planImpact(page)).toHaveText('Intermediate programming using dumbbells and barbell.')
        await expect(saveAndContinue(page)).toBeEnabled()
      })

      await step('Step 5: "Save and continue" opens "Choose your workout plan" while still logged in', async () => {
        await saveAndContinue(page).click()
        await expectPlansPage(page)
        await expect(currentStep(page)).toHaveText('Choose plan')
        await expect(page.locator('.ob-page').getByRole('button', { name: 'Log out' })).toBeVisible()
      })
    },

    2: async ({ page }) => {
      await step('Setup: create an account and save "Strength" and "Beginner"', async () => {
        await setUpAccount(page, 'Sam Bodyweight', 'Beginner')
      })

      await step('Step 1: with no equipment, "Save and continue" is greyed out', async () => {
        await expectEquipment(page, [])
        await expect(saveAndContinue(page)).toBeDisabled()
        await expect(planImpact(page)).toHaveText(NOTHING_CHOSEN)
      })

      await step('Step 2: "Bodyweight only" turns dumbbells off', async () => {
        await equipment(page, 'Dumbbells').click()
        await equipment(page, 'Bodyweight only').click()
        await expectEquipment(page, ['Bodyweight only'])
        await expect(planImpact(page)).toHaveText('Beginner programming using bodyweight only.')
      })

      await step('Step 3: "Kettlebells" turns "Bodyweight only" off', async () => {
        await equipment(page, 'Kettlebells').click()
        await expectEquipment(page, ['Kettlebells'])
        await expect(planImpact(page)).toHaveText('Beginner programming using kettlebells.')
      })

      await step('Steps 4-5: with no equipment left, "Save and continue" is greyed out again', async () => {
        await equipment(page, 'Kettlebells').click()
        await expectEquipment(page, [])
        await expect(saveAndContinue(page)).toBeDisabled()
      })
    },

    3: async ({ page }) => {
      let account

      await step('Setup: create an account and save "Strength" and "Advanced"', async () => {
        account = await setUpAccount(page, 'Sam Saved', 'Advanced')
      })

      await step('Step 1: save a pull-up bar and full gym access', async () => {
        await equipment(page, 'Pull-up bar').click()
        await equipment(page, 'Full gym access').click()
        await expect(planImpact(page)).toHaveText('Advanced programming using pull-up bar and full gym access.')
        await saveAndContinue(page).click()
        await expectPlansPage(page)
      })

      await step('Step 2: the experience and equipment pages show the saved choices', async () => {
        await page.goto('#/experience')
        await expectExperiencePage(page)
        await expectLevel(page, 'Advanced')
        await progress(page).getByRole('link', { name: 'Equipment' }).click()
        await expectEquipmentPage(page)
        await expectEquipment(page, ['Pull-up bar', 'Full gym access'])
        await expect(planImpact(page)).toHaveText('Advanced programming using pull-up bar and full gym access.')
      })

      await step('Step 3: "Log out" shows "You are logged out."', async () => {
        await page.locator('.ob-page').getByRole('button', { name: 'Log out' }).click()
        await expect(page).toHaveURL(/#\/login$/)
        await expect(page.getByText('You are logged out.')).toBeVisible()
      })

      await step('Step 4: after logging back in, the choices are still there', async () => {
        await logIn(page, account)
        await expect(page).toHaveURL(/#\/dashboard$/)
        await page.goto('#/equipment')
        await expectEquipmentPage(page)
        await expectEquipment(page, ['Pull-up bar', 'Full gym access'])
        await page.getByRole('link', { name: 'Back to experience' }).click()
        await expectExperiencePage(page)
        await expectLevel(page, 'Advanced')
      })

      await step('Steps 5-7: a second account starts with nothing selected', async () => {
        await page.locator('.ob-page').getByRole('button', { name: 'Log out' }).click()
        await expect(page.getByText('You are logged out.')).toBeVisible()
        await setUpAccount(page, 'Sam Second')
        await expectLevel(page, null)
        await expect(page.locator('.ob-card .ob-card-state')).toHaveText(['Select', 'Select', 'Select'])
        await expect(saveAndContinue(page)).toBeDisabled()
      })
    },

    4: async ({ page }) => {
      await step('Steps 1-2: logged out, the experience page sends you to log in', async () => {
        await page.goto('#/experience')
        await expect(page).toHaveURL(/#\/login$/)
        await expect(page.getByRole('heading', { name: 'Log in to GymRank' })).toBeVisible()
        await expect(page.getByText('How experienced are you?')).toHaveCount(0)
      })

      await step('Step 3: so does the equipment page', async () => {
        await page.goto('#/equipment')
        await expect(page).toHaveURL(/#\/login$/)
        await expect(page.getByRole('heading', { name: 'Log in to GymRank' })).toBeVisible()
        await expect(page.getByText('What equipment can you use?')).toHaveCount(0)
      })
    },

    5: async ({ page }) => {
      await step('Setup: create an account and save "Strength" and "Beginner"', async () => {
        await setUpAccount(page, 'Sam Change', 'Beginner')
      })

      await step('Step 1: save dumbbells and kettlebells', async () => {
        await equipment(page, 'Dumbbells').click()
        await equipment(page, 'Kettlebells').click()
        await expect(planImpact(page)).toHaveText('Beginner programming using dumbbells and kettlebells.')
        await saveAndContinue(page).click()
        await expectPlansPage(page)
      })

      await step('Step 2: changing only the experience to "Advanced" keeps the equipment', async () => {
        await page.goto('#/experience')
        await expectExperiencePage(page)
        await expectLevel(page, 'Beginner')
        await levelCard(page, 'Advanced').click()
        await saveAndContinue(page).click()
        await expectEquipmentPage(page)
        await expectEquipment(page, ['Dumbbells', 'Kettlebells'])
        await expect(planImpact(page)).toHaveText('Advanced programming using dumbbells and kettlebells.')
      })

      await step('Step 3: changing only the equipment saves barbell and kettlebells', async () => {
        await equipment(page, 'Dumbbells').click()
        await equipment(page, 'Barbell').click()
        await expect(planImpact(page)).toHaveText('Advanced programming using barbell and kettlebells.')
        await saveAndContinue(page).click()
        await expectPlansPage(page)
      })

      await step('Step 4: "Advanced" is still saved, with barbell and kettlebells', async () => {
        await page.goto('#/experience')
        await expectExperiencePage(page)
        await expectLevel(page, 'Advanced')
        await progress(page).getByRole('link', { name: 'Equipment' }).click()
        await expectEquipmentPage(page)
        await expectEquipment(page, ['Barbell', 'Kettlebells'])
      })

      await step('Step 5: an unsaved change disappears when the page is reloaded', async () => {
        await equipment(page, 'Barbell').click()
        await equipment(page, 'Kettlebells').click()
        await expectEquipment(page, [])
        await expect(saveAndContinue(page)).toBeDisabled()
        await page.reload()
        await expectEquipmentPage(page)
        await expectEquipment(page, ['Barbell', 'Kettlebells'])
      })
    },
  },
  { mobile: [1] },
)
