import { expect, test } from '@playwright/test'
import { step } from './banner.js'
import { resetLocalCounters } from './global-setup.js'
import { createAccountAndLogIn, logIn, logOut } from './helpers.js'
import { acceptanceTests } from './stories.js'

// Story 8 uses seeded accounts: Marcus Malone and Dana Lee from database/seeds/exercise_progress.sql (#109), and
// Taylor Reed from database/seeds/exercise_progress_ranges.sql, whose workouts are dated from the day it was loaded.
// Login allows 10 attempts per email every 15 minutes, so tests that don't test logging in reuse one session per
// account. Local runs also clear these accounts' counters in global-setup.js; against cattle (E2E_BASE_URL), wait
// 15 minutes between runs.
const MARCUS = { email: 'marcus.malone@example.com', password: 'Marcus-Bench225!', seed: 'exercise_progress.sql' }
const DANA = { email: 'dana.lee@example.com', password: 'Dana-Squat315!', seed: 'exercise_progress.sql' }
const TAYLOR = { email: 'taylor.reed@example.com', password: 'Taylor-Lift265!', seed: 'exercise_progress_ranges.sql' }
const sessions = {}

// A full run logs in about 53 times, over the API's 50 per IP address every 15 minutes, so local runs reset this
// machine's counters again here, as global-setup.js does at the start. Against cattle, run stories separately.
test.beforeAll(() => {
  if (!process.env.E2E_BASE_URL) resetLocalCounters()
})

const MARCUS_TOTALS = ['21,420 lb', '+16.7%', '9', '7']
const WEIGHTED = ['Heaviest weight', 'Latest estimated 1RM', 'Strength change', 'Workouts', 'Volume', 'New PRs']
const BODYWEIGHT = ['Most reps', 'Total reps', 'Workouts', 'New PRs']

const main = (page) => page.locator('main')
const picker = (page) => main(page).getByLabel('Exercise')
const rangeButton = (page, label) => main(page).getByRole('group', { name: 'Time range' }).getByRole('button', { name: label, exact: true })
const tableRows = (page) => main(page).locator('.progress-table tbody tr')
const fitsWidth = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)

async function logInAs(page, account) {
  try {
    await logIn(page, account)
  } catch (error) {
    if (await page.getByText('Invalid email or password.').isVisible()) {
      throw new Error(`${account.email} is not in this database. Load database/seeds/${account.seed} (see database/seeds/README.md).`)
    }
    throw error
  }
  sessions[account.email] = await page.context().cookies()
}

