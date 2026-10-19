import { expect } from '@playwright/test'
import { step } from './banner.js'
import { createAccountAndLogIn, logIn, logOut } from './helpers.js'
import { acceptanceTests } from './stories.js'

// Story 9 uses the seeded riley.brooks@example.com from database/seeds/workout_history.sql: his six workouts have
// fixed past dates, which only the seed can create. Login allows 10 attempts per email every 15 minutes, so tests
// that don't test logging in reuse one Riley session (about 5 logins per run). Local runs also clear Riley's
// counter in global-setup.js; against cattle (E2E_BASE_URL), wait 15 minutes between runs.
const RILEY = { email: 'riley.brooks@example.com', password: 'Riley-Curl95!' }
let rileyCookies = null

const PAGE_ONE = [
  ['Full body C', 'Friday, October 9, 2026', '3 exercises · 9 sets'],
  ['Full body B', 'Wednesday, October 7, 2026', '3 exercises · 8 sets'],
  ['Full body A', 'Monday, October 5, 2026', '3 exercises · 9 sets'],
  ['Full body C', 'Friday, October 2, 2026', '3 exercises · 9 sets'],
]
const PAGE_TWO = [
  ['Full body B', 'Wednesday, September 30, 2026', '3 exercises · 9 sets'],
  ['Full body A', 'Monday, September 28, 2026', '3 exercises · 9 sets'],
]
// Set, reps and weight of each set, by exercise, in the order the page lists them.
const OCTOBER_9 = {
  'Split squat': [[1, 10, '25 lb'], [2, 10, '25 lb'], [3, 8, '30 lb']],
  'Incline push-up': [[1, 12, 'Bodyweight'], [2, 12, 'Bodyweight'], [3, 10, 'Bodyweight']],
  'Cable row': [[1, 10, '70 lb'], [2, 10, '70 lb'], [3, 10, '70 lb']],
}
const SEPTEMBER_28 = {
  'Goblet squat': [[1, 10, '25 lb'], [2, 10, '25 lb'], [3, 10, '25 lb']],
  'Push-up': [[1, 8, 'Bodyweight'], [2, 8, 'Bodyweight'], [3, 6, 'Bodyweight']],
  'Dumbbell row': [[1, 10, '25 lb'], [2, 10, '25 lb'], [3, 10, '25 lb']],
}

const main = (page) => page.locator('main')
const toggles = (page) => main(page).locator('.history-item__toggle')
const workoutRow = (page, name, date) => toggles(page).filter({ hasText: name }).filter({ hasText: date })
const pageButton = (page, number) => main(page).getByRole('button', { name: `Page ${number}`, exact: true })

async function logInAsRiley(page) {
  try {
    await logIn(page, RILEY)
  } catch (error) {
    if (await page.getByText('Invalid email or password.').isVisible()) {
      throw new Error('Riley Brooks is not in this database. Load database/seeds/workout_history.sql (see database/seeds/README.md).')
    }
    throw error
  }
  rileyCookies = await page.context().cookies()
}

