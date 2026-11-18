import { expect } from '@playwright/test'
import { addPersonalDetails, createAccount, createAccountAndLogIn, logIn, logOut } from './helpers.js'
import { followContext, step } from './banner.js'
import { acceptanceTests } from './stories.js'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec']

// The plan library since #129: a "Current plan" card, the "Recommended for you" cards, and the rest under "More plans"
// (a row that starts closed). Every card opens the plan's details, where "Start this plan" chooses it.
const escapeRe = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
function planCard(page, name) {
  return page.locator('.plan-lib__card').filter({ has: page.locator('.plan-lib__card-title', { hasText: new RegExp(`^${escapeRe(name)}`) }) })
}
const currentPlanCard = (page) => page.locator('.plan-lib__current')
const morePlans = (page) => page.locator('.plan-lib__more')

// Opens a plan's details from the library, opening "More plans" first when the plan is in there.
async function openPlan(page, name) {
  await expect(page.getByRole('heading', { level: 1, name: 'Plan library' })).toBeVisible()
  await expect(planCard(page, name)).toBeAttached() // the plans have loaded
  // Open "More plans" only if it's closed (clicking an open one would close it again).
  if (!(await planCard(page, name).isVisible()) && (await morePlans(page).count())
      && !(await morePlans(page).evaluate((details) => details.open))) {
    await morePlans(page).locator('summary').click()
  }
  await planCard(page, name).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(name)
}

function topNav(page) {
  return page.getByRole('navigation', { name: 'Primary' })
}

// "Plans" or "Workouts" in the menu. On phones the links sit behind "Menu".
async function goTo(page, label) {
  const link = topNav(page).getByRole('link', { name: label, exact: true })
  if (await link.isVisible()) {
    await link.click()
  } else {
    await page.getByRole('button', { name: 'Open navigation menu' }).click()
    await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('link', { name: label, exact: true }).click()
  }
}

// The current section is marked in the sidebar, or in the phone menu (which is closed again afterwards).
async function expectCurrentNavLink(page, label) {
  const link = topNav(page).getByRole('link', { name: label, exact: true })
  if (await link.isVisible()) {
    await expect(link).toHaveAttribute('aria-current', /page|location/)
  } else {
    await page.getByRole('button', { name: 'Open navigation menu' }).click()
    const menu = page.getByRole('navigation', { name: 'Mobile navigation' })
    await expect(menu.getByRole('link', { name: label, exact: true })).toHaveAttribute('aria-current', /page|location/)
    await page.getByRole('button', { name: 'Close navigation menu' }).first().click()
  }
}

