import { expect } from '@playwright/test'
import { createAccount, createAccountAndLogIn, logIn, logOut } from './helpers.js'
import { followContext, step } from './banner.js'
import { acceptanceTests } from './stories.js'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec']

function planRow(page, name) {
  return page.locator('.plan-list__item').filter({ has: page.getByText(name, { exact: true }) })
}

function topNav(page) {
  return page.getByRole('navigation', { name: 'Primary' })
}

function dayCards(page) {
  return page.locator('.weekly-plan__days > li')
}

// Wednesday of the current week at noon. Pinning the browser's clock to a weekday keeps "today" a
// training day for every plan, so the weekly plan checks give the same result on any day of the week.
function wednesdayThisWeek() {
  const now = new Date()
  const wednesday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12)
  wednesday.setDate(wednesday.getDate() - ((wednesday.getDay() + 6) % 7) + 2)
  return wednesday
}

// "Week of Sept 28 – Oct 4" for the Monday–Sunday week containing `date`.
function weekOfLabel(date) {
  const monday = new Date(date)
  monday.setDate(date.getDate() - ((date.getDay() + 6) % 7))
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const end =
    sunday.getMonth() === monday.getMonth() ? `${sunday.getDate()}` : `${MONTHS[sunday.getMonth()]} ${sunday.getDate()}`
  return `Week of ${MONTHS[monday.getMonth()]} ${monday.getDate()} – ${end}`
}