// Signs in as Riley with the saved session when it still works, else logs in through the login page.
async function asRiley(page) {
  if (rileyCookies) {
    await page.context().addCookies(rileyCookies)
    if ((await page.request.get('api/session.php')).ok()) {
      await page.goto('#/dashboard')
      await expect(page).toHaveURL(/#\/dashboard$/)
      return
    }
  }
  await logInAsRiley(page)
}

// "Select Progress": the top navigation on a computer, the menu (three lines) on a phone.
async function openHistory(page) {
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
  await expect(page).toHaveURL(/#\/progress\/history$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Workout history' })).toBeVisible()
}

async function expectRows(page, rows) {
  await expect(main(page).locator('.history-item__name')).toHaveText(rows.map(([name]) => name))
  await expect(main(page).locator('.history-item__date')).toHaveText(rows.map(([, date]) => date))
  await expect(main(page).locator('.history-item__size')).toHaveText(rows.map(([, , size]) => size))
}

async function expectAllClosed(page, count) {
  await expect(toggles(page)).toHaveCount(count)
  for (const toggle of await toggles(page).all()) await expect(toggle).toHaveAttribute('aria-expanded', 'false')
}

// The open workout's tables: one per exercise, captioned with its name, with Set / Reps / Weight rows.
async function expectSets(page, exercises) {
  const tables = main(page).locator('.history-item--open .history-sets')
  await expect(tables.locator('caption')).toHaveText(Object.keys(exercises))
  for (const [name, sets] of Object.entries(exercises)) {
    const table = tables.filter({ has: page.locator('caption').getByText(name, { exact: true }) })
    await expect(table.locator('thead th')).toHaveText(['Set', 'Reps', 'Weight'])
    await expect(table.locator('tbody td')).toHaveText(sets.flat().map(String))
  }
}

async function expectPageOne(page) {
  await expect(main(page).getByText('6 completed workouts', { exact: true })).toBeVisible()
  await expectRows(page, PAGE_ONE)
}

const fitsWidth = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)

// Story #9 test 5's setup, as in story #86's spec: Strength, Beginner, Full gym access, then Beginner Fundamentals.
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

acceptanceTests('9-workout-history.md', {
  1: async ({ page }) => {
    await step('Setup: log in as Riley', () => asRiley(page))
    await step('Step 1: Progress opens Workout history with 6 completed workouts', async () => {
      await openHistory(page)
      await expect(page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Progress' })).toHaveClass(/nav-bar__link--current/)
      await expect(page.locator('.breadcrumb__crumb')).toHaveText(['Progress', 'Workout history'])
      await expect(main(page).getByText('6 completed workouts', { exact: true })).toBeVisible()
    })
    await step('Step 2: the four newest workouts are listed, each closed', async () => {
      await expectRows(page, PAGE_ONE)
      await expectAllClosed(page, 4)
    })
    await step('Step 3: the pager shows 1–4 of 6 with page 1 current', async () => {
      await expect(main(page).getByText('Showing 1–4 of 6 workouts', { exact: true })).toBeVisible()
      await expect(pageButton(page, 1)).toHaveAttribute('aria-current', 'page')
      await expect(pageButton(page, 2)).toBeVisible()
      await expect(main(page).getByRole('button', { name: 'Previous' })).toBeDisabled()
    })
  },

  2: async ({ page }) => {
    await step('Setup: log in as Riley and open Workout history', async () => {
      await asRiley(page)
      await openHistory(page)
    })
    await step('Step 1: Full body C (October 9) shows every set', async () => {
      await workoutRow(page, 'Full body C', 'Friday, October 9, 2026').click()
      await expect(workoutRow(page, 'Full body C', 'Friday, October 9, 2026')).toHaveAttribute('aria-expanded', 'true')
      await expectSets(page, OCTOBER_9)
    })
    await step('Step 2: opening Full body B (October 7) closes Full body C', async () => {
      await workoutRow(page, 'Full body B', 'Wednesday, October 7, 2026').click()
      await expect(workoutRow(page, 'Full body B', 'Wednesday, October 7, 2026')).toHaveAttribute('aria-expanded', 'true')
      const tables = main(page).locator('.history-item--open .history-sets')
      await expect(tables.locator('caption')).toHaveText(['Hip hinge', 'Dumbbell press', 'Lat pulldown'])
      const latPulldown = tables.filter({ has: page.locator('caption').getByText('Lat pulldown', { exact: true }) })
      await expect(latPulldown.locator('tbody td')).toHaveText(['1', '10', '80 lb', '2', '8', '90 lb'])
      await expect(workoutRow(page, 'Full body C', 'Friday, October 9, 2026')).toHaveAttribute('aria-expanded', 'false')
    })
    await step('Step 3: selecting Full body B again closes it', async () => {
      await workoutRow(page, 'Full body B', 'Wednesday, October 7, 2026').click()
      await expectAllClosed(page, 4)
      await expect(main(page).locator('.history-sets')).toHaveCount(0)
    })
  },

  3: async ({ page }) => {
    await step('Setup: log in as Riley and open Workout history', async () => {
      await asRiley(page)
      await openHistory(page)
      await expect(main(page).getByText('Showing 1–4 of 6 workouts', { exact: true })).toBeVisible()
    })
    await step('Step 1: page 2 shows the two oldest workouts', async () => {
      await pageButton(page, 2).click()
      await expect(main(page).getByText('Showing 5–6 of 6 workouts', { exact: true })).toBeVisible()
      await expect(pageButton(page, 2)).toHaveAttribute('aria-current', 'page')
      await expect(main(page).getByRole('button', { name: 'Next' })).toBeDisabled()
      await expectRows(page, PAGE_TWO)
    })
    await step('Step 2: Full body A (September 28) shows every set', async () => {
      await workoutRow(page, 'Full body A', 'Monday, September 28, 2026').click()
      await expectSets(page, SEPTEMBER_28)
    })
    await step('Step 3: Previous returns to page 1', async () => {
      await main(page).getByRole('button', { name: 'Previous' }).click()
      await expect(main(page).getByText('Showing 1–4 of 6 workouts', { exact: true })).toBeVisible()
      await expectRows(page, PAGE_ONE)
    })
  },

  4: async ({ page }) => {
    await step('Setup: log in as Riley and open Workout history', async () => {
      await asRiley(page)
      await openHistory(page)
      await expect(main(page).getByText('6 completed workouts', { exact: true })).toBeVisible()
    })
    await step('Step 1: log out from the account menu', async () => {
      await page.getByRole('button', { name: 'Open account menu' }).click()
      await page.getByRole('menuitem', { name: 'Log out' }).click()
      await expect(page.getByText('You are logged out.')).toBeVisible()
    })
    await step('Step 2: logging back in shows the same workouts', async () => {
      await logInAsRiley(page)
      await openHistory(page)
      await expectPageOne(page)
    })
    await step('Step 3: refreshing keeps them', async () => {
      await page.reload()
      await expect(page.getByRole('heading', { level: 1, name: 'Workout history' })).toBeVisible()
      await expectPageOne(page)
    })
  },

  5: async ({ page }) => {
    await step('Setup: register Casey Fresh, finish onboarding, and choose Beginner Fundamentals', async () => {
      await createAccountAndLogIn(page, 'Casey Fresh')
      await finishOnboarding(page)
    })
    await step('Step 1: Workout history is empty', async () => {
      await openHistory(page)
      await expect(main(page).getByText('0 completed workouts', { exact: true })).toBeVisible()
      await expect(main(page).getByRole('heading', { name: 'No workouts logged yet' })).toBeVisible()
      await expect(main(page).getByText('Finish your first workout and it will show up here with every exercise, set, and weight you logged.')).toBeVisible()
      await expect(main(page).getByRole('link', { name: 'Start a workout' })).toBeVisible()
    })
    await step('Step 2: no list, no pager and none of Riley’s workouts', async () => {
      await expect(toggles(page)).toHaveCount(0)
      await expect(main(page).getByRole('navigation', { name: 'Workout history pages' })).toHaveCount(0)
      await expect(main(page)).not.toContainText('Full body C')
      await expect(main(page)).not.toContainText('October 9, 2026')
    })
    await step('Step 3: Start a workout opens the weekly plan', async () => {
      await main(page).getByRole('link', { name: 'Start a workout' }).click()
      await expect(page).toHaveURL(/#\/weekly-plan$/)
      await expect(page.getByRole('heading', { level: 1, name: 'Beginner Fundamentals — Week 1' })).toBeVisible()
    })
    await step('Step 4: Riley still has 6 completed workouts', async () => {
      await logOut(page)
      await logInAsRiley(page)
      await openHistory(page)
      await expect(main(page).getByText('6 completed workouts', { exact: true })).toBeVisible()
    })
  },

  6: async ({ page }) => {
    // The story asks for an iPhone SE (375 × 667). The mobile project is 375 wide already; desktop resizes.
    if (page.viewportSize().width > 375) await page.setViewportSize({ width: 375, height: 667 })
    await step('Setup: log in as Riley on a phone-sized screen', () => asRiley(page))
    await step('Step 1: the menu’s Progress opens Workout history', async () => {
      await openHistory(page)
      await expect(main(page).getByText('6 completed workouts', { exact: true })).toBeVisible()
    })
    await step('Step 2: every row shows name, date and size without sideways scrolling', async () => {
      await expectRows(page, PAGE_ONE)
      expect(await fitsWidth(page)).toBe(true)
    })
    await step('Step 3: Full body C (October 9) tables fit the screen', async () => {
      await workoutRow(page, 'Full body C', 'Friday, October 9, 2026').click()
      await expectSets(page, OCTOBER_9)
      expect(await fitsWidth(page)).toBe(true)
    })
    await step('Step 4: page 2 shows 5–6 of 6', async () => {
      await pageButton(page, 2).click()
      await expect(main(page).getByText('Showing 5–6 of 6 workouts', { exact: true })).toBeVisible()
    })
  },

  7: async ({ page }) => {
    await step('Setup: log in as Riley', () => asRiley(page))
    await step('Step 1: a slow answer shows the loading message, then the list', async () => {
      await page.route('**/api/workout_history.php', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1500))
        await route.continue()
      })
      await openHistory(page)
      await expect(main(page).getByText('Loading your workout history...', { exact: true })).toBeVisible()
      await expectPageOne(page)
      await page.unroute('**/api/workout_history.php')
    })
    await step('Step 2: go back to the Dashboard and block workout_history.php', async () => {
      await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Dashboard' }).click()
      await expect(page).toHaveURL(/#\/dashboard$/)
      await page.route('**/api/workout_history.php', (route) => route.abort())
    })
    await step('Step 3: Progress shows the error and Try again, not the empty state', async () => {
      await openHistory(page)
      await expect(main(page).getByRole('alert')).toHaveText(/Couldn't load your workout history\. Check your connection and try again\./)
      await expect(main(page).getByRole('button', { name: 'Try again' })).toBeVisible()
      await expect(main(page)).not.toContainText('No workouts logged yet')
    })
    await step('Step 4: unblocking and Try again shows the workouts', async () => {
      await page.unroute('**/api/workout_history.php')
      await main(page).getByRole('button', { name: 'Try again' }).click()
      await expect(main(page).getByRole('alert')).toHaveCount(0)
      await expectPageOne(page)
    })
  },

  8: async ({ page }) => {
    await step('Step 1: the history address opens the Login page when logged out', async () => {
      await page.goto('#/progress/history')
      await expect(page).toHaveURL(/#\/login$/)
      await expect(page.locator('body')).not.toContainText('Full body C')
    })
    await step('Step 2: logging in as Riley and selecting Progress shows 6 completed workouts', async () => {
      await logInAsRiley(page)
      await openHistory(page)
      await expect(main(page).getByText('6 completed workouts', { exact: true })).toBeVisible()
    })
  },
}, { mobile: [6] })