// The onboarding every setup goes through after logging in: "Strength", "Intermediate" and "Full gym access"
// (so no plan needs equipment you don't have), ending on "Choose your workout plan".
async function finishOnboarding(page) {
  await expect(page).toHaveURL(/#\/goal$/)
  await expect(page.locator('.ob-step')).toHaveAttribute('aria-busy', 'false')
  await page.getByRole('button', { name: /^Strength/ }).click()
  await page.getByRole('button', { name: 'Save goal' }).click()
  await expect(page.getByRole('heading', { name: 'How experienced are you?' })).toBeVisible()
  await expect(page.locator('.ob-step')).toHaveAttribute('aria-busy', 'false')
  await page.getByRole('button', { name: /^Intermediate/ }).click()
  await page.getByRole('button', { name: 'Save and continue' }).click()
  await expect(page.getByRole('heading', { name: 'What equipment can you use?' })).toBeVisible()
  await expect(page.locator('.ob-step')).toHaveAttribute('aria-busy', 'false')
  await page.getByRole('button', { name: 'Full gym access' }).click()
  await page.getByRole('button', { name: 'Save and continue' }).click()
  await expect(page).toHaveURL(/#\/recommended$/)
  await expect(page.getByRole('heading', { name: 'Choose your workout plan' })).toBeVisible()
}

const YOUR_SETUP = 'Strength · Intermediate · Full gym access'

async function newOnboardedAccount(page, fullName) {
  const account = await createAccountAndLogIn(page, fullName)
  await finishOnboarding(page)
  return account
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
  await expect(page.getByRole('heading', { level: 1 })).toContainText(`${planName} — Week 1`)
}

// Selecting or switching a plan opens the Dashboard, whose "Getting started" checklist names the plan.
async function expectDashboardFollowing(page, planName) {
  await expect(page).toHaveURL(/#\/dashboard$/)
  await expect(page.locator('.dashboard-checklist')).toContainText(`You're following ${planName}`)
}

async function selectFirstPlan(page, planName) {
  await page.goto('#/plans')
  await openPlan(page, planName)
  await page.getByRole('button', { name: 'Start this plan' }).click()
  await expectDashboardFollowing(page, planName)
}

const switchDialog = (page) => page.getByRole('dialog')

acceptanceTests(
  '72-select-workout-plan.md',
  {
    1: async ({ page }) => {
      const split = page.locator('.plan-split__day')

      await step('Setup: log in, finish onboarding, then "Browse all plans" opens the plan library', async () => {
        await newOnboardedAccount(page, 'Plans Viewer')
        await expect(page.getByRole('status').filter({ hasText: 'Your setup is saved.' })).toContainText(
          'Pick a plan to start your first week.',
        )
        await expect(page.locator('.your-setup .your-setup__value')).toHaveText(YOUR_SETUP)
        await expect(page.locator('.your-setup').getByRole('link', { name: 'Edit' })).toBeVisible()
        await page.getByRole('link', { name: 'Browse all plans' }).click()
        await expect(page).toHaveURL(/#\/plans$/)
        await expect(page.getByRole('heading', { level: 1, name: 'Plan library' })).toBeVisible()
      })

      await step('Step 1: 5 plans under "Recommended for you", 5 more under "More plans", each with its details', async () => {
        await expect(page.getByRole('heading', { name: 'Recommended for you' })).toBeVisible()
        await expect(page.locator('.plan-lib__group .plan-lib__card')).toHaveCount(5)
        await expect(morePlans(page).locator('summary')).toHaveText(/^More plans\s*5 programs/)
        await expect(morePlans(page).locator('.plan-lib__card').first()).toBeHidden()
        await morePlans(page).locator('summary').click()
        await expect(morePlans(page).locator('.plan-lib__card')).toHaveCount(5)
        const cards = page.locator('.plan-lib__card')
        await expect(cards).toHaveCount(10)
        for (const card of await cards.all()) {
          await expect(card.locator('.plan-lib__card-title')).not.toBeEmpty()
          await expect(card.locator('small')).toHaveText(/^(Beginner|Intermediate|Advanced) · \d days\/week · \S+ weeks$/)
        }
        await expect(planCard(page, 'Push Pull Legs')).toContainText('Intermediate · 5 days/week · 6-8 weeks')
      })

      await step('Step 2: clicking the "Push Pull Legs" card opens its details', async () => {
        await planCard(page, 'Push Pull Legs').click()
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

      await step('Step 4: "Back to plan library" returns to the library', async () => {
        await page.getByRole('link', { name: 'Back to plan library' }).click()
        await expect(page).toHaveURL(/#\/plans$/)
        await expect(page.getByRole('heading', { level: 1, name: 'Plan library' })).toBeVisible()
      })

      await step('Step 5: "Bodyweight Basics", under "More plans", shows its own details', async () => {
        await openPlan(page, 'Bodyweight Basics')
        await expect(page.getByText('Beginner · 4 weeks')).toBeVisible()
        await expect(page.getByText('3 days/wk')).toBeVisible()
        await expect(split).toHaveText([/^Push.*~30 min$/, /^Pull.*~30 min$/, /^Legs.*~30 min$/])
      })
    },

    2: async ({ page }) => {
      const today = wednesdayThisWeek()

      await step('Setup: create an account, log in and finish onboarding', async () => {
        await page.clock.setFixedTime(today)
        await newOnboardedAccount(page, 'Plans Tester A')
      })

      await step('Step 1: "Browse all plans" opens the library, and "Push Pull Legs" opens its details', async () => {
        await page.getByRole('link', { name: 'Browse all plans' }).click()
        await expect(page).toHaveURL(/#\/plans$/)
        await expect(currentPlanCard(page)).toHaveCount(0)
        await openPlan(page, 'Push Pull Legs')
        await expect(page.getByRole('button', { name: 'Start this plan' })).toBeEnabled()
      })

      await step('Step 2: "Start this plan" opens the Dashboard, then "Workouts" shows it as your weekly plan', async () => {
        await page.getByRole('button', { name: 'Start this plan' }).click()
        await expect(switchDialog(page)).toHaveCount(0)
        await expectDashboardFollowing(page, 'Push Pull Legs')
        await goTo(page, 'Workouts')
        await expectWeeklyPlan(page, 'Push Pull Legs')
        await expect(page.getByText(weekOfLabel(today))).toBeVisible()
        await expectCurrentNavLink(page, 'Workouts')

        const cards = dayCards(page)
        // "MON 16" … "WED 18 · Today": the weekday, the date and, on today's card, "· Today".
        await expect(cards.locator('.day-card__weekday')).toHaveText(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day) => new RegExp(`^${day} \\d+`)))
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

      await step('Step 3: the library now starts with a "Current plan" card for "Push Pull Legs"', async () => {
        await goTo(page, 'Plans')
        await expect(currentPlanCard(page).locator('.plan-lib__kicker')).toHaveText(/^current plan$/i)
        await expect(currentPlanCard(page).getByRole('heading')).toHaveText('Push Pull Legs')
        await expect(planCard(page, 'Push Pull Legs')).toHaveCount(0)
      })

      await step('Step 4: "View plan" shows "This is your current plan", greyed out', async () => {
        await currentPlanCard(page).getByRole('link', { name: /View plan/ }).click()
        const detailsButton = page.getByRole('button', { name: 'This is your current plan' })
        await expect(detailsButton).toBeVisible()
        await expect(detailsButton).toBeDisabled()
      })

      await step('Step 5: "Workouts" returns to the weekly plan', async () => {
        await goTo(page, 'Workouts')
        await expectWeeklyPlan(page, 'Push Pull Legs')
      })
    },

    3: async ({ page }) => {
      const dialog = switchDialog(page)
      // From the library: open "Full Body Strength" and select "Start this plan".
      const selectFullBody = { click: async () => {
        await goTo(page, 'Plans')
        await openPlan(page, 'Full Body Strength')
        await page.getByRole('button', { name: 'Start this plan' }).click()
      } }
      const stillPushPullLegs = async () => {
        await goTo(page, 'Plans')
        await expect(currentPlanCard(page).getByRole('heading')).toHaveText('Push Pull Legs')
      }

      await step('Setup: log in with "Push Pull Legs" as your plan (where Acceptance Test 2 ends)', async () => {
        await newOnboardedAccount(page, 'Plans Tester A')
        await selectFirstPlan(page, 'Push Pull Legs')
      })

      await step('Step 1: "Start this plan" on "Full Body Strength" shows the switch warning', async () => {
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
        await stillPushPullLegs()
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
        // The dark area near the bottom-left corner (the backdrop now also covers the nav bar).
        const backdrop = page.locator('.modal-backdrop')
        const { height } = await backdrop.boundingBox()
        await backdrop.click({ position: { x: 20, y: height - 20 } })
        await expect(dialog).toHaveCount(0)
        await stillPushPullLegs()
      })

      await step('Step 5: "Start this plan" again shows the same warning', async () => {
        await selectFullBody.click()
        await expect(dialog.getByRole('heading')).toHaveText('Switch to Full Body Strength?')
      })

      await step('Step 6: "Switch plan" opens the Dashboard, then "Workouts" shows the "Full Body Strength" week', async () => {
        await dialog.getByRole('button', { name: 'Switch plan' }).click()
        await expectDashboardFollowing(page, 'Full Body Strength')
        await goTo(page, 'Workouts')
        await expectWeeklyPlan(page, 'Full Body Strength')
        const names = await dayCards(page).locator('.day-card__name').allTextContents()
        expect(names).toEqual(expect.arrayContaining(['Full body A', 'Full body B', 'Full body C']))
      })

      await step('Step 7: the library shows the new current plan, and the old one can be chosen again', async () => {
        await goTo(page, 'Plans')
        await expect(currentPlanCard(page).getByRole('heading')).toHaveText('Full Body Strength')
        await openPlan(page, 'Push Pull Legs')
        await expect(page.getByRole('button', { name: 'Start this plan' })).toBeEnabled()
      })
    },

    4: async ({ page, browser, baseURL }) => {
      let accountA

      await step('Setup: log in with "Full Body Strength" as your plan (where Acceptance Test 3 ends)', async () => {
        accountA = await newOnboardedAccount(page, 'Plans Tester A')
        await selectFirstPlan(page, 'Full Body Strength')
      })

      await step('Step 1: "Workouts" shows the plan, and it stays after a refresh', async () => {
        await goTo(page, 'Workouts')
        await expectWeeklyPlan(page, 'Full Body Strength')
        await page.reload()
        await expectWeeklyPlan(page, 'Full Body Strength')
      })

      await step('Step 2: and after closing and reopening the browser', async () => {
        // A fresh browser context has no cookies, like reopening the browser.
        const reopened = await browser.newContext({ baseURL })
        await followContext(reopened)
        const page2 = await reopened.newPage()
        await page2.goto('#/weekly-plan')
        // The card says "If you're asked to log in, log in": the app now opens the login page.
        await expect(page2.getByRole('heading', { name: 'Log in to GymRank' })).toBeVisible()
        await logIn(page2, accountA)
        await page2.goto('#/weekly-plan')
        await expectWeeklyPlan(page2, 'Full Body Strength')
        await reopened.close()
      })

      await step('Step 3: logged out, the weekly plan link opens the login page', async () => {
        await logOut(page)
        await page.goto('#/weekly-plan')
        await expect(page).toHaveURL(/#\/login$/)
        await expect(page.getByRole('heading', { name: 'Log in to GymRank' })).toBeVisible()
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
        await addPersonalDetails(page)
        await finishOnboarding(page)
        await page.goto('#/weekly-plan')
        await expect(page.getByRole('heading', { name: 'No workout plan selected yet' })).toBeVisible()
        await expect(page.getByRole('link', { name: 'Browse workout plans' })).toBeVisible()
        await expect(page.getByText('Full Body Strength')).toHaveCount(0)
      })

      await step('Step 6: the second account picks "Glute Focus"', async () => {
        await page.getByRole('link', { name: 'Browse workout plans' }).click()
        await openPlan(page, 'Glute Focus')
        await page.getByRole('button', { name: 'Start this plan' }).click()
        await expectDashboardFollowing(page, 'Glute Focus')
        await page.goto('#/weekly-plan')
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