async function expectWeeklyPlan(page, planName) {
  await expect(page).toHaveURL(/#\/weekly-plan$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(`${planName} — Week 1`)
}

async function selectFirstPlan(page, planName) {
  await page.goto('#/plans')
  await planRow(page, planName).getByRole('button', { name: 'Select' }).click()
  await expectWeeklyPlan(page, planName)
}

const switchDialog = (page) => page.getByRole('dialog')

acceptanceTests(
  '72-select-workout-plan.md',
  {
    1: async ({ page }) => {
      const split = page.locator('.plan-split__day')

      await step('Setup: open the plan library', async () => {
        await page.goto('#/plans')
      })

      await step('Step 1: the library lists 10 plans with their details and a Select button', async () => {
        await expect(page.getByRole('heading', { name: 'Workout plan library' })).toBeVisible()
        await expect(page.getByText('Browse all training programs.')).toBeVisible()
        const rows = page.locator('.plan-list__item')
        await expect(rows).toHaveCount(10)
        for (const row of await rows.all()) {
          await expect(row.locator('.plan-row__name')).not.toBeEmpty()
          await expect(row.locator('.plan-row__meta')).toHaveText(/^(Beginner|Intermediate|Advanced) · \S+ weeks$/)
          await expect(row.locator('.plan-row__frequency')).toHaveText(/^\d days\/wk$/)
          await expect(row.getByRole('button', { name: 'Select' })).toBeVisible()
        }
        await expect(planRow(page, 'Push Pull Legs')).toContainText('Intermediate · 6-8 weeks')
        await expect(planRow(page, 'Push Pull Legs')).toContainText('5 days/wk')
      })

      await step('Step 2: clicking the "Push Pull Legs" row opens its details', async () => {
        await planRow(page, 'Push Pull Legs').getByRole('link').click()
        await expect(page).toHaveURL(/#\/plans\/\d+$/)
        await expect(page.getByRole('heading', { level: 1 })).toHaveText('Push Pull Legs')
        await expect(page.getByText('5 days/wk')).toBeVisible()
        await expect(page.getByText('Intermediate · 6-8 weeks')).toBeVisible()
        await expect(page.locator('.plan-details__description')).toHaveText(
          /^A balanced strength split rotating push, pull, and leg days/,
        )
      })

      await step('Step 3: the weekly split lists Push, Pull and Legs, then "Start this plan"', async () => {
        await expect(page.getByRole('heading', { name: 'Weekly split' })).toBeVisible()
        await expect(split).toHaveText([
          /^Push\s*Chest, shoulders, triceps\s*~45 min$/,
          /^Pull\s*Back, biceps\s*~45 min$/,
          /^Legs\s*Quads, hamstrings, glutes\s*~50 min$/,
        ])
        await expect(page.getByRole('button', { name: 'Start this plan' })).toBeVisible()
      })

      await step('Step 4: "Plans" in the breadcrumb returns to the library', async () => {
        await page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: 'Plans' }).click()
        await expect(page).toHaveURL(/#\/plans$/)
        await expect(page.getByRole('heading', { name: 'Workout plan library' })).toBeVisible()
      })

      await step('Step 5: "Bodyweight Basics" shows its own details', async () => {
        await planRow(page, 'Bodyweight Basics').getByRole('link').click()
        await expect(page.getByRole('heading', { level: 1 })).toHaveText('Bodyweight Basics')
        await expect(page.getByText('Beginner · 4 weeks')).toBeVisible()
        await expect(page.getByText('3 days/wk')).toBeVisible()
        await expect(split).toHaveText([/^Push.*~30 min$/, /^Pull.*~30 min$/, /^Legs.*~30 min$/])
      })
    },

    2: async ({ page }) => {
      const today = wednesdayThisWeek()

      await step('Setup: create an account and log in', async () => {
        await page.clock.setFixedTime(today)
        await createAccountAndLogIn(page, 'Plans Tester A')
      })

      await step('Step 1: logged in, the Select buttons work and there is no login message', async () => {
        await page.goto('#/plans')
        await expect(planRow(page, 'Push Pull Legs').getByRole('button', { name: 'Select' })).toBeEnabled()
        await expect(page.getByText('to choose a plan')).toHaveCount(0)
      })

      await step('Step 2: selecting "Push Pull Legs" opens it as your weekly plan', async () => {
        await planRow(page, 'Push Pull Legs').getByRole('button', { name: 'Select' }).click()
        await expect(switchDialog(page)).toHaveCount(0)
        await expectWeeklyPlan(page, 'Push Pull Legs')
        await expect(page.getByText(weekOfLabel(today))).toBeVisible()
        await expect(topNav(page).getByRole('link', { name: 'Workouts' })).toHaveClass(/nav-bar__link--current/)

        const cards = dayCards(page)
        await expect(cards.locator('.day-card__weekday')).toHaveText(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'])
        for (const name of await cards.locator('.day-card__name').allTextContents()) {
          expect(['Push', 'Pull', 'Legs', 'Rest day']).toContain(name)
        }
        const todayCard = cards.nth(2)
        await expect(todayCard).toHaveAttribute('aria-current', 'date')
        await expect(todayCard).toHaveClass(/day-card--today/)
        await expect(todayCard.locator('.day-card__status')).toHaveText('Today')
        const todaysWorkout = await todayCard.locator('.day-card__name').textContent()
        await expect(page.locator('.today-workout')).toContainText("Today's workout")
        await expect(page.locator('#today-workout-name')).toHaveText(todaysWorkout)
      })

      await step('Step 3: the library now shows "Current plan", greyed out', async () => {
        await topNav(page).getByRole('link', { name: 'Plans' }).click()
        const current = planRow(page, 'Push Pull Legs').getByRole('button', { name: 'Current plan' })
        await expect(current).toBeVisible()
        await expect(current).toBeDisabled()
      })

      await step('Step 4: its details page shows "This is your current plan", greyed out', async () => {
        await planRow(page, 'Push Pull Legs').getByRole('link').click()
        const detailsButton = page.getByRole('button', { name: 'This is your current plan' })
        await expect(detailsButton).toBeVisible()
        await expect(detailsButton).toBeDisabled()
      })

      await step('Step 5: "Workouts" returns to the weekly plan', async () => {
        await topNav(page).getByRole('link', { name: 'Workouts' }).click()
        await expectWeeklyPlan(page, 'Push Pull Legs')
      })
    },

    3: async ({ page }) => {
      const dialog = switchDialog(page)
      const selectFullBody = planRow(page, 'Full Body Strength').getByRole('button', { name: 'Select' })

      await step('Setup: log in with "Push Pull Legs" as your plan (where Acceptance Test 2 ends)', async () => {
        await createAccountAndLogIn(page, 'Plans Tester A')
        await selectFirstPlan(page, 'Push Pull Legs')
      })

      await step('Step 1: selecting "Full Body Strength" shows the switch warning', async () => {
        await page.goto('#/plans')
        await selectFullBody.click()
        await expect(dialog.getByRole('heading')).toHaveText('Switch to Full Body Strength?')
        await expect(dialog).toContainText(
          "You're partway through Week 1 of Push Pull Legs. Switching plans now will reset this week's progress.",
        )
        await expect(dialog).toContainText('Your finished workouts stay in your history.')
        await expect(dialog.getByRole('button', { name: 'Switch plan' })).toBeVisible()
        await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeVisible()
      })

      await step('Step 2: Cancel closes it and keeps "Push Pull Legs"', async () => {
        await dialog.getByRole('button', { name: 'Cancel' }).click()
        await expect(dialog).toHaveCount(0)
        await expect(planRow(page, 'Push Pull Legs').getByRole('button', { name: 'Current plan' })).toBeVisible()
      })

      await step('Step 3: Escape closes it without changing the plan', async () => {
        await selectFullBody.click()
        await expect(dialog).toBeVisible()
        await page.keyboard.press('Escape')
        await expect(dialog).toHaveCount(0)
      })

      await step('Step 4: clicking the dark area outside closes it without changing the plan', async () => {
        await selectFullBody.click()
        await expect(dialog).toBeVisible()
        // The nav bar stays above the backdrop, so click the dark area near the bottom-left corner.
        const backdrop = page.locator('.modal-backdrop')
        const { height } = await backdrop.boundingBox()
        await backdrop.click({ position: { x: 20, y: height - 20 } })
        await expect(dialog).toHaveCount(0)
        await expect(planRow(page, 'Push Pull Legs').getByRole('button', { name: 'Current plan' })).toBeVisible()
      })

      await step('Step 5: "Start this plan" on the details page shows the same warning', async () => {
        await planRow(page, 'Full Body Strength').getByRole('link').click()
        await page.getByRole('button', { name: 'Start this plan' }).click()
        await expect(dialog.getByRole('heading')).toHaveText('Switch to Full Body Strength?')
      })

      await step('Step 6: "Switch plan" opens the "Full Body Strength" week', async () => {
        await dialog.getByRole('button', { name: 'Switch plan' }).click()
        await expectWeeklyPlan(page, 'Full Body Strength')
        const names = await dayCards(page).locator('.day-card__name').allTextContents()
        expect(names).toEqual(expect.arrayContaining(['Full body A', 'Full body B', 'Full body C']))
      })

      await step('Step 7: the library shows the new current plan, and the old one can be selected', async () => {
        await topNav(page).getByRole('link', { name: 'Plans' }).click()
        await expect(planRow(page, 'Full Body Strength').getByRole('button', { name: 'Current plan' })).toBeDisabled()
        await expect(planRow(page, 'Push Pull Legs').getByRole('button', { name: 'Select' })).toBeEnabled()
      })
    },

    4: async ({ page, browser, baseURL }) => {
      let accountA

      await step('Setup: log in with "Full Body Strength" as your plan (where Acceptance Test 3 ends)', async () => {
        accountA = await createAccountAndLogIn(page, 'Plans Tester A')
        await selectFirstPlan(page, 'Full Body Strength')
      })

      await step('Step 1: the plan is still there after a refresh', async () => {
        await page.reload()
        await expectWeeklyPlan(page, 'Full Body Strength')
      })

      await step('Step 2: and after closing and reopening the browser', async () => {
        // A fresh browser context has no cookies, like reopening the browser.
        const reopened = await browser.newContext({ baseURL })
        await followContext(reopened)
        const page2 = await reopened.newPage()
        await page2.goto('#/weekly-plan')
        await expect(page2.getByText('to see your weekly plan.')).toBeVisible()
        await logIn(page2, accountA)
        await page2.goto('#/weekly-plan')
        await expectWeeklyPlan(page2, 'Full Body Strength')
        await reopened.close()
      })

      await step('Step 3: logged out, the weekly plan asks you to log in', async () => {
        await logOut(page)
        await page.goto('#/weekly-plan')
        await expect(page.locator('.weekly-plan')).toHaveText('Log in to see your weekly plan.')
      })

      await step('Step 4: logging back in brings the plan back', async () => {
        await logIn(page, accountA)
        await page.goto('#/weekly-plan')
        await expectWeeklyPlan(page, 'Full Body Strength')
      })

      await step('Step 5: a second account starts with no plan', async () => {
        await logOut(page)
        const accountB = await createAccount(page, 'Plans Tester B')
        await logIn(page, accountB)
        await page.goto('#/weekly-plan')
        await expect(page.locator('.weekly-plan')).toHaveText("You haven't picked a plan yet. Browse the plan library.")
        await expect(page.getByText('Full Body Strength')).toHaveCount(0)
      })

      await step('Step 6: the second account picks "Glute Focus"', async () => {
        await page.getByRole('link', { name: 'Browse the plan library' }).click()
        await planRow(page, 'Glute Focus').getByRole('button', { name: 'Select' }).click()
        await expectWeeklyPlan(page, 'Glute Focus')
      })

      await step("Step 7: the first account's plan is unchanged", async () => {
        await logOut(page)
        await logIn(page, accountA)
        await page.goto('#/weekly-plan')
        await expectWeeklyPlan(page, 'Full Body Strength')
      })
    },
  },
  { mobile: [1, 2] },
)