// Signs in with the account's saved session when it still works, else logs in through the login page.
async function as(page, account) {
  if (sessions[account.email]) {
    await page.context().addCookies(sessions[account.email])
    if ((await page.request.get('api/session.php')).ok()) {
      await page.goto('#/dashboard')
      await expect(page).toHaveURL(/#\/dashboard$/)
      return
    }
  }
  await logInAs(page, account)
}

// "Select Progress": the top navigation on a computer, the menu (three lines) on a phone.
async function openProgress(page) {
  const menu = page.getByRole('button', { name: 'Open navigation menu' })
  const topLink = page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Progress' })
  // isVisible() doesn't wait, so wait until the navigation has drawn one of the two before choosing.
  await menu.or(topLink).filter({ visible: true }).waitFor()
  if (await menu.isVisible()) {
    await menu.click()
    await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('link', { name: 'Progress' }).click()
  } else {
    await topLink.click()
  }
  await expect(page).toHaveURL(/#\/progress$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Your progress' })).toBeVisible()
}

async function expectTotals(page, values) {
  await expect(main(page).locator('.progress-metric__label')).toHaveText(['Volume', 'Strength gain', 'New PRs', 'Workouts logged'])
  await expect(main(page).locator('.progress-metric__value')).toHaveText(values)
}

// The chosen exercise's metric labels and values, in order. A hint (e.g. "Needs 2 workouts in this range") is checked
// separately.
async function expectExercise(page, name, labels, values) {
  await expect(main(page).getByRole('heading', { level: 2, name, exact: true })).toBeVisible()
  await expect(main(page).locator('.progress-exercise__metric dt')).toHaveText(labels)
  await expect(main(page).locator('.progress-exercise__metric dd:not(.progress-exercise__hint)')).toHaveText(values)
}

const cells = (row) => row.locator('td')

async function expectRecords(page, records) {
  await expect(main(page).locator('.progress-records li')).toHaveText(records.map(([date, best]) => `${date}${best}`))
}

// Story #8 test 5's setup, as in story #9's spec: Strength, Beginner, Full gym access, then Beginner Fundamentals.
async function finishOnboarding(page) {
  for (const [heading, choice, save] of [
    ['Choose your training goal', /^Strength/, 'Save goal'],
    ['How experienced are you?', /^Beginner/, 'Save and continue'],
    ['What equipment can you use?', 'Full gym access', 'Save and continue'],
  ]) {
    await expect(page.getByRole('heading', { name: heading })).toBeVisible()
    await expect(page.locator('.ob-step')).toHaveAttribute('aria-busy', 'false')
    await page.getByRole('button', { name: choice }).click()
    await page.getByRole('button', { name: save }).click()
  }
  await expect(page.getByRole('heading', { name: 'Choose your workout plan' })).toBeVisible()
  const plan = page.locator('.ob-plan').filter({ has: page.getByText('Beginner Fundamentals', { exact: true }) })
  await plan.getByRole('button', { name: 'Choose plan' }).click()
  await expect(page).toHaveURL(/#\/dashboard$/)
}

acceptanceTests('8-exercise-progress.md', {
  1: async ({ page }) => {
    await step('Setup: log in as Marcus', () => as(page, MARCUS))
    await step('Step 1: Progress opens Your progress with All time selected', async () => {
      await openProgress(page)
      await expect(page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Progress' })).toHaveClass(/nav-bar__link--current/)
      await expect(main(page).getByText('Marcus Malone · All time', { exact: true })).toBeVisible()
      await expect(rangeButton(page, 'All time')).toHaveAttribute('aria-pressed', 'true')
      await expect(rangeButton(page, '30 days')).toHaveAttribute('aria-pressed', 'false')
      await expect(rangeButton(page, '90 days')).toHaveAttribute('aria-pressed', 'false')
    })
    await step('Step 2: the four totals', () => expectTotals(page, MARCUS_TOTALS))
    await step('Step 3: the Exercise list offers Back squat, Bench press and Pull-up', async () => {
      await expect(picker(page).locator('option')).toHaveText(['Back squat', 'Bench press', 'Pull-up'])
      await expect(picker(page)).toHaveValue('Back squat')
    })
    await step('Step 4: Back squat’s numbers and a seven-point chart', async () => {
      await expectExercise(page, 'Back squat', WEIGHTED, ['260 lb', '300 lb', '+36 lb (+13.6%)', '7', '9,240 lb', '4'])
      await expect(main(page).locator('.progress-chart circle')).toHaveCount(7)
    })
    await step('Step 5: seven workouts, newest first, without the unfinished October 5 one', async () => {
      await expect(tableRows(page)).toHaveCount(7)
      await expect(cells(tableRows(page).first())).toHaveText(['October 14, 2026', '250 lb × 6', '300 lb', '1,500 lb'])
      await expect(cells(tableRows(page).last())).toHaveText(['August 31, 2026', '220 lb × 6', '264 lb', '1,320 lb'])
      await expect(main(page)).not.toContainText('October 5, 2026')
    })
    await step('Step 6: Back squat’s personal records', () => expectRecords(page, [
      ['October 9, 2026', '260 lb × 3'],
      ['September 21, 2026', '250 lb × 3'],
      ['September 9, 2026', '240 lb × 6'],
      ['September 2, 2026', '230 lb × 3'],
    ]))
  },

  2: async ({ page }) => {
    await step('Setup: log in as Marcus and open Progress', async () => {
      await as(page, MARCUS)
      await openProgress(page)
      await expect(picker(page)).toHaveValue('Back squat')
    })
    await step('Step 1: Bench press changes the section, not the totals', async () => {
      await picker(page).selectOption('Bench press')
      await expectExercise(page, 'Bench press', WEIGHTED, ['220 lb', '260 lb', '+44 lb (+20.4%)', '7', '12,180 lb', '4'])
      await expect(main(page).locator('.progress-metric__value')).toHaveText(MARCUS_TOTALS)
    })
    await step('Step 2: Bench press’s workouts', async () => {
      await expect(tableRows(page)).toHaveCount(7)
      await expect(cells(tableRows(page).first())).toHaveText(['October 14, 2026', '200 lb × 9', '260 lb', '1,800 lb'])
      await expect(cells(tableRows(page).filter({ hasText: 'September 2, 2026' }))).toHaveText(['September 2, 2026', '190 lb × 6', '234 lb', '2,760 lb'])
    })
    await step('Step 3: Bench press’s personal records', () => expectRecords(page, [
      ['October 9, 2026', '220 lb × 3'],
      ['September 30, 2026', '210 lb × 3'],
      ['September 21, 2026', '200 lb × 6'],
      ['September 2, 2026', '190 lb × 6'],
    ]))
    await step('Step 4: Pull-up is counted in reps', async () => {
      await picker(page).selectOption('Pull-up')
      await expect(main(page).getByText('Bodyweight exercise: progress is counted in reps.', { exact: true })).toBeVisible()
      await expectExercise(page, 'Pull-up', BODYWEIGHT, ['10 reps', '33', '3', '1'])
    })
    await step('Step 5: Pull-up’s three workouts and one record', async () => {
      await expect(tableRows(page)).toHaveCount(3)
      await expect(tableRows(page).locator('td:nth-child(2)')).toHaveText(['Bodyweight × 9', 'Bodyweight × 10', 'Bodyweight × 8'])
      await expect(tableRows(page).locator('td:first-child')).toHaveText(['September 30, 2026', 'September 21, 2026', 'September 2, 2026'])
      await expectRecords(page, [['September 21, 2026', 'Bodyweight × 10']])
    })
  },

  3: async ({ page }) => {
    await step('Setup: log in as Taylor', () => as(page, TAYLOR))
    await step('Step 1: All time has three Deadlift workouts', async () => {
      await openProgress(page)
      await expect(main(page).getByText('Taylor Reed · All time', { exact: true })).toBeVisible()
      await expectTotals(page, ['3,675 lb', '+17.8%', '2', '3'])
      await expect(picker(page)).toHaveValue('Deadlift')
      await expect(main(page).locator('.progress-exercise__metric').filter({ hasText: 'Strength change' }).locator('dd').first()).toHaveText('+46.7 lb (+17.8%)')
      await expect(tableRows(page)).toHaveCount(3)
    })
    await step('Step 2: 90 days has two', async () => {
      await rangeButton(page, '90 days').click()
      await expect(main(page).getByText('Taylor Reed · Last 90 days', { exact: true })).toBeVisible()
      await expectTotals(page, ['2,550 lb', '+8.2%', '2', '2'])
      await expectExercise(page, 'Deadlift', WEIGHTED, ['265 lb', '309.2 lb', '+23.4 lb (+8.2%)', '2', '2,550 lb', '2'])
      await expect(tableRows(page)).toHaveCount(2)
    })
    await step('Step 3: 30 days has one, and no strength change', async () => {
      await rangeButton(page, '30 days').click()
      await expect(main(page).getByText('Taylor Reed · Last 30 days', { exact: true })).toBeVisible()
      await expectTotals(page, ['1,325 lb', '—', '1', '1'])
      await expectExercise(page, 'Deadlift', WEIGHTED, ['265 lb', '309.2 lb', '—', '1', '1,325 lb', '1'])
      await expect(main(page).locator('.progress-exercise__hint')).toHaveText('Needs 2 workouts in this range')
      await expect(tableRows(page)).toHaveCount(1)
      await expect(tableRows(page).locator('td:nth-child(2)')).toHaveText('265 lb × 5')
    })
    await step('Step 4: All time returns', async () => {
      await rangeButton(page, 'All time').click()
      await expectTotals(page, ['3,675 lb', '+17.8%', '2', '3'])
      await expect(tableRows(page)).toHaveCount(3)
    })
  },

  4: async ({ page }) => {
    await step('Setup: log in as Marcus and open Progress', async () => {
      await as(page, MARCUS)
      await openProgress(page)
      await expectTotals(page, MARCUS_TOTALS)
    })
    await step('Step 1: refreshing shows the same totals and Back squat', async () => {
      await page.reload()
      await expect(main(page).getByText('Marcus Malone · All time', { exact: true })).toBeVisible()
      await expectTotals(page, MARCUS_TOTALS)
      await expect(picker(page)).toHaveValue('Back squat')
    })
    await step('Step 2: log out from the account menu', async () => {
      await page.getByRole('button', { name: 'Open account menu' }).click()
      await page.getByRole('menuitem', { name: 'Log out' }).click()
      await expect(page.getByText('You are logged out.')).toBeVisible()
    })
    await step('Step 3: logging back in shows the same progress', async () => {
      await logInAs(page, MARCUS)
      await openProgress(page)
      await expectTotals(page, MARCUS_TOTALS)
      await picker(page).selectOption('Pull-up')
      await expect(main(page).locator('.progress-exercise__metric').filter({ hasText: 'Most reps' }).locator('dd')).toHaveText('10 reps')
    })
  },

  5: async ({ page }) => {
    await step('Step 1: Dana sees only her own numbers', async () => {
      await as(page, DANA)
      await openProgress(page)
      await expectTotals(page, ['3,930 lb', '-2.2%', '1', '2'])
      await expect(picker(page).locator('option')).toHaveText(['Back squat', 'Bench press'])
      await expect(main(page).locator('.progress-exercise__metric').filter({ hasText: 'Heaviest weight' }).locator('dd')).toHaveText('320 lb')
      await expect(main(page).locator('.progress-exercise__metric').filter({ hasText: 'Strength change' }).locator('dd').first()).toHaveText('-8 lb (-2.2%)')
      await expect(main(page)).not.toContainText('Pull-up')
      await expect(main(page)).not.toContainText('21,420 lb')
    })
    await step('Steps 2 and 3: register Casey Progress, finish onboarding, and choose Beginner Fundamentals', async () => {
      await logOut(page)
      await createAccountAndLogIn(page, 'Casey Progress')
      await finishOnboarding(page)
    })
    await step('Step 4: Progress is empty for the new account', async () => {
      await openProgress(page)
      await expect(main(page).getByRole('heading', { name: 'No progress to track yet' })).toBeVisible()
      await expect(main(page).getByText('Log your first workout and your volume, personal records, and strength trends will start showing up here.')).toBeVisible()
      await expect(main(page).locator('.progress-metric')).toHaveCount(0)
      await expect(picker(page)).toHaveCount(0)
      for (const text of ['Back squat', 'Bench press', 'Pull-up', '21,420 lb', '3,930 lb']) await expect(main(page)).not.toContainText(text)
    })
    await step('Step 5: Start a workout opens the weekly plan', async () => {
      await main(page).getByRole('link', { name: 'Start a workout' }).click()
      await expect(page).toHaveURL(/#\/weekly-plan$/)
      await expect(page.getByRole('heading', { level: 1, name: 'Beginner Fundamentals — Week 1' })).toBeVisible()
    })
  },

  6: async ({ page }) => {
    // The story asks for an iPhone SE (375 × 667). The mobile project is 375 wide already; desktop resizes.
    if (page.viewportSize().width > 375) await page.setViewportSize({ width: 375, height: 667 })
    await step('Setup: log in as Marcus on a phone-sized screen', () => as(page, MARCUS))
    await step('Step 1: the menu’s Progress shows the totals without sideways scrolling', async () => {
      await openProgress(page)
      await expectTotals(page, MARCUS_TOTALS)
      expect(await fitsWidth(page)).toBe(true)
    })
    await step('Step 2: Bench press, its chart and its table fit the screen', async () => {
      await picker(page).selectOption('Bench press')
      await expectExercise(page, 'Bench press', WEIGHTED, ['220 lb', '260 lb', '+44 lb (+20.4%)', '7', '12,180 lb', '4'])
      await expect(main(page).locator('.progress-chart')).toBeVisible()
      await expect(tableRows(page)).toHaveCount(7)
      expect(await fitsWidth(page)).toBe(true)
    })
    await step('Step 3: the range buttons stay on one line, and All time returns the totals', async () => {
      await rangeButton(page, '30 days').click()
      await expect(rangeButton(page, '30 days')).toHaveAttribute('aria-pressed', 'true')
      const tops = await main(page).locator('.progress-range button').evaluateAll((buttons) => buttons.map((b) => Math.round(b.getBoundingClientRect().top)))
      expect(new Set(tops).size).toBe(1)
      await rangeButton(page, 'All time').click()
      await expectTotals(page, MARCUS_TOTALS)
    })
  },

  7: async ({ page }) => {
    await step('Setup: log in as Marcus', () => as(page, MARCUS))
    await step('Step 1: a slow answer shows the loading message, then the totals', async () => {
      await page.route('**/api/exercise_progress.php**', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1500))
        await route.continue()
      })
      await openProgress(page)
      await expect(main(page).getByText('Loading your progress...', { exact: true })).toBeVisible()
      await expectTotals(page, MARCUS_TOTALS)
      await page.unroute('**/api/exercise_progress.php**')
    })
    await step('Step 2: go back to the Dashboard and block exercise_progress.php', async () => {
      await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Dashboard' }).click()
      await expect(page).toHaveURL(/#\/dashboard$/)
      await page.route('**/api/exercise_progress.php**', (route) => route.abort())
    })
    await step('Step 3: Progress shows the error and Try again, not the empty page', async () => {
      await openProgress(page)
      await expect(main(page).getByRole('alert')).toHaveText(/Couldn't load your progress\. Check your connection and try again\./)
      await expect(main(page).getByRole('button', { name: 'Try again' })).toBeVisible()
      await expect(main(page).locator('.progress-metric')).toHaveCount(0)
      await expect(main(page)).not.toContainText('No progress to track yet')
    })
    await step('Step 4: unblocking and Try again shows the totals', async () => {
      await page.unroute('**/api/exercise_progress.php**')
      await main(page).getByRole('button', { name: 'Try again' }).click()
      await expect(main(page).getByRole('alert')).toHaveCount(0)
      await expectTotals(page, MARCUS_TOTALS)
    })
  },

  8: async ({ page }) => {
    await step('Step 1: the Progress address opens the Login page when logged out', async () => {
      await page.goto('#/progress')
      await expect(page).toHaveURL(/#\/login$/)
      await expect(page.locator('body')).not.toContainText('21,420 lb')
    })
    await step('Step 2: Workout history is one click from Progress', async () => {
      await as(page, MARCUS)
      await openProgress(page)
      await main(page).getByRole('link', { name: /Workout history/ }).click()
      await expect(page).toHaveURL(/#\/progress\/history$/)
      await expect(page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Progress' })).toHaveClass(/nav-bar__link--current/)
      await expect(page.getByRole('heading', { level: 1, name: 'Workout history' })).toBeVisible()
      await expect(main(page).getByText('7 completed workouts', { exact: true })).toBeVisible()
      await expect(main(page).locator('.history-item__date').first()).toHaveText('Wednesday, October 14, 2026')
    })
    await step('Step 3: Progress in the path returns to Your progress', async () => {
      await page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: 'Progress' }).click()
      await expect(page).toHaveURL(/#\/progress$/)
      await expect(page.getByRole('heading', { level: 1, name: 'Your progress' })).toBeVisible()
    })
  },
}, { mobile: [6] })
